import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { initialCategories, initialProducts } from '../../data/seed'
import { renderWithRouter } from '../../test/utils'
import { calculateTotals } from '../../utils/pricing'
import CategoryCard from './CategoryCard'
import ConfirmModal from './ConfirmModal'
import CouponForm from './CouponForm'
import EmptyState from './EmptyState'
import FormField from './FormField'
import OrderSummary from './OrderSummary'
import PageHeader from './PageHeader'
import ProductCard from './ProductCard'
import QuantityControl from './QuantityControl'
import RadioGroup from './RadioGroup'
import RegionComunaSelect from './RegionComunaSelect'
import SearchForm from './SearchForm'
import StatCard from './StatCard'

const producto = (id) => initialProducts.find((p) => p.id === id)

describe('FormField', () => {
  it('asocia la etiqueta con el campo y muestra el error accesible', () => {
    render(<FormField id="correo" label="Correo" required error="Formato inválido" value="" onChange={() => {}} />)
    const campo = screen.getByLabelText(/Correo/)
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAttribute('aria-describedby', 'correo-error')
    expect(screen.getByRole('alert')).toHaveTextContent('Formato inválido')
  })

  it('muestra la ayuda solo mientras no hay error', () => {
    const { rerender } = render(<FormField id="c" label="Clave" hint="4 a 10 caracteres" value="" onChange={() => {}} />)
    expect(screen.getByText('4 a 10 caracteres')).toBeInTheDocument()
    rerender(<FormField id="c" label="Clave" hint="4 a 10 caracteres" error="Muy corta" value="" onChange={() => {}} />)
    expect(screen.queryByText('4 a 10 caracteres')).toBeNull()
  })

  it('renderiza select y textarea según la prop "as"', () => {
    const { rerender } = render(
      <FormField id="s" as="select" label="Rol" options={[{ value: 'x', label: 'X' }]} value="" onChange={() => {}} />,
    )
    expect(screen.getByLabelText('Rol').tagName).toBe('SELECT')
    rerender(<FormField id="t" as="textarea" label="Mensaje" value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Mensaje').tagName).toBe('TEXTAREA')
  })
})

describe('SearchForm', () => {
  it('envía el texto sin espacios sobrantes con el botón y con Enter', async () => {
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)
    await userEvent.type(screen.getByRole('searchbox'), '  cemento {enter}')
    expect(onSearch).toHaveBeenCalledWith('cemento')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onSearch).toHaveBeenCalledTimes(2)
  })

  it('se sincroniza cuando cambia el valor inicial (por ejemplo, al limpiar filtros)', () => {
    const { rerender } = render(<SearchForm initialValue="taladro" onSearch={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('taladro')
    rerender(<SearchForm initialValue="" onSearch={() => {}} />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})

describe('QuantityControl', () => {
  function Contenedor({ max = 5, inicial = 1 }) {
    const [valor, setValor] = useState(inicial)
    return <QuantityControl value={valor} onChange={setValor} max={max} />
  }

  it('aumenta y disminuye con los botones (estado)', async () => {
    render(<Contenedor />)
    await userEvent.click(screen.getByRole('button', { name: /aumentar/i }))
    await userEvent.click(screen.getByRole('button', { name: /aumentar/i }))
    expect(screen.getByRole('spinbutton')).toHaveValue(3)
    await userEvent.click(screen.getByRole('button', { name: /disminuir/i }))
    expect(screen.getByRole('spinbutton')).toHaveValue(2)
  })

  it('no baja del mínimo ni supera el máximo (stock)', async () => {
    render(<Contenedor max={2} inicial={2} />)
    expect(screen.getByRole('button', { name: /aumentar/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /disminuir/i }))
    expect(screen.getByRole('button', { name: /disminuir/i })).toBeDisabled()
  })

  it('limita un valor escrito a mano al máximo', async () => {
    const onChange = vi.fn()
    render(<QuantityControl value={1} onChange={onChange} max={4} />)
    await userEvent.type(screen.getByRole('spinbutton'), '9')
    expect(onChange).toHaveBeenLastCalledWith(4)
  })
})

describe('ProductCard', () => {
  it('muestra nombre, marca, categoría, precio y stock (props)', () => {
    renderWithRouter(<ProductCard product={producto('HE001')} categoryName="Herramientas" onAdd={() => {}} />)
    expect(screen.getByRole('heading', { name: /Taladro Percutor/ })).toBeInTheDocument()
    expect(screen.getByText('Bosch')).toBeInTheDocument()
    expect(screen.getByText('Herramientas')).toBeInTheDocument()
    expect(screen.getByText('-10%')).toBeInTheDocument()
    expect(screen.getByTestId('precio-final')).toHaveTextContent('$38.691')
  })

  it('el botón Agregar llama a onAdd con el producto (evento)', async () => {
    const onAdd = vi.fn()
    renderWithRouter(<ProductCard product={producto('MC001')} onAdd={onAdd} />)
    await userEvent.click(screen.getByRole('button', { name: /Agregar Cemento Polpaico/ }))
    expect(onAdd).toHaveBeenCalledWith(producto('MC001'))
  })

  it('un producto agotado deshabilita el botón (renderizado condicional)', () => {
    renderWithRouter(<ProductCard product={{ ...producto('MC001'), stock: 0 }} onAdd={() => {}} />)
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeDisabled()
    expect(screen.getByText('Agotado', { selector: '.badge' })).toBeInTheDocument()
  })

  it('el enlace Detalles apunta a la ficha del producto', () => {
    renderWithRouter(<ProductCard product={producto('MC001')} onAdd={() => {}} />)
    expect(screen.getByRole('link', { name: /Ver detalles/ })).toHaveAttribute('href', '/productos/MC001')
  })
})

describe('CategoryCard, StatCard, EmptyState y PageHeader', () => {
  it('CategoryCard enlaza a la categoría', () => {
    renderWithRouter(<CategoryCard category={initialCategories[0]} productCount={5} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/categorias/mat-construccion')
    expect(screen.getByText('5 productos')).toBeInTheDocument()
  })

  it('CategoryCard usa singular cuando hay un solo producto', () => {
    renderWithRouter(<CategoryCard category={initialCategories[0]} productCount={1} />)
    expect(screen.getByText('1 producto')).toBeInTheDocument()
  })

  it('StatCard sin "to" no es un enlace', () => {
    renderWithRouter(<StatCard icon="📦" label="Productos" value={17} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('StatCard con "to" es un enlace', () => {
    renderWithRouter(<StatCard icon="📦" label="Productos" value={17} to="/admin/productos" />)
    expect(screen.getByRole('link', { name: 'Productos: 17' })).toHaveAttribute('href', '/admin/productos')
  })

  it('EmptyState muestra título, mensaje y acción', () => {
    render(<EmptyState title="Sin resultados" message="Prueba con otra búsqueda" action={<button>Limpiar</button>} />)
    expect(screen.getByRole('status')).toHaveTextContent('Sin resultados')
    expect(screen.getByText('Prueba con otra búsqueda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument()
  })

  it('PageHeader muestra título, subtítulo y acciones opcionales', () => {
    const { rerender } = render(<PageHeader title="Productos" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Productos' })).toBeInTheDocument()
    expect(screen.queryByText('Catálogo')).toBeNull()
    rerender(<PageHeader title="Productos" subtitle="Catálogo" actions={<button>Nuevo</button>} />)
    expect(screen.getByText('Catálogo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument()
  })
})

describe('CouponForm', () => {
  it('con un código válido llama a onApply y limpia el campo', async () => {
    const onApply = vi.fn().mockReturnValue({ ok: true, percent: 10 })
    render(<CouponForm onApply={onApply} onRemove={() => {}} />)
    await userEvent.type(screen.getByLabelText(/cupón/i), 'maestro10')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).toHaveBeenCalledWith('maestro10')
    expect(screen.getByLabelText(/cupón/i)).toHaveValue('')
  })

  it('muestra el error si el cupón no es válido', async () => {
    const onApply = vi.fn().mockReturnValue({ ok: false, message: 'El cupón ingresado no es válido.' })
    render(<CouponForm onApply={onApply} onRemove={() => {}} />)
    await userEvent.type(screen.getByLabelText(/cupón/i), 'xxx')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('no es válido')
  })

  it('pide ingresar un código cuando el campo está vacío', async () => {
    const onApply = vi.fn()
    render(<CouponForm onApply={onApply} onRemove={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa un código')
  })

  it('con un cupón aplicado muestra el código y permite quitarlo', async () => {
    const onRemove = vi.fn()
    render(<CouponForm appliedCode="MAESTRO10" appliedPercent={10} onApply={() => {}} onRemove={onRemove} />)
    expect(screen.getByText('MAESTRO10')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})

describe('RadioGroup y RegionComunaSelect', () => {
  const opciones = [
    { value: 'retiro', label: 'Retiro en tienda', description: 'Sin costo' },
    { value: 'despacho', label: 'Despacho' },
  ]

  it('RadioGroup marca la opción elegida y avisa el cambio', async () => {
    const onChange = vi.fn()
    render(<RadioGroup name="entrega" legend="Entrega" options={opciones} value="retiro" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: /Retiro en tienda/ })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: /Despacho/ }))
    expect(onChange).toHaveBeenCalledWith('despacho')
  })

  it('RadioGroup muestra el error', () => {
    render(<RadioGroup name="entrega" legend="Entrega" options={opciones} value="" onChange={() => {}} error="Elige una opción" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Elige una opción')
  })

  it('la comuna está deshabilitada hasta elegir región', () => {
    render(<RegionComunaSelect region="" comuna="" onChange={() => {}} />)
    expect(screen.getByLabelText(/Comuna/)).toBeDisabled()
  })

  it('al elegir una región se cargan solo sus comunas y se limpia la comuna', async () => {
    const onChange = vi.fn()
    render(<RegionComunaSelect region="Región de Coquimbo" comuna="La Serena" onChange={onChange} />)
    const comunas = within(screen.getByLabelText(/Comuna/)).getAllByRole('option').map((o) => o.textContent)
    expect(comunas).toContain('Ovalle')
    expect(comunas).not.toContain('Santiago')
    await userEvent.selectOptions(screen.getByLabelText(/Región/), 'Región de Valparaíso')
    expect(onChange).toHaveBeenCalledWith({ region: 'Región de Valparaíso', comuna: '' })
  })
})

describe('OrderSummary', () => {
  it('desglosa neto, IVA y total sin cupón', () => {
    const totals = calculateTotals([{ unitPrice: 11900, quantity: 1 }])
    render(<OrderSummary totals={totals} />)
    expect(screen.getByText('$10.000')).toBeInTheDocument() // neto
    expect(screen.getByText('$1.900')).toBeInTheDocument() // IVA
    expect(screen.getByText('Total a pagar').nextSibling).toHaveTextContent('$11.900')
    expect(screen.queryByText(/Cupón/)).toBeNull()
  })

  it('muestra el cupón y el despacho gratis cuando corresponde', () => {
    const totals = calculateTotals([{ unitPrice: 60000, quantity: 1 }], { couponPercent: 10, shipping: 0 })
    render(<OrderSummary totals={totals} couponCode="MAESTRO10" couponPercent={10} />)
    expect(screen.getByText(/Cupón MAESTRO10/)).toBeInTheDocument()
    expect(screen.getByText('-$6.000')).toBeInTheDocument()
    expect(screen.getByText('Gratis')).toBeInTheDocument()
  })
})

describe('ConfirmModal', () => {
  it('confirma o cancela y no se muestra si show es falso', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { rerender } = render(
      <ConfirmModal show={false} message="¿Eliminar?" onConfirm={onConfirm} onCancel={onCancel} />,
    )
    expect(screen.queryByText('¿Eliminar?')).toBeNull()
    rerender(
      <ConfirmModal show message="¿Eliminar?" confirmLabel="Sí, eliminar" onConfirm={onConfirm} onCancel={onCancel} />,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, eliminar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
