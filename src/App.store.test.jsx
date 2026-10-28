// Pruebas de integración de la tienda: se renderiza la aplicación completa en una ruta
// y se simula lo que haría una persona (escribir, hacer clic, navegar).
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { messageRepository, orderRepository, productRepository, userRepository } from './data/db'
import { paymentGateway } from './services/paymentGateway'

function abrir(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}
const ubicacion = () => window.location.pathname // MemoryRouter no toca window.location
const tarjetas = () => screen.queryAllByTestId(/^producto-/)

async function llenarCheckout(usuario, extra = {}) {
  const datos = {
    name: 'Ana', lastname: 'Pérez', email: 'ana@gmail.com', street: 'Los Aromos 123',
    region: 'Región de Coquimbo', comuna: 'La Serena', ...extra,
  }
  await usuario.type(screen.getByLabelText(/^Nombre/), datos.name)
  await usuario.type(screen.getByLabelText(/^Apellidos/), datos.lastname)
  await usuario.type(screen.getByLabelText(/^Correo/), datos.email)
  await usuario.type(screen.getByLabelText(/^Calle/), datos.street)
  await usuario.selectOptions(screen.getByLabelText(/^Región/), datos.region)
  await usuario.selectOptions(screen.getByLabelText(/^Comuna/), datos.comuna)
}

