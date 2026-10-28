// Molécula: buscador (campo + botón). Mantiene su propio texto y avisa con onSearch al enviar.
import { useEffect, useState } from 'react'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import ActionButton from '../atoms/ActionButton'

export default function SearchForm({
  initialValue = '',
  placeholder = 'Buscar productos...',
  label = 'Buscar productos',
  buttonLabel = 'Buscar',
  onSearch,
  className = '',
}) {
  const [texto, setTexto] = useState(initialValue)

  // Si la URL cambia desde fuera (p. ej. "Limpiar filtros"), el campo se sincroniza.
  useEffect(() => setTexto(initialValue), [initialValue])

  const enviar = (evento) => {
    evento.preventDefault()
    onSearch(texto.trim())
  }

  return (
    <Form role="search" onSubmit={enviar} className={className}>
      <InputGroup>
        <Form.Control
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
        <ActionButton type="submit" variant="primary">
          {buttonLabel}
        </ActionButton>
      </InputGroup>
    </Form>
  )
}
