// Pruebas de integración del panel de administración: acceso por rol, CRUD conectado
// a la "base de datos" simulada y reportes. La sesión se deja guardada antes de abrir la ruta
// (el flujo de login ya se prueba en App.store.test.jsx).
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { categoryRepository, orderRepository, productRepository, userRepository } from './data/db'

const SESIONES = { admin: '111111111', vendedor: '222222222', cliente: '189998880' }

function abrirComo(rol, ruta = '/admin') {
  if (rol) localStorage.setItem('lm_session', JSON.stringify({ run: SESIONES[rol] }))
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}
const principal = () => within(screen.getByRole('main'))
const fila = (texto) => screen.getByText(texto).closest('tr')

describe('Control de acceso al panel', () => {
  it('sin sesión redirige al login', () => {
    abrirComo(null, '/admin/productos')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('después de iniciar sesión vuelve a la página que se había pedido', async () => {
    const usuario = userEvent.setup()
    abrirComo(null, '/admin/productos')
    await usuario.type(screen.getByLabelText(/^Correo/), 'admin@duoc.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'admin123')
    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
  })

  it('un Cliente ve "Acceso restringido" y no el panel', () => {
    abrirComo('cliente', '/admin')
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Menú de administración' })).toBeNull()
  })

  it('el Vendedor no ve Usuarios ni Categorías en el menú y se le bloquea la URL', () => {
    abrirComo('vendedor', '/admin/usuarios')
    const menu = screen.getByRole('complementary', { name: 'Menú de administración' })
    expect(within(menu).getByRole('link', { name: /Órdenes/ })).toBeInTheDocument()
    expect(within(menu).queryByRole('link', { name: /Usuarios/ })).toBeNull()
    expect(within(menu).queryByRole('link', { name: /Categorías/ })).toBeNull()
    expect(within(menu).queryByRole('link', { name: /Reportes/ })).toBeNull()
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
  })

  it('el Administrador ve todas las opciones del menú', () => {
    abrirComo('admin')
    const menu = screen.getByRole('complementary', { name: 'Menú de administración' })
    for (const nombre of ['Dashboard', 'Órdenes', 'Productos', 'Categorías', 'Usuarios', 'Reportes', 'Mi perfil']) {
      expect(within(menu).getByRole('link', { name: new RegExp(nombre) })).toBeInTheDocument()
    }
  })

  it('cerrar sesión desde el panel vuelve a la tienda', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin')
    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Compra por categoría' })).toBeInTheDocument()
    expect(localStorage.getItem('lm_session')).toBeNull()
  })
})

describe('Dashboard', () => {
  it('muestra las cifras del negocio a un Administrador', () => {
    abrirComo('admin')
    expect(principal().getByText(/Bienvenido\/a, Eduardo\. Rol: Administrador/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Órdenes: 4' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Productos: 17' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Stock crítico: 3' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Usuarios: 4' })).toBeInTheDocument()
  })

  it('al Vendedor no le muestra las cifras de usuarios ni los ingresos', () => {
    abrirComo('vendedor')
    expect(screen.queryByRole('link', { name: /^Usuarios:/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /^Ingresos/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Órdenes: 4' })).toBeInTheDocument()
  })

  it('las cifras se actualizan en tiempo real al cambiar los datos', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos/nuevo')
    await usuario.type(screen.getByLabelText(/^Código/), 'TST001')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Producto de prueba')
    await usuario.selectOptions(screen.getByLabelText(/^Categoría/), 'pinturas')
    await usuario.type(screen.getByLabelText(/^Precio/), '1000')
    await usuario.type(screen.getByLabelText(/^Stock(?! crítico)/), '5')
    await usuario.type(screen.getByLabelText(/^Stock crítico/), '2')
    await usuario.click(screen.getByRole('button', { name: 'Crear producto' }))
    await screen.findByRole('heading', { name: 'Productos' })
    await usuario.click(screen.getByRole('link', { name: /Dashboard/ }))
    expect(await screen.findByRole('link', { name: 'Productos: 18' })).toBeInTheDocument()
  })
})

describe('Productos (CRUD)', () => {
  it('lista el inventario y filtra por código, nombre o marca', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos')
    expect(screen.getAllByRole('row')).toHaveLength(18) // 17 + encabezado
    await usuario.type(screen.getByLabelText('Buscar producto'), 'bosch')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('Taladro Percutor 650W')).toBeInTheDocument()
  })

  it('crea un producto nuevo y aparece en la tienda', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos/nuevo')
    await usuario.type(screen.getByLabelText(/^Código/), 'tst002')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Brocha 3 pulgadas')
    await usuario.selectOptions(screen.getByLabelText(/^Categoría/), 'pinturas')
    await usuario.type(screen.getByLabelText(/^Precio/), '2500')
    await usuario.type(screen.getByLabelText(/^Stock(?! crítico)/), '12')
    await usuario.type(screen.getByLabelText(/^Stock crítico/), '3')
    await usuario.click(screen.getByRole('button', { name: 'Crear producto' }))

    expect(await screen.findByText('Brocha 3 pulgadas')).toBeInTheDocument()
    expect(await screen.findByText('Producto creado.')).toBeInTheDocument()
    expect(productRepository.getById('TST002')).toMatchObject({ price: 2500, stock: 12, categoryId: 'pinturas' })
  })

  it('valida el formulario: campos vacíos, precio inválido y código repetido', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos/nuevo')
    await usuario.click(screen.getByRole('button', { name: 'Crear producto' }))
    expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeInTheDocument()
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una categoría válida.')).toBeInTheDocument()

    await usuario.type(screen.getByLabelText(/^Código/), 'mc001')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Repetido')
    await usuario.click(screen.getByRole('button', { name: 'Crear producto' }))
    expect(screen.getByText('Ya existe un producto con este código.')).toBeInTheDocument()
    expect(productRepository.getAll()).toHaveLength(17)
  })

  it('edita un producto y el cambio se refleja de inmediato en la lista', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos')
    await usuario.click(screen.getByRole('link', { name: 'Editar Cemento Polpaico gris 25 kg' }))
    const precio = await screen.findByLabelText(/^Precio/)
    expect(precio).toHaveValue(5990)
    expect(screen.getByLabelText(/^Código/)).toBeDisabled()
    await usuario.clear(precio)
    await usuario.type(precio, '6500')
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await within(fila('Cemento Polpaico gris 25 kg')).findByText('$6.500')).toBeInTheDocument()
    expect(productRepository.getById('MC001').price).toBe(6500)
  })

  it('cancelar la edición no cambia nada', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos/MC001/editar')
    await usuario.type(await screen.findByLabelText(/^Nombre/), ' X')
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(productRepository.getById('MC001').name).toBe('Cemento Polpaico gris 25 kg')
  })

  it('eliminar pide confirmación; cancelar conserva, confirmar elimina', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Rodillo profesional 23 cm' }))
    expect(await screen.findByText(/¿Eliminar "Rodillo profesional 23 cm"\?/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(productRepository.getById('PI003')).toBeTruthy()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Rodillo profesional 23 cm' }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(screen.queryByText('Rodillo profesional 23 cm')).toBeNull())
    expect(productRepository.getById('PI003')).toBeNull()
  })

  it('la lista de stock crítico solo muestra los productos bajo su nivel', () => {
    abrirComo('admin', '/admin/productos/criticos')
    expect(screen.getByRole('heading', { name: 'Productos con stock crítico' })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4) // 3 + encabezado
    expect(screen.getByText('Set destornilladores 6 piezas')).toBeInTheDocument()
  })

  it('el reporte de inventario muestra existencias y valor', () => {
    abrirComo('admin', '/admin/productos/reportes')
    expect(screen.getByRole('heading', { name: 'Reporte de inventario' })).toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBeGreaterThan(5)
  })

  it('un código de producto inexistente muestra "no encontrado"', () => {
    abrirComo('admin', '/admin/productos/NOEXISTE/editar')
    expect(screen.getByText('Producto no encontrado')).toBeInTheDocument()
  })

  it('el Vendedor sí puede gestionar productos', async () => {
    const usuario = userEvent.setup()
    abrirComo('vendedor', '/admin/productos')
    expect(screen.getByRole('link', { name: '+ Nuevo producto' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('link', { name: 'Editar Martillo carpintero 16 oz' }))
    expect(await screen.findByLabelText(/^Nombre/)).toHaveValue('Martillo carpintero 16 oz')
  })

  it('un cambio de precio del administrador llega al catálogo de la tienda', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/productos/MC001/editar')
    const precio = await screen.findByLabelText(/^Precio/)
    await usuario.clear(precio)
    await usuario.type(precio, '9990')
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByRole('heading', { name: 'Productos' })
    await usuario.click(screen.getByRole('link', { name: /Tienda/ }))
    await usuario.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Productos' }))
    const tarjeta = await screen.findByTestId('producto-MC001')
    expect(within(tarjeta).getByText('$9.990')).toBeInTheDocument()
  })
})

