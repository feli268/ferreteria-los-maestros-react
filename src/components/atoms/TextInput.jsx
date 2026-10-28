// Átomo: campo de texto (input) con estado de error.
import Form from 'react-bootstrap/Form'

export default function TextInput({ id, type = 'text', value, onChange, isInvalid = false, ...resto }) {
  return (
    <Form.Control
      id={id}
      name={id}
      type={type}
      value={value ?? ''}
      onChange={onChange}
      isInvalid={isInvalid}
      aria-invalid={isInvalid || undefined}
      {...resto}
    />
  )
}