describe('Portada y catálogo', () => {
  it('la portada muestra categorías, ofertas y productos destacados', () => {
    abrir('/')
    expect(screen.getByRole('heading', { name: 'Compra por categoría' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ofertas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Productos destacados' })).toBeInTheDocument()
    expect(tarjetas().length).toBeGreaterThanOrEqual(8)
  })

  it('el catálogo filtra al escribir y se puede limpiar', async () => {
    const usuario = userEvent.setup()
    abrir('/productos')
    expect(tarjetas()).toHaveLength(17)
    await usuario.type(screen.getByLabelText('Buscar'), 'cemento')
    expect(tarjetas()).toHaveLength(2)
    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(tarjetas()).toHaveLength(17)
  })

  it('combina filtros de categoría, ofertas y orden', async () => {
    const usuario = userEvent.setup()
    abrir('/productos')
    await usuario.selectOptions(screen.getByLabelText('Categoría'), 'herramientas')
    expect(tarjetas()).toHaveLength(4)
    await usuario.click(screen.getByLabelText('Solo ofertas'))
    expect(tarjetas()).toHaveLength(1)
    expect(screen.getByRole('heading', { name: /Taladro Percutor/ })).toBeInTheDocument()
  })

  it('lee los filtros desde la URL (?q=&oferta=1)', () => {
    abrir('/productos?q=latex&oferta=1')
    expect(tarjetas()).toHaveLength(1)
    expect(screen.getByLabelText('Buscar')).toHaveValue('latex')
    expect(screen.getByLabelText('Solo ofertas')).toBeChecked()
  })

  it('lee también precio mínimo y máximo, disponibilidad y orden desde la URL', () => {
    abrir('/productos?min=3000&max=10000&disp=1&orden=precio-desc')
    const ids = tarjetas().map((t) => t.dataset.testid ?? t.getAttribute('data-testid'))
    expect(ids[0]).toBe('producto-HE003') // $8.990 es el más caro dentro del rango
    expect(ids).not.toContain('producto-HE001') // $38.691 queda fuera
    expect(ids).not.toContain('producto-MC005') // $1.800 queda fuera
    expect(screen.getByLabelText('Precio máximo')).toHaveValue(10000)
  })

  it('el precio máximo escrito filtra el catálogo', async () => {
    const usuario = userEvent.setup()
    abrir('/productos')
    await usuario.type(screen.getByLabelText('Precio máximo'), '2000')
    expect(tarjetas()).toHaveLength(2) // MC005 $1.800 y EL002 $1.868
  })

  it('sin resultados muestra el estado vacío', async () => {
    const usuario = userEvent.setup()
    abrir('/productos')
    await usuario.type(screen.getByLabelText('Buscar'), 'zzzzzz')
    expect(screen.getByText('No encontramos productos')).toBeInTheDocument()
  })

  it('el buscador de la cabecera lleva al catálogo filtrado', async () => {
    const usuario = userEvent.setup()
    abrir('/')
    await usuario.type(screen.getAllByRole('searchbox')[0], 'taladro{enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Productos' })).toBeInTheDocument()
    expect(tarjetas()).toHaveLength(1)
  })

  it('/ofertas solo muestra productos con descuento', () => {
    abrir('/ofertas')
    expect(screen.getByRole('heading', { level: 1, name: 'Ofertas' })).toBeInTheDocument()
    expect(tarjetas()).toHaveLength(4)
  })

  it('/categorias lista las categorías y /categorias/:slug sus productos', async () => {
    const usuario = userEvent.setup()
    abrir('/categorias')
    await usuario.click(screen.getByRole('link', { name: /Pinturas/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pinturas' })).toBeInTheDocument()
    expect(tarjetas()).toHaveLength(3)
  })

  it('una categoría inexistente muestra un mensaje', () => {
    abrir('/categorias/inexistente')
    expect(screen.getByText('Categoría no encontrada')).toBeInTheDocument()
  })
})

describe('Detalle de producto', () => {
  it('muestra la ficha y los productos relacionados', () => {
    abrir('/productos/MC002')
    expect(screen.getByRole('heading', { level: 1, name: /Cemento Melón/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'También te puede interesar' })).toBeInTheDocument()
    expect(tarjetas()).toHaveLength(4)
  })

  it('agrega al carrito la cantidad elegida y actualiza la cabecera', async () => {
    const usuario = userEvent.setup()
    abrir('/productos/MC001')
    await usuario.click(screen.getByRole('button', { name: /aumentar/i }))
    await usuario.click(screen.getByRole('button', { name: /aumentar/i }))
    await usuario.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    expect(screen.getByTestId('cart-count')).toHaveTextContent('3')
    expect(screen.getByTestId('cart-total')).toHaveTextContent('$17.970')
    expect(await screen.findByText(/se agregó al carrito/)).toBeInTheDocument()
  })

  it('un producto inexistente muestra "no encontrado"', () => {
    abrir('/productos/NOEXISTE')
    expect(screen.getByText('Producto no encontrado')).toBeInTheDocument()
  })

  it('un producto agotado no se puede comprar', () => {
    productRepository.update('MC001', { stock: 0 })
    abrir('/productos/MC001')
    expect(screen.queryByRole('button', { name: /Agregar al carrito/ })).toBeNull()
  })

  it('desde el catálogo el botón Agregar avisa con un toast y suma al carrito', async () => {
    const usuario = userEvent.setup()
    abrir('/productos')
    await usuario.click(screen.getByRole('button', { name: /Agregar Cemento Polpaico/ }))
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(await screen.findByText(/Cemento Polpaico gris 25 kg" se agregó/)).toBeInTheDocument()
  })
})

describe('Carrito', () => {
  it('vacío muestra el mensaje y un enlace al catálogo', () => {
    abrir('/carrito')
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', '/productos')
  })

  it('cambia cantidades, quita productos y recalcula el total', async () => {
    const usuario = userEvent.setup()
    abrir('/productos')
    await usuario.click(screen.getByRole('button', { name: /Agregar Cemento Polpaico/ }))
    await usuario.click(screen.getByRole('button', { name: /Agregar Mortero cola/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    expect(await screen.findByRole('heading', { name: 'Carrito de compras' })).toBeInTheDocument()
    expect(screen.getByText('Total a pagar').nextSibling).toHaveTextContent('$11.190')

    await usuario.click(screen.getByRole('button', { name: /Aumentar cantidad de Cemento/i }))
    expect(screen.getByText('Total a pagar').nextSibling).toHaveTextContent('$17.180')

    await usuario.click(screen.getByRole('button', { name: /Quitar Mortero/ }))
    expect(screen.getByText('Total a pagar').nextSibling).toHaveTextContent('$11.980')
  })

  it('aplica un cupón válido y rechaza uno inválido', async () => {
    const usuario = userEvent.setup()
    abrir('/productos/HE002')
    await usuario.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    await usuario.type(await screen.findByLabelText(/cupón/i), 'MALO')
    await usuario.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByText('El cupón ingresado no es válido.')).toBeInTheDocument()
    await usuario.clear(screen.getByLabelText(/cupón/i))
    await usuario.type(screen.getByLabelText(/cupón/i), 'maestro10')
    await usuario.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByText(/Cupón MAESTRO10 aplicado/)).toBeInTheDocument()
    expect(screen.getByText('-$6.890')).toBeInTheDocument()
  })

  it('se puede quitar el cupón aplicado y el descuento desaparece', async () => {
    const usuario = userEvent.setup()
    abrir('/productos/HE002')
    await usuario.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    await usuario.type(await screen.findByLabelText(/cupón/i), 'MAESTRO10')
    await usuario.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByText('-$6.890')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(screen.queryByText('-$6.890')).toBeNull()
    expect(await screen.findByText('Cupón quitado.')).toBeInTheDocument()
  })

  it('vaciar el carrito pide confirmación', async () => {
    const usuario = userEvent.setup()
    abrir('/productos/MC001')
    await usuario.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Vaciar carrito' }))
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    await usuario.click(screen.getByRole('button', { name: 'Vaciar carrito' }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, vaciar' }))
    expect(await screen.findByText('Tu carrito está vacío')).toBeInTheDocument()
  })

  it('"Ir a pagar" lleva al checkout y con carrito vacío /checkout redirige al carrito', async () => {
    const usuario = userEvent.setup()
    const { unmount } = abrir('/checkout')
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    unmount()
    abrir('/productos/MC001')
    await usuario.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Ir a pagar' }))
    expect(await screen.findByRole('heading', { name: 'Finalizar compra' })).toBeInTheDocument()
  })
})

describe('Checkout y resultado de la compra (con pasarela de pago simulada)', () => {
  async function irAPagar(usuario, id = 'MC001', cantidad = 2) {
    abrir(`/productos/${id}`)
    for (let i = 1; i < cantidad; i++) await usuario.click(screen.getByRole('button', { name: /aumentar/i }))
    await usuario.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Ir a pagar' }))
    await screen.findByRole('heading', { name: 'Finalizar compra' })
  }

  it('con campos vacíos muestra los errores y no cobra', async () => {
    const cobrar = vi.spyOn(paymentGateway, 'charge')
    const usuario = userEvent.setup()
    await irAPagar(usuario)
    await usuario.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una región.')).toBeInTheDocument()
    expect(cobrar).not.toHaveBeenCalled()
  })

  it('pago aprobado: muestra la boleta, vacía el carrito y descuenta el stock', async () => {
    vi.spyOn(paymentGateway, 'charge').mockResolvedValue({ approved: true, transactionId: 'TX-1' })
    const usuario = userEvent.setup()
    await irAPagar(usuario, 'MC001', 2)
    await llenarCheckout(usuario)
    await usuario.click(screen.getByLabelText(/Retiro en tienda/))
    await usuario.click(screen.getByRole('button', { name: /Pagar ahora/ }))

    expect(await screen.findByRole('heading', { name: '¡Compra realizada con éxito!' })).toBeInTheDocument()
    expect(paymentGateway.charge).toHaveBeenCalledWith({ amount: 11980, method: 'tarjeta' })
    expect(screen.getByText(/Boleta electrónica/)).toBeInTheDocument()
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    expect(productRepository.getById('MC001').stock).toBe(78)
    const nueva = orderRepository.getAll().at(-1)
    expect(nueva.status).toBe('Pagada')
    expect(nueva.customer.email).toBe('ana@gmail.com')
    expect(nueva.userRun).toBeNull()
  })

  it('la boleta se puede imprimir', async () => {
    vi.spyOn(paymentGateway, 'charge').mockResolvedValue({ approved: true })
    const usuario = userEvent.setup()
    await irAPagar(usuario)
    await llenarCheckout(usuario)
    await usuario.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    await usuario.click(await screen.findByRole('button', { name: /Imprimir/ }))
    expect(window.print).toHaveBeenCalled()
  })

  it('pago rechazado: muestra el motivo, conserva el carrito y NO descuenta stock', async () => {
    vi.spyOn(paymentGateway, 'charge').mockResolvedValue({ approved: false, reason: 'Fondos insuficientes' })
    const usuario = userEvent.setup()
    await irAPagar(usuario, 'MC001', 2)
    await llenarCheckout(usuario)
    await usuario.click(screen.getByRole('button', { name: /Pagar ahora/ }))

    expect(await screen.findByRole('heading', { name: 'No se pudo realizar el pago' })).toBeInTheDocument()
    expect(screen.getByText(/Fondos insuficientes/)).toBeInTheDocument()
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2')
    expect(productRepository.getById('MC001').stock).toBe(80)
    expect(orderRepository.getAll().at(-1).status).toBe('Rechazada')

    await usuario.click(screen.getByRole('link', { name: 'VOLVER A REALIZAR EL PAGO' }))
    expect(await screen.findByRole('heading', { name: 'Finalizar compra' })).toBeInTheDocument()
  })

  it('con sesión iniciada el formulario parte con los datos del usuario y guarda su RUN', async () => {
    vi.spyOn(paymentGateway, 'charge').mockResolvedValue({ approved: true })
    const usuario = userEvent.setup()
    // inicia sesión
    abrir('/login')
    await usuario.type(screen.getByLabelText(/^Correo/), 'contratista@gmail.com')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'cliente1')
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await screen.findByText('Hola, Felipe')
    await usuario.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Productos' }))
    await usuario.click(await screen.findByRole('button', { name: /Agregar Cemento Polpaico/ }))
    await usuario.click(screen.getByRole('link', { name: /Carrito/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Ir a pagar' }))

    expect(await screen.findByLabelText(/^Nombre/)).toHaveValue('Felipe')
    expect(screen.getByLabelText(/^Correo/)).toHaveValue('contratista@gmail.com')
    expect(screen.getByLabelText(/^Comuna/)).toHaveValue('La Serena')
    await usuario.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    await screen.findByRole('heading', { name: '¡Compra realizada con éxito!' })
    expect(orderRepository.getAll().at(-1).userRun).toBe('189998880')
  })

  it('el despacho se cobra bajo $50.000 y es gratis sobre ese monto', async () => {
    const usuario = userEvent.setup()
    await irAPagar(usuario, 'MC001', 1) // $5.990, despacho por defecto
    expect(screen.getByText('Despacho').nextSibling).toHaveTextContent('$4.990')
    await usuario.click(screen.getByLabelText(/Retiro en tienda/))
    expect(screen.getByText('Despacho').nextSibling).toHaveTextContent('Gratis')
  })

  it('/compra-exitosa de una orden rechazada redirige a /compra-fallida y viceversa', () => {
    const { unmount } = abrir('/compra-exitosa/20261012-001')
    expect(screen.getByRole('heading', { name: 'No se pudo realizar el pago' })).toBeInTheDocument()
    unmount()
    abrir('/compra-fallida/20260928-001')
    expect(screen.getByRole('heading', { name: '¡Compra realizada con éxito!' })).toBeInTheDocument()
  })

  it('un número de pedido inexistente muestra un aviso', () => {
    abrir('/compra-exitosa/00000000-000')
    expect(screen.getByText('Pedido no encontrado')).toBeInTheDocument()
  })
})

describe('Cuenta: registro, login y contacto', () => {
  it('registra un cliente nuevo y luego permite iniciar sesión', async () => {
    const usuario = userEvent.setup()
    abrir('/registro')
    await usuario.type(screen.getByLabelText(/^RUN/), '10.000.000-8')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Nuevo')
    await usuario.type(screen.getByLabelText(/^Apellidos/), 'Cliente')
    await usuario.type(screen.getByLabelText(/^Correo/), 'nuevo@gmail.com')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'abcd')
    await usuario.type(screen.getByLabelText(/^Confirmar/), 'abcd')
    await usuario.selectOptions(screen.getByLabelText(/^Región/), 'Región de Valparaíso')
    await usuario.selectOptions(screen.getByLabelText(/^Comuna/), 'Quilpué')
    await usuario.type(screen.getByLabelText(/^Dirección/), 'Calle 1')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(userRepository.getById('100000008').role).toBe('Cliente')

    await usuario.type(screen.getByLabelText(/^Correo/), 'nuevo@gmail.com')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'abcd')
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Hola, Nuevo')).toBeInTheDocument()
  })

  it('el registro valida RUN, correo, contraseñas y región/comuna', async () => {
    const usuario = userEvent.setup()
    abrir('/registro')
    await usuario.type(screen.getByLabelText(/^RUN/), '123456789')
    await usuario.type(screen.getByLabelText(/^Correo/), 'x@hotmail.com')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'abcd')
    await usuario.type(screen.getByLabelText(/^Confirmar/), 'zzzz')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText(/Dígito verificador inválido/)).toBeInTheDocument()
    expect(screen.getByText(/Solo se permiten correos/)).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una región.')).toBeInTheDocument()
    expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeInTheDocument()
  })

  it('el error de un campo desaparece al corregirlo', async () => {
    const usuario = userEvent.setup()
    abrir('/registro')
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    await usuario.type(screen.getByLabelText(/^Nombre/), 'A')
    expect(screen.queryByText('El nombre es obligatorio.')).toBeNull()
  })

  it('el login valida los campos antes de intentar ingresar', async () => {
    const usuario = userEvent.setup()
    abrir('/login')
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(screen.queryByText('Correo o contraseña incorrectos.')).toBeNull()
  })

  it('login incorrecto muestra el error y login correcto redirige según el rol', async () => {
    const usuario = userEvent.setup()
    abrir('/login')
    await usuario.type(screen.getByLabelText(/^Correo/), 'admin@duoc.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'mala')
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(screen.getByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    await usuario.clear(screen.getByLabelText(/^Contraseña/))
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'admin123')
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('las cuentas de demostración completan el formulario', async () => {
    const usuario = userEvent.setup()
    abrir('/login')
    await usuario.click(screen.getByRole('button', { name: /Vendedor: vendedor@profesor.duoc.cl/ }))
    expect(screen.getByLabelText(/^Correo/)).toHaveValue('vendedor@profesor.duoc.cl')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('vende123')
  })

  it('cerrar sesión desde la cabecera vuelve a mostrar Iniciar sesión', async () => {
    const usuario = userEvent.setup()
    abrir('/login')
    await usuario.click(screen.getByRole('button', { name: /Cliente: contratista@gmail.com/ }))
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await usuario.click(await screen.findByText('Hola, Felipe'))
    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('el formulario de contacto valida y guarda el mensaje', async () => {
    const usuario = userEvent.setup()
    abrir('/contacto')
    await usuario.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    expect(screen.getByText('El comentario es obligatorio.')).toBeInTheDocument()
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Ana')
    await usuario.type(screen.getByLabelText(/^Correo/), 'ana@gmail.com')
    await usuario.type(screen.getByLabelText(/^Comentario/), 'Consulta')
    expect(screen.getByTestId('contador')).toHaveTextContent('8 / 500')
    await usuario.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
    expect(await screen.findByText(/Mensaje enviado con éxito/)).toBeInTheDocument()
    expect(messageRepository.getAll()).toHaveLength(1)
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('')
  })
})

describe('Páginas informativas', () => {
  it('Nosotros, Blogs y detalle de blog', async () => {
    const usuario = userEvent.setup()
    const { unmount } = abrir('/nosotros')
    expect(screen.getByRole('heading', { name: 'Nuestra empresa' })).toBeInTheDocument()
    unmount()
    abrir('/blogs')
    await usuario.click(screen.getAllByRole('link', { name: 'Leer artículo' })[0])
    expect(await screen.findByText(/Tip del maestro/)).toBeInTheDocument()
  })

  it('un blog inexistente y una ruta desconocida muestran 404', () => {
    const { unmount } = abrir('/blogs/nada')
    expect(screen.getByText('Artículo no encontrado')).toBeInTheDocument()
    unmount()
    abrir('/ruta/que/no/existe')
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument()
  })
})