describe('Categorías (CRUD)', () => {
  it('lista las categorías con su cantidad de productos', () => {
    abrirComo('admin', '/admin/categorias')
    expect(within(fila('Herramientas')).getByText('4')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(6)
  })

  it('crea una categoría y valida el nombre repetido', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/categorias/nueva')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Herramientas')
    await usuario.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(screen.getByText('Ya existe una categoría con ese nombre.')).toBeInTheDocument()

    await usuario.clear(screen.getByLabelText(/^Nombre/))
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Jardinería')
    await usuario.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(await screen.findByText('Jardinería')).toBeInTheDocument()
    expect(categoryRepository.getById('jardineria')).toBeTruthy()
  })

  it('edita el nombre de una categoría', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/categorias')
    await usuario.click(screen.getByRole('link', { name: 'Editar Pinturas' }))
    const nombre = await screen.findByLabelText(/^Nombre/)
    await usuario.clear(nombre)
    await usuario.type(nombre, 'Pinturas y barnices')
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Pinturas y barnices')).toBeInTheDocument()
  })

  it('no deja eliminar una categoría con productos, pero sí una vacía', async () => {
    const usuario = userEvent.setup()
    categoryRepository.create({ id: 'vacia', name: 'Vacía', icon: '📦', description: '' })
    abrirComo('admin', '/admin/categorias')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Pinturas' }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))
    expect(await screen.findByText(/No se puede eliminar: tiene 3 producto\(s\)/)).toBeInTheDocument()
    expect(categoryRepository.getById('pinturas')).toBeTruthy()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Vacía' }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(categoryRepository.getById('vacia')).toBeNull())
  })

  it('una categoría inexistente al editar muestra "no encontrada"', () => {
    abrirComo('admin', '/admin/categorias/nada/editar')
    expect(screen.getByText('Categoría no encontrada')).toBeInTheDocument()
  })
})

