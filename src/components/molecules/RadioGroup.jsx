// Molécula: grupo de opciones (radio). `options` = [{ value, label, description }].
import Form from 'react-bootstrap/Form'
import ErrorMessage from '../atoms/ErrorMessage'

export default function RadioGroup({ name, legend, options, value, onChange, error, required = false }) {
  return (
    <fieldset className="mb-3">
      <legend className="fs-6 fw-semibold mb-2">
        {legend}
        {required && (
          <span className="text-danger ms-1" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      {options.map((opcion) => (
        <Form.Check
          key={opcion.value}
          type="radio"
          id={`${name}-${opcion.value}`}
          name={name}
          value={opcion.value}
          checked={value === opcion.value}
          onChange={() => onChange(opcion.value)}
          label={
            <>
              <span className="fw-semibold">{opcion.label}</span>
              {opcion.description && <span className="d-block small text-secondary">{opcion.description}</span>}
            </>
          }
          className="mb-2"
          isInvalid={!!error}
        />
      ))}
      <ErrorMessage id={`${name}-error`}>{error}</ErrorMessage>
    </fieldset>
  )
}
