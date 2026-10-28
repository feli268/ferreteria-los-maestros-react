// Átomo: botón con estado de carga (evita doble clic mientras se procesa).
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

export default function ActionButton({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  loadingText = 'Procesando...',
  ...resto
}) {
  return (
    <Button variant={variant} type={type} disabled={disabled || loading} {...resto}>
      {loading ? (
        <>
          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
