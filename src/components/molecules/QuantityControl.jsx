// Molécula: selector de cantidad con botones − y +. Respeta el mínimo y el máximo (stock).
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'

export default function QuantityControl({ value, onChange, min = 1, max = 99, label = 'Cantidad', size = 'md' }) {
  const cambiar = (nuevo) => {
    const n = Math.floor(Number(nuevo))
    if (Number.isNaN(n)) return
    onChange(Math.min(Math.max(n, min), max))
  }

  return (
    <InputGroup size={size === 'sm' ? 'sm' : undefined} className="lm-qty" style={{ maxWidth: 150 }}>
      <Button
        variant="outline-secondary"
        aria-label={`Disminuir ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => cambiar(value - 1)}
      >
        −
      </Button>
      <Form.Control
        type="number"
        className="text-center"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => cambiar(e.target.value)}
      />
      <Button
        variant="outline-secondary"
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => cambiar(value + 1)}
      >
        +
      </Button>
    </InputGroup>
  )
}
