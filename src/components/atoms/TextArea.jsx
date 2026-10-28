// Átomo: área de texto con estado de error.
import Form from 'react-bootstrap/Form'

export default function TextArea({ id, value, onChange, rows = 4, isInvalid = false, ...resto }) {
  return (
    <Form.Control
      as="textarea"
      id={id}
      name={id}
      rows={rows}
      value={value ?? ''}
      onChange={onChange}
      isInvalid={isInvalid}
      aria-invalid={isInvalid || undefined}
      {...resto}
    />
  )
}