describe('Usuarios (CRUD)', () => {
  it('lista los usuarios y filtra por texto y por rol', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/usuarios')
    expect(screen.getAllByRole('row')).toHaveLength(5)
    await usuario.selectOptions(screen.getByLabelText('Rol'), 'Cliente')
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await usuario.type(screen.getByLabelText('Buscar'), 'maria')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('maria.rojas@gmail.com')).toBeInTheDocument()
  })

  it('crea un usuario con rol y valida RUN y correo repetido', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/usuarios/nuevo')
    await usuario.type(screen.getByLabelText(/^RUN/), '111111111')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(screen.getByText('Ya existe un usuario registrado con este RUN.')).toBeInTheDocument()

    await usuario.clear(screen.getByLabelText(/^RUN/))
    await usuario.type(screen.getByLabelText(/^RUN/), '10.000.000-8')
    await usuario.type(screen.getByLabelText(/^Correo/), 'admin@duoc.cl')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(screen.getByText('Este correo ya está registrado.')).toBeInTheDocument()

    await usuario.selectOptions(screen.getByLabelText(/^Rol/), 'Vendedor')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Nuevo')
    await usuario.type(screen.getByLabelText(/^Apellidos/), 'Vendedor')
    await usuario.clear(screen.getByLabelText(/^Correo/))
    await usuario.type(screen.getByLabelText(/^Correo/), 'nuevo@duoc.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'abcd')
    await usuario.type(screen.getByLabelText(/^Confirmar/), 'abcd')
    await usuario.selectOptions(screen.getByLabelText(/^Región/), 'Región de Coquimbo')
    await usuario.selectOptions(screen.getByLabelText(/^Comuna/), 'Ovalle')
    await usuario.type(screen.getByLabelText(/^Dirección/), 'Calle 5')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(await screen.findByText('nuevo@duoc.cl')).toBeInTheDocument()
    expect(userRepository.getById('100000008').role).toBe('Vendedor')
  })

  it('edita un usuario (la contraseña es opcional al editar)', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/usuarios/123456785/editar')
    const nombre = await screen.findByLabelText(/^Nombre/)
    expect(nombre).toHaveValue('María')
    expect(screen.getByLabelText(/^RUN/)).toBeDisabled()
    await usuario.clear(nombre)
    await usuario.type(nombre, 'María José')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))
    expect(await screen.findByText('María José Rojas')).toBeInTheDocument()
    expect(userRepository.getById('123456785').password).toBe('maria123')
  })

  it('la ficha de un cliente muestra su historial de compras', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/usuarios/189998880')
    expect(await screen.findByRole('heading', { name: 'Felipe Cortés' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Historial de compras' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '20260928-001' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '20261008-001' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('link', { name: '20260928-001' }))
    expect(await screen.findByRole('heading', { name: 'Orden 20260928-001' })).toBeInTheDocument()
  })

  it('elimina un usuario con confirmación, pero no permite eliminar tu propia cuenta', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/usuarios')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Eduardo Contreras' }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))
    expect(userRepository.getById('111111111')).toBeTruthy()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar María Rojas' }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(userRepository.getById('123456785')).toBeNull())
    expect(screen.queryByText('maria.rojas@gmail.com')).toBeNull()
  })

  it('un RUN inexistente muestra "usuario no encontrado"', () => {
    abrirComo('admin', '/admin/usuarios/99999999')
    expect(screen.getByText('Usuario no encontrado')).toBeInTheDocument()
  })
})

