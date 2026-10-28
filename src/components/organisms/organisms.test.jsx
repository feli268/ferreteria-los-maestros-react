import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { initialCategories, initialOrders, initialProducts, initialUsers } from '../../data/seed'
import { renderWithRouter } from '../../test/utils'
import { calculateTotals } from '../../utils/pricing'
import AdminSidebar from './AdminSidebar'
import CartTable from './CartTable'
import CategoryForm from './CategoryForm'
import CategoryGrid from './CategoryGrid'
import CheckoutForm from './CheckoutForm'
import ContactForm from './ContactForm'
import DataTable from './DataTable'
import Footer from './Footer'
import Header from './Header'
import HeroCarousel from './HeroCarousel'
import LoginForm from './LoginForm'
import OrderReceipt from './OrderReceipt'
import ProductDetailView from './ProductDetailView'
import ProductFilters from './ProductFilters'
import ProductForm from './ProductForm'
import ProductGrid from './ProductGrid'
import SalesReport from './SalesReport'
import ToastHost from './ToastHost'
import UserForm from './UserForm'

const producto = (id) => initialProducts.find((p) => p.id === id)

describe('Header', () => {
  const props = {
    user: null,
    isStaff: false,
    cartCount: 0,
    cartTotal: 0,
    categories: initialCategories,
    onSearch: () => {},
    onLogout: () => {},
  }

  it('sin sesión muestra Iniciar sesión y Registrarse', () => {
    renderWithRouter(<Header {...props} />)
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/registro')
    expect(screen.queryByText(/Hola,/)).toBeNull()
  })

  it('con sesión de cliente muestra su nombre y oculta el panel de administración', async () => {
    renderWithRouter(<Header {...props} user={initialUsers[2]} />)
    expect(screen.getByText('Hola, Felipe')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).toBeNull()
    await userEvent.click(screen.getByText('Hola, Felipe'))
    expect(screen.queryByText('Panel de administración')).toBeNull()
  })

  it('con rol de staff muestra el acceso al panel y permite cerrar sesión', async () => {
    const onLogout = vi.fn()
    renderWithRouter(<Header {...props} user={initialUsers[0]} isStaff onLogout={onLogout} />)
    await userEvent.click(screen.getByText('Hola, Eduardo'))
    expect(screen.getByRole('link', { name: 'Panel de administración' })).toHaveAttribute('href', '/admin')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('muestra la cantidad y el total del carrito', () => {
    renderWithRouter(<Header {...props} cartCount={3} cartTotal={17970} />)
    expect(screen.getByTestId('cart-count')).toHaveTextContent('3')
    expect(screen.getByTestId('cart-total')).toHaveTextContent('$17.970')
  })

  it('lista las categorías en el menú desplegable', async () => {
    renderWithRouter(<Header {...props} />)
    await userEvent.click(screen.getByText('Categorías'))
    expect(screen.getByRole('link', { name: /Herramientas/ })).toHaveAttribute('href', '/categorias/herramientas')
    expect(screen.getByRole('link', { name: /Ver todas las categorías/ })).toBeInTheDocument()
  })

  it('el buscador llama a onSearch con el texto', async () => {
    const onSearch = vi.fn()
    renderWithRouter(<Header {...props} onSearch={onSearch} />)
    await userEvent.type(screen.getByRole('searchbox'), 'taladro{enter}')
    expect(onSearch).toHaveBeenCalledWith('taladro')
  })

  it('el botón de menú móvil abre y cierra el menú', async () => {
    renderWithRouter(<Header {...props} />)
    const boton = screen.getByRole('button', { name: 'Abrir menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('link', { name: 'Productos' }))
    expect(boton).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Footer, HeroCarousel, CategoryGrid', () => {
  it('Footer muestra enlaces de navegación', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByRole('link', { name: 'Ofertas' })).toHaveAttribute('href', '/ofertas')
  })

  it('HeroCarousel muestra los títulos y los enlaces de cada diapositiva', () => {
    const slides = [
      { id: 'a', icon: '🏗️', title: 'Título A', text: 'Texto A', ctaLabel: 'Ir A', to: '/a' },
      { id: 'b', icon: '🏷️', title: 'Título B', text: 'Texto B', ctaLabel: 'Ir B', to: '/b' },
    ]
    renderWithRouter(<HeroCarousel slides={slides} />)
    expect(screen.getByText('Título A')).toBeInTheDocument()
    expect(screen.getByText('Título B')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir B' })).toHaveAttribute('href', '/b')
  })

  it('CategoryGrid muestra cada categoría con su cantidad de productos', () => {
    renderWithRouter(<CategoryGrid categories={initialCategories} counts={{ pinturas: 3 }} />)
    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getByText('3 productos')).toBeInTheDocument()
    expect(screen.getAllByText('0 productos')).toHaveLength(4)
  })

  it('CategoryGrid sin categorías muestra un mensaje', () => {
    renderWithRouter(<CategoryGrid categories={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('Aún no hay categorías')
  })
})

describe('ProductGrid', () => {
  it('muestra una tarjeta por producto con el nombre de su categoría', () => {
    renderWithRouter(<ProductGrid products={initialProducts.slice(0, 3)} categories={initialCategories} onAdd={() => {}} />)
    expect(screen.getAllByTestId(/^producto-/)).toHaveLength(3)
    expect(screen.getAllByText('Mat. Construcción').length).toBeGreaterThan(0)
  })

  it('sin productos muestra el estado vacío con la acción indicada', () => {
    renderWithRouter(<ProductGrid products={[]} onAdd={() => {}} emptyAction={<button>Reintentar</button>} />)
    expect(screen.getByText('No encontramos productos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('propaga el evento Agregar con el producto elegido', async () => {
    const onAdd = vi.fn()
    renderWithRouter(<ProductGrid products={[producto('MC003')]} categories={initialCategories} onAdd={onAdd} />)
    await userEvent.click(screen.getByRole('button', { name: /Agregar Mortero/ }))
    expect(onAdd).toHaveBeenCalledWith(producto('MC003'))
  })
})

describe('ProductFilters', () => {
  const filtros = { query: '', categoryId: '', onlyOffers: false, onlyAvailable: false, minPrice: '', maxPrice: '', sort: 'relevancia' }
  const render_ = (extra = {}) => {
    const onChange = vi.fn()
    const onReset = vi.fn()
    renderWithRouter(
      <ProductFilters filters={{ ...filtros, ...extra }} categories={initialCategories} onChange={onChange} onReset={onReset} resultCount={5} />,
    )
    return { onChange, onReset }
  }

  it('avisa los cambios de texto, categoría, orden y precios', async () => {
    const { onChange } = render_()
    await userEvent.type(screen.getByLabelText('Buscar'), 'a')
    expect(onChange).toHaveBeenLastCalledWith({ query: 'a' })
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'pinturas')
    expect(onChange).toHaveBeenLastCalledWith({ categoryId: 'pinturas' })
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'precio-asc')
    expect(onChange).toHaveBeenLastCalledWith({ sort: 'precio-asc' })
    await userEvent.type(screen.getByLabelText('Precio mínimo'), '5')
    expect(onChange).toHaveBeenLastCalledWith({ minPrice: '5' })
  })

  it('los interruptores de ofertas y disponibles envían true/false', async () => {
    const { onChange } = render_()
    await userEvent.click(screen.getByLabelText('Solo ofertas'))
    expect(onChange).toHaveBeenLastCalledWith({ onlyOffers: true })
    await userEvent.click(screen.getByLabelText('Solo disponibles'))
    expect(onChange).toHaveBeenLastCalledWith({ onlyAvailable: true })
  })

  it('muestra el total de resultados y el botón Limpiar filtros', async () => {
    const { onReset } = render_()
    expect(screen.getByRole('status')).toHaveTextContent('5 productos encontrados')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('hideCategory oculta el filtro de categoría', () => {
    render(<ProductFilters filters={filtros} categories={initialCategories} onChange={() => {}} onReset={() => {}} resultCount={1} hideCategory />)
    expect(screen.queryByLabelText('Categoría')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('1 producto encontrado')
  })
})

describe('ProductDetailView', () => {
  it('muestra los datos del producto y llama a onAdd', async () => {
    const onAdd = vi.fn()
    renderWithRouter(
      <ProductDetailView product={producto('HE001')} category={initialCategories[1]} quantity={2} onQuantityChange={() => {}} onAdd={onAdd} />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Taladro Percutor 650W')
    expect(screen.getByText('HE001')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Herramientas' })).toHaveAttribute('href', '/categorias/herramientas')
    await userEvent.click(screen.getByRole('button', { name: /Agregar al carrito/ }))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('el selector de cantidad no pasa del stock', () => {
    renderWithRouter(
      <ProductDetailView product={producto('HE004')} quantity={3} onQuantityChange={() => {}} onAdd={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /aumentar/i })).toBeDisabled() // stock 3
  })

  it('un producto agotado no permite comprar', () => {
    renderWithRouter(
      <ProductDetailView product={{ ...producto('HE004'), stock: 0 }} quantity={1} onQuantityChange={() => {}} onAdd={() => {}} />,
    )
    expect(screen.queryByRole('button', { name: /Agregar al carrito/ })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('agotado')
  })
})

describe('CartTable', () => {
  const lines = [
    { productId: 'MC001', name: 'Cemento Polpaico', icon: '🧱', quantity: 2, unitPrice: 5990, subtotal: 11980 },
  ]

  it('muestra precio, cantidad y subtotal de cada línea', () => {
    renderWithRouter(<CartTable lines={lines} stockById={{ MC001: 80 }} onQuantityChange={() => {}} onRemove={() => {}} />)
    const fila = screen.getByRole('row', { name: /Cemento Polpaico/ })
    expect(within(fila).getByText('$5.990')).toBeInTheDocument()
    expect(within(fila).getByText('$11.980')).toBeInTheDocument()
    expect(within(fila).getByRole('spinbutton')).toHaveValue(2)
  })

  it('aumentar la cantidad avisa con el id del producto', async () => {
    const onQuantityChange = vi.fn()
    renderWithRouter(<CartTable lines={lines} stockById={{ MC001: 80 }} onQuantityChange={onQuantityChange} onRemove={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /aumentar/i }))
    expect(onQuantityChange).toHaveBeenCalledWith('MC001', 3)
  })

  it('Quitar avisa con el id del producto', async () => {
    const onRemove = vi.fn()
    renderWithRouter(<CartTable lines={lines} onQuantityChange={() => {}} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: /Quitar Cemento Polpaico/ }))
    expect(onRemove).toHaveBeenCalledWith('MC001')
  })
})

const formularioPago = {
  name: '', lastname: '', email: '', street: '', apartment: '', region: '', comuna: '', notes: '',
  deliveryId: 'retiro', paymentMethod: 'tarjeta',
}

describe('CheckoutForm', () => {
  it('muestra los errores recibidos y el total a pagar en el botón', () => {
    renderWithRouter(
      <CheckoutForm values={formularioPago} errors={{ name: 'El nombre es obligatorio.', email: 'Formato inválido' }} total={15772} onChange={() => {}} onSubmit={() => {}} />,
    )
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Pagar ahora $15.772' })).toBeInTheDocument()
  })

  it('cada campo avisa su cambio con el nombre del campo', async () => {
    const onChange = vi.fn()
    renderWithRouter(<CheckoutForm values={formularioPago} errors={{}} total={1000} onChange={onChange} onSubmit={() => {}} />)
    await userEvent.type(screen.getByLabelText(/Calle y número/), 'x')
    expect(onChange).toHaveBeenLastCalledWith('street', 'x')
    await userEvent.click(screen.getByRole('radio', { name: /Despacho/ }))
    expect(onChange).toHaveBeenLastCalledWith('deliveryId', 'despacho')
    await userEvent.click(screen.getByRole('radio', { name: /Transferencia/ }))
    expect(onChange).toHaveBeenLastCalledWith('paymentMethod', 'transferencia')
  })

  it('al cambiar la región limpia la comuna', async () => {
    const onChange = vi.fn()
    renderWithRouter(<CheckoutForm values={formularioPago} errors={{}} total={1000} onChange={onChange} onSubmit={() => {}} />)
    await userEvent.selectOptions(screen.getByLabelText(/Región/), 'Región del Biobío')
    expect(onChange).toHaveBeenCalledWith('region', 'Región del Biobío')
    expect(onChange).toHaveBeenCalledWith('comuna', '')
  })

  it('envía el formulario y en carga deshabilita el botón', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    const { unmount } = renderWithRouter(<CheckoutForm values={formularioPago} errors={{}} total={1000} onChange={() => {}} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: /Pagar ahora/ }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    unmount()
    renderWithRouter(<CheckoutForm values={formularioPago} errors={{}} total={1000} onChange={() => {}} onSubmit={onSubmit} submitting />)
    expect(screen.getByRole('button', { name: /Procesando pago/ })).toBeDisabled()
  })

  it('muestra el error general del formulario', () => {
    renderWithRouter(<CheckoutForm values={formularioPago} errors={{}} formError="Sin stock suficiente" total={1} onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sin stock suficiente')
  })
})

describe('LoginForm, ContactForm y UserForm', () => {
  it('LoginForm muestra errores, el error general y enlaza al registro', () => {
    renderWithRouter(
      <LoginForm values={{ email: '', password: '' }} errors={{ email: 'El correo es obligatorio.' }} formError="Credenciales incorrectas" onChange={() => {}} onSubmit={() => {}} />,
    )
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Regístrate/ })).toHaveAttribute('href', '/registro')
  })

  it('LoginForm avisa los cambios y el envío', async () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn((e) => e.preventDefault())
    renderWithRouter(<LoginForm values={{ email: '', password: '' }} errors={{}} onChange={onChange} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Correo/), 'a')
    expect(onChange).toHaveBeenCalledWith('email', 'a')
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('ContactForm muestra el contador de caracteres del comentario', () => {
    render(<ContactForm values={{ name: '', email: '', message: 'Hola' }} errors={{}} onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.getByTestId('contador')).toHaveTextContent('4 / 500')
  })

  it('UserForm en modo registro no tiene selector de rol y pide contraseña', () => {
    const valores = { run: '', name: '', lastname: '', email: '', password: '', passwordConfirm: '', region: '', comuna: '', address: '', role: 'Cliente' }
    renderWithRouter(<UserForm mode="register" values={valores} errors={{}} onChange={() => {}} onSubmit={() => {}} />)
    expect(screen.queryByLabelText(/^Rol/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByText('Entre 4 y 10 caracteres')).toBeInTheDocument()
  })

  it('UserForm en modo edición bloquea el RUN, muestra el rol y la contraseña es opcional', () => {
    const valores = { ...initialUsers[2], password: '', passwordConfirm: '' }
    renderWithRouter(<UserForm mode="edit" showRole values={valores} errors={{}} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText(/RUN/)).toBeDisabled()
    expect(screen.getByLabelText(/^Rol/)).toHaveValue('Cliente')
    expect(screen.getByText(/Déjala en blanco/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})

describe('ProductForm y CategoryForm', () => {
  const valoresProducto = { id: 'MC001', name: 'Cemento', categoryId: 'mat-construccion', subcategory: '', brand: '', price: '5990', discountPercent: '0', stock: '10', criticalStock: '2', icon: '🧱', description: '' }

  it('ProductForm en edición bloquea el código y lista las categorías', () => {
    render(<ProductForm mode="edit" values={valoresProducto} errors={{}} categories={initialCategories} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText(/Código/)).toBeDisabled()
    expect(within(screen.getByLabelText(/Categoría/)).getAllByRole('option')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
  })

  it('ProductForm muestra errores y avisa cambios y cancelación', async () => {
    const onChange = vi.fn()
    const onCancel = vi.fn()
    render(<ProductForm values={{ ...valoresProducto, id: '' }} errors={{ price: 'El precio es obligatorio.' }} formError="Revisa" categories={initialCategories} onChange={onChange} onSubmit={() => {}} onCancel={onCancel} />)
    expect(screen.getByText('El precio es obligatorio.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear producto' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/Código/), 'A')
    expect(onChange).toHaveBeenCalledWith('id', 'A')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('CategoryForm cambia el texto del botón según el modo', () => {
    const valores = { name: 'Pinturas', icon: '🎨', description: '' }
    const { rerender } = render(<CategoryForm values={valores} errors={{}} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeInTheDocument()
    rerender(<CategoryForm mode="edit" values={valores} errors={{ name: 'Ya existe' }} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    expect(screen.getByText('Ya existe')).toBeInTheDocument()
  })
})

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'total', header: 'Total', align: 'end', render: (r) => `$${r.total}` },
  ]

  it('dibuja encabezados y filas, usando render cuando existe', () => {
    render(<DataTable columns={columns} rows={[{ id: 1, name: 'A', total: 10 }, { id: 2, name: 'B', total: 20 }]} />)
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument()
    expect(screen.getByText('$20')).toBeInTheDocument()
  })

  it('sin filas muestra el mensaje vacío', () => {
    render(<DataTable columns={columns} rows={[]} emptyMessage="Nada por aquí" />)
    expect(screen.getByRole('status')).toHaveTextContent('Nada por aquí')
    expect(screen.queryByRole('table')).toBeNull()
  })
})

describe('OrderReceipt', () => {
  it('muestra cliente, entrega, ítems y totales de una orden pagada', () => {
    const orden = initialOrders[2] // pagada con cupón
    renderWithRouter(<OrderReceipt order={orden} />)
    expect(screen.getByRole('article', { name: 'Boleta 20261008-001' })).toBeInTheDocument()
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByText(/Felipe Cortés/)).toBeInTheDocument()
    expect(screen.getByText(/Látex interior blanco/)).toBeInTheDocument()
    expect(screen.getByText(/Cupón CONTRATISTA10/)).toBeInTheDocument()
  })

  it('una orden rechazada muestra su estado', () => {
    renderWithRouter(<OrderReceipt order={initialOrders[3]} />)
    expect(screen.getByText('Rechazada')).toBeInTheDocument()
  })
})

describe('AdminSidebar, SalesReport y ToastHost', () => {
  it('AdminSidebar muestra solo los ítems recibidos, el usuario y el cierre de sesión', async () => {
    const onLogout = vi.fn()
    const items = [{ to: '/admin', label: 'Dashboard', icon: '📊', end: true }, { to: '/admin/productos', label: 'Productos', icon: '📦' }]
    renderWithRouter(<AdminSidebar items={items} user={initialUsers[1]} onLogout={onLogout} />, { route: '/admin/productos' })
    expect(screen.getByText('Dario Sagredo')).toBeInTheDocument()
    expect(screen.getByText('Vendedor')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Productos/ })).toHaveClass('active')
    expect(screen.queryByRole('link', { name: /Usuarios/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(onLogout).toHaveBeenCalled()
  })

  it('SalesReport muestra las cifras y las dos tablas', () => {
    render(
      <SalesReport
        summary={{ revenue: 250000, paidOrders: 3, rejectedOrders: 1, averageTicket: 83333 }}
        byProduct={[{ productId: 'MC001', name: 'Cemento', units: 10, revenue: 59900 }]}
        byCategory={[{ categoryId: 'mat', name: 'Mat. Construcción', units: 10, revenue: 59900 }]}
      />,
    )
    expect(screen.getByText('$250.000')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Ventas por producto' })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Ventas por categoría' })).toBeInTheDocument()
  })

  it('ToastHost muestra los avisos y permite cerrarlos', async () => {
    const onDismiss = vi.fn()
    render(<ToastHost toasts={[{ id: 7, message: 'Guardado', variant: 'success' }]} onDismiss={onDismiss} />)
    expect(screen.getByText('Guardado')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onDismiss).toHaveBeenCalledWith(7)
  })
})

describe('totales de ejemplo', () => {
  it('calculateTotals y OrderReceipt son coherentes con la orden sembrada', () => {
    const o = initialOrders[0]
    expect(o.totals).toEqual(calculateTotals(o.items, { couponPercent: 0, shipping: o.delivery.cost }))
  })
})
