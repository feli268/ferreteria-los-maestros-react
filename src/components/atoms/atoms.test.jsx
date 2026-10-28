import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ActionButton from './ActionButton'
import ErrorMessage from './ErrorMessage'
import Icon from './Icon'
import Label from './Label'
import OfferBadge from './OfferBadge'
import PriceTag from './PriceTag'
import SelectInput from './SelectInput'
import StockBadge from './StockBadge'
import TextArea from './TextArea'
import TextInput from './TextInput'

describe('Átomos - renderizado y props', () => {
  it('Icon es decorativo sin label y se anuncia con label', () => {
    const { rerender } = render(<Icon symbol="🧱" />)
    expect(screen.queryByRole('img')).toBeNull()
    rerender(<Icon symbol="🧱" label="Ladrillo" />)
    expect(screen.getByRole('img', { name: 'Ladrillo' })).toBeInTheDocument()
  })

  it('PriceTag muestra solo el precio final cuando no hay oferta', () => {
    render(<PriceTag product={{ price: 5990, discountPercent: 0 }} />)
    expect(screen.getByTestId('precio-final')).toHaveTextContent('$5.990')
    expect(screen.queryByTestId('precio-original')).toBeNull()
  })

  it('PriceTag con oferta muestra el precio con descuento y el original tachado', () => {
    render(<PriceTag product={{ price: 7490, discountPercent: 15 }} />)
    expect(screen.getByTestId('precio-final')).toHaveTextContent('$6.367')
    expect(screen.getByTestId('precio-original')).toHaveTextContent('$7.490')
  })

  it('StockBadge cambia de texto según el stock (renderizado condicional)', () => {
    const { rerender } = render(<StockBadge product={{ stock: 0, criticalStock: 5 }} />)
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    rerender(<StockBadge product={{ stock: 3, criticalStock: 5 }} />)
    expect(screen.getByText(/Stock crítico: 3 un\./)).toBeInTheDocument()
    rerender(<StockBadge product={{ stock: 40, criticalStock: 5 }} />)
    expect(screen.getByText(/Disponible: 40 un\./)).toBeInTheDocument()
  })

  it('OfferBadge no se muestra sin descuento', () => {
    const { container, rerender } = render(<OfferBadge percent={0} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<OfferBadge percent={25} />)
    expect(screen.getByText('-25%')).toBeInTheDocument()
  })

  it('ErrorMessage solo aparece cuando hay un mensaje y se anuncia como alerta', () => {
    const { rerender } = render(<ErrorMessage id="e1">{''}</ErrorMessage>)
    expect(screen.queryByRole('alert')).toBeNull()
    rerender(<ErrorMessage id="e1">Campo obligatorio</ErrorMessage>)
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obligatorio')
  })

  it('Label marca los campos obligatorios con asterisco', () => {
    render(<Label htmlFor="x" required>Nombre</Label>)
    expect(screen.getByText('Nombre').closest('label')).toHaveAttribute('for', 'x')
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})

describe('Átomos - eventos', () => {
  it('TextInput llama a onChange al escribir y marca el estado inválido', async () => {
    const onChange = vi.fn()
    render(<TextInput id="nombre" value="" onChange={onChange} isInvalid aria-label="Nombre" />)
    const campo = screen.getByLabelText('Nombre')
    await userEvent.type(campo, 'ab')
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveClass('is-invalid')
  })

  it('TextArea usa un textarea con las filas indicadas', () => {
    render(<TextArea id="msg" value="Hola" rows={6} onChange={() => {}} aria-label="Mensaje" />)
    const area = screen.getByLabelText('Mensaje')
    expect(area.tagName).toBe('TEXTAREA')
    expect(area).toHaveAttribute('rows', '6')
    expect(area).toHaveValue('Hola')
  })

  it('SelectInput lista las opciones y avisa la selección', async () => {
    const onChange = vi.fn()
    render(
      <SelectInput
        id="rol"
        value=""
        onChange={onChange}
        options={[{ value: 'a', label: 'Opción A' }, { value: 'b', label: 'Opción B' }]}
        aria-label="Rol"
      />,
    )
    expect(screen.getAllByRole('option')).toHaveLength(3) // placeholder + 2
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'b')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('ActionButton ejecuta onClick, y en carga se deshabilita y muestra el texto de carga', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<ActionButton onClick={onClick}>Guardar</ActionButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<ActionButton onClick={onClick} loading loadingText="Guardando...">Guardar</ActionButton>)
    const boton = screen.getByRole('button', { name: /Guardando/ })
    expect(boton).toBeDisabled()
    await userEvent.click(boton)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