describe('Órdenes', () => {
  it('lista las órdenes de la más nueva a la más antigua', () => {
    abrirComo('admin', '/admin/ordenes')
    const filas = screen.getAllByRole('row').slice(1)
    expect(filas).toHaveLength(4)
    expect(filas[0]).toHaveTextContent('20261012-001')
    expect(filas[3]).toHaveTextContent('20260928-001')
  })

  it('filtra por estado, por texto y limpia los filtros', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/ordenes')
    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Rechazada')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    await usuario.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(screen.getAllByRole('row')).toHaveLength(5)
    await usuario.type(screen.getByLabelText('Buscar'), 'maria.rojas')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    await usuario.clear(screen.getByLabelText('Buscar'))
    await usuario.type(screen.getByLabelText('Buscar'), 'zzzz')
    expect(screen.getByText('No hay órdenes que coincidan con los filtros.')).toBeInTheDocument()
  })

  it('filtra por rango de fechas', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/ordenes')
    await usuario.type(screen.getByLabelText('Desde'), '2026-10-05')
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await usuario.type(screen.getByLabelText('Hasta'), '2026-10-09')
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })

  it('el detalle de una orden muestra el cupón y se puede imprimir', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/ordenes/20261008-001')
    expect(await screen.findByRole('heading', { name: 'Orden 20261008-001' })).toBeInTheDocument()
    expect(screen.getAllByText(/CONTRATISTA10/).length).toBeGreaterThan(0)
    await usuario.click(screen.getByRole('button', { name: /Imprimir/ }))
    expect(window.print).toHaveBeenCalled()
  })

  it('una orden inexistente muestra "orden no encontrada"', () => {
    abrirComo('admin', '/admin/ordenes/0000')
    expect(screen.getByText('Orden no encontrada')).toBeInTheDocument()
  })

  it('una compra nueva aparece en el panel sin recargar', () => {
    abrirComo('admin', '/admin/ordenes')
    expect(screen.getAllByRole('row')).toHaveLength(5)
    const base = orderRepository.getAll()[0]
    // misma "base de datos" que usa el checkout: un alta externa se refleja en pantalla
    orderRepository.create({ ...base, number: '20261015-001', createdAt: '2026-10-15T10:00:00.000Z' })
    return waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(6))
  })
})

describe('Reportes y perfil', () => {
  it('el reporte de ventas calcula las cifras solo con pedidos pagados', () => {
    abrirComo('admin', '/admin/reportes')
    expect(screen.getByRole('heading', { name: 'Reporte de ventas' })).toBeInTheDocument()
    const rechazadas = screen.getByText('Pedidos rechazados').nextSibling
    const pagadas = screen.getByText('Pedidos pagados').nextSibling
    expect(rechazadas).toHaveTextContent('1')
    expect(pagadas).toHaveTextContent('3')
    expect(screen.getByRole('heading', { name: 'Ventas por producto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ventas por categoría' })).toBeInTheDocument()
  })

  it('el reporte se puede filtrar por fechas y limpiar', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/reportes')
    await usuario.type(screen.getByLabelText('Desde'), '2026-10-05')
    expect(screen.getByText('Pedidos pagados').nextSibling).toHaveTextContent('1')
    await usuario.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(screen.getByText('Pedidos pagados').nextSibling).toHaveTextContent('3')
    await usuario.type(screen.getByLabelText('Hasta'), '2026-10-01')
    expect(screen.getByText('Pedidos pagados').nextSibling).toHaveTextContent('1')
  })

  it('el Vendedor no puede ver los reportes de ventas', () => {
    abrirComo('vendedor', '/admin/reportes')
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
  })

  it('el perfil carga los datos de la sesión y los guarda sin cambiar el rol', async () => {
    const usuario = userEvent.setup()
    abrirComo('vendedor', '/admin/perfil')
    const direccion = await screen.findByLabelText(/^Dirección/)
    expect(direccion).toHaveValue('Calle Videla 505')
    await usuario.clear(direccion)
    await usuario.type(direccion, 'Nueva dirección 1')
    await usuario.click(screen.getByRole('button', { name: 'Guardar mis datos' }))
    expect(await screen.findByText('Tus datos fueron actualizados.')).toBeInTheDocument()
    expect(userRepository.getById('222222222')).toMatchObject({ address: 'Nueva dirección 1', role: 'Vendedor' })
  })

  it('el perfil muestra errores si un dato es inválido', async () => {
    const usuario = userEvent.setup()
    abrirComo('admin', '/admin/perfil')
    const nombre = await screen.findByLabelText(/^Nombre/)
    await usuario.clear(nombre)
    await usuario.click(screen.getByRole('button', { name: 'Guardar mis datos' }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(userRepository.getById('111111111').name).toBe('Eduardo')
  })
})
