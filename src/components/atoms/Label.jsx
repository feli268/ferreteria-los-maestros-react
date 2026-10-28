// Átomo: etiqueta de un campo; marca con * los obligatorios.
import Form from 'react-bootstrap/Form'

export default function Label({ htmlFor, required = false, children }) {
  return (
    <Form.Label htmlFor={htmlFor} className="fw-semibold small mb-1">
      {children}
      {required && (
        <span className="text-danger ms-1" aria-hidden="true">
          *
        </span>
      )}
    </Form.Label>
  )
}
