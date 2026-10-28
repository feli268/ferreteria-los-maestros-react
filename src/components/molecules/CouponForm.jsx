// Molécula: ingreso de cupón de descuento. `onApply(codigo)` devuelve { ok, message }.
import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import ActionButton from '../atoms/ActionButton'

export default function CouponForm({ appliedCode = '', appliedPercent = 0, onApply, onRemove }) {
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState(null)

  if (appliedCode) {
    return (
      <div className="d-flex justify-content-between align-items-center border rounded p-2 bg-success-subtle">
        <span>
          Cupón <strong>{appliedCode}</strong> aplicado ({appliedPercent}% de descuento)
        </span>
        <ActionButton variant="link" size="sm" onClick={onRemove}>
          Quitar
        </ActionButton>
      </div>
    )
  }

  const enviar = (evento) => {
    evento.preventDefault()
    if (!codigo.trim()) {
      setResultado({ ok: false, message: 'Ingresa un código de cupón.' })
      return
    }
    const r = onApply(codigo)
    setResultado(r)
    if (r.ok) setCodigo('')
  }

  return (
    <Form onSubmit={enviar} noValidate>
      <Form.Label htmlFor="cupon" className="fw-semibold small mb-1">
        ¿Tienes un cupón?
      </Form.Label>
      <InputGroup>
        <Form.Control
          id="cupon"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ej: CONTRATISTA10"
          isInvalid={resultado?.ok === false}
        />
        <ActionButton type="submit" variant="outline-primary">
          Aplicar
        </ActionButton>
      </InputGroup>
      {resultado?.ok === false && (
        <div className="invalid-feedback d-block" role="alert">
          {resultado.message}
        </div>
      )}
    </Form>
  )
}
