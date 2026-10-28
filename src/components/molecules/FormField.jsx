// Molécula: etiqueta + control (input, select o textarea) + mensaje de error / ayuda.
import Form from 'react-bootstrap/Form'
import ErrorMessage from '../atoms/ErrorMessage'
import Label from '../atoms/Label'
import SelectInput from '../atoms/SelectInput'
import TextArea from '../atoms/TextArea'
import TextInput from '../atoms/TextInput'

export default function FormField({
  id,
  label,
  as = 'input',
  required = false,
  error,
  hint,
  options,
  placeholder,
  ...controlProps
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  const comunes = { id, isInvalid: !!error, 'aria-describedby': describedBy, required: undefined, ...controlProps }

  let control
  if (as === 'select') {
    control = <SelectInput {...comunes} options={options} placeholder={placeholder} />
  } else if (as === 'textarea') {
    control = <TextArea {...comunes} placeholder={placeholder} />
  } else {
    control = <TextInput {...comunes} placeholder={placeholder} />
  }

  return (
    <Form.Group className="mb-3">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {control}
      {hint && !error && (
        <div id={hintId} className="form-text">
          {hint}
        </div>
      )}
      <ErrorMessage id={errorId}>{error}</ErrorMessage>
    </Form.Group>
  )
}
