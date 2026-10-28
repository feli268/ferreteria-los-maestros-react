// Átomo: lista desplegable. `options` = [{ value, label }].
import Form from 'react-bootstrap/Form'

export default function SelectInput({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona...',
  isInvalid = false,
  disabled = false,
  ...resto
}) {
  return (
    <Form.Select
      id={id}
      name={id}
      value={value ?? ''}
      onChange={onChange}
      isInvalid={isInvalid}
      aria-invalid={isInvalid || undefined}
      disabled={disabled}
      {...resto}
    >
      <option value="">{placeholder}</option>
      {options.map((opcion) => (
        <option key={opcion.value} value={opcion.value}>
          {opcion.label}
        </option>
      ))}
    </Form.Select>
  )
}
