// Pruebas de eventos de los formularios: cada campo avisa su cambio al contenedor (onChange)
// con el nombre y el valor correctos. Se usa un contenedor de prueba con estado, igual que
// hacen los contenedores reales con el hook useForm.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { initialCategories } from '../../data/seed'
import { renderWithRouter } from '../../test/utils'
import CategoryForm from './CategoryForm'
import CheckoutForm from './CheckoutForm'
import ProductFilters from './ProductFilters'
import ProductForm from './ProductForm'
import ToastHost from './ToastHost'

function ConEstado({ inicial, children, onCambio = () => {} }) {
  const [values, setValues] = useState(inicial)
  const onChange = (campo, valor) => {
    onCambio(campo, valor)
    setValues((v) => ({ ...v, [campo]: valor }))
  }
  return children({ values, onChange })
}

describe('ProductForm: todos los campos', () => {
  it('cada campo escribe en su propio valor', async () => {
    const usuario = userEvent.setup()
    const cambios = vi.fn()
    const vacio = { id: '', name: '', categoryId: '', subcategory: '', brand: '', price: '', discountPercent: '0', stock: '', criticalStock: '', icon: '📦', description: '' }
    render(
      <ConEstado inicial={vacio} onCambio={cambios}>
        {({ values, onChange }) => (
          <ProductForm values={values} errors={{}} categories={initialCategories} onChange={onChange} onSubmit={(e) => e.preventDefault()} onCancel={() => {}} />
        )}
      </ConEstado>,
    )
    await usuario.type(screen.getByLabelText(/^Código/), 'AB1')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Pala')
    await usuario.selectOptions(screen.getByLabelText(/^Categoría/), 'herramientas')
    await usuario.type(screen.getByLabelText(/^Subcategoría/), 'Manuales')
    await usuario.type(screen.getByLabelText(/^Marca/), 'Truper')
    await usuario.type(screen.getByLabelText(/^Precio/), '3990')
    await usuario.clear(screen.getByLabelText(/^Descuento/))
    await usuario.type(screen.getByLabelText(/^Descuento/), '15')
    await usuario.type(screen.getByLabelText(/^Stock(?! crítico)/), '9')
    await usuario.type(screen.getByLabelText(/^Stock crítico/), '2')
    await usuario.clear(screen.getByLabelText(/^Ícono/))
    await usuario.type(screen.getByLabelText(/^Ícono/), '🔨')
    await usuario.type(screen.getByLabelText(/^Descripción/), 'Resistente')

    const campos = new Set(cambios.mock.calls.map(([campo]) => campo))
    expect(campos).toEqual(new Set(['id', 'name', 'categoryId', 'subcategory', 'brand', 'price', 'discountPercent', 'stock', 'criticalStock', 'icon', 'description']))
    expect(screen.getByLabelText(/^Subcategoría/)).toHaveValue('Manuales')
    expect(screen.getByLabelText(/^Descripción/)).toHaveValue('Resistente')
  })
})

describe('CategoryForm: todos los campos', () => {
  it('escribe nombre, ícono y descripción', async () => {
    const usuario = userEvent.setup()
    render(
      <ConEstado inicial={{ name: '', icon: '📦', description: '' }}>
        {({ values, onChange }) => (
          <CategoryForm values={values} errors={{}} onChange={onChange} onSubmit={(e) => e.preventDefault()} onCancel={() => {}} />
        )}
      </ConEstado>,
    )
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Jardín')
    await usuario.clear(screen.getByLabelText(/^Ícono/))
    await usuario.type(screen.getByLabelText(/^Ícono/), '🌱')
    await usuario.type(screen.getByLabelText(/^Descripción/), 'Plantas')
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Jardín')
    expect(screen.getByLabelText(/^Ícono/)).toHaveValue('🌱')
    expect(screen.getByLabelText(/^Descripción/)).toHaveValue('Plantas')
  })

  it('muestra el error de la descripción y el error general', () => {
    render(
      <CategoryForm
        values={{ name: 'x', icon: '', description: '' }}
        errors={{ description: 'La descripción es muy larga.' }}
        formError="Revisa el formulario"
        onChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByText('La descripción es muy larga.')).toBeInTheDocument()
    expect(screen.getByText('Revisa el formulario')).toBeInTheDocument()
  })
})

describe('CheckoutForm: campos opcionales y método de pago', () => {
  const inicial = {
    name: '', lastname: '', email: '', street: '', apartment: '', region: '', comuna: '', notes: '',
    deliveryId: 'despacho', paymentMethod: 'tarjeta',
  }

  it('escribe departamento e indicaciones, y encadena región → comuna', async () => {
    const usuario = userEvent.setup()
    const cambios = vi.fn()
    renderWithRouter(
      <ConEstado inicial={inicial} onCambio={cambios}>
        {({ values, onChange }) => (
          <CheckoutForm values={values} errors={{}} total={10000} onChange={onChange} onSubmit={(e) => e.preventDefault()} />
        )}
      </ConEstado>,
    )
    await usuario.type(screen.getByLabelText(/^Departamento/), '12B')
    await usuario.type(screen.getByLabelText(/^Indicaciones/), 'Portón verde')
    await usuario.selectOptions(screen.getByLabelText(/^Región/), 'Región de Coquimbo')
    expect(screen.getByLabelText(/^Comuna/)).toHaveValue('')
    await usuario.selectOptions(screen.getByLabelText(/^Comuna/), 'Ovalle')
    expect(cambios).toHaveBeenCalledWith('apartment', '12B')
    expect(cambios).toHaveBeenCalledWith('notes', 'Portón verde')
    expect(cambios).toHaveBeenCalledWith('region', 'Región de Coquimbo')
    expect(cambios).toHaveBeenCalledWith('comuna', 'Ovalle')
  })

  it('permite elegir el método de pago de demostración "pago rechazado"', async () => {
    const usuario = userEvent.setup()
    renderWithRouter(
      <ConEstado inicial={inicial}>
        {({ values, onChange }) => (
          <CheckoutForm values={values} errors={{}} total={10000} onChange={onChange} onSubmit={(e) => e.preventDefault()} />
        )}
      </ConEstado>,
    )
    const rechazada = screen.getByLabelText(/rechaz/i)
    await usuario.click(rechazada)
    expect(rechazada).toBeChecked()
  })
})

describe('ProductFilters: precio máximo', () => {
  it('informa el precio máximo escrito', async () => {
    const usuario = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ProductFilters
        filters={{ query: '', categoryId: '', maxPrice: '', onlyOffers: false, sort: '' }}
        categories={initialCategories}
        onChange={onChange}
        onReset={() => {}}
        resultCount={17}
      />,
    )
    await usuario.type(screen.getByLabelText('Precio máximo'), '5')
    expect(onChange).toHaveBeenCalledWith({ maxPrice: '5' })
  })
})

describe('ToastHost: cierre automático', () => {
  it('al cumplirse el tiempo avisa que el aviso debe descartarse', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<ToastHost toasts={[{ id: 7, message: 'Listo', variant: 'success' }]} onDismiss={onDismiss} />)
    expect(screen.getByText('Listo')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(4000)
    expect(onDismiss).toHaveBeenCalledWith(7)
    vi.useRealTimers()
  })
})
