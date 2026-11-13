// Molécula: estado de la conexión con el backend (cargando datos o error al conectar).
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

export default function ConnectionState({ status, message, onRetry }) {
  if (status === 'error') {
    return (
      <div className="container py-5 text-center" role="alert">
        <div style={{ fontSize: '3rem' }} aria-hidden="true">🔌</div>
        <h2 className="h4 mt-3">No pudimos cargar los datos</h2>
        <p className="text-secondary">{message}</p>
        <Button variant="primary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )
  }
  return (
    <div className="container py-5 text-center" role="status">
      <Spinner animation="border" variant="primary" aria-hidden="true" />
      <p className="mt-3 text-secondary mb-0">Cargando datos…</p>
    </div>
  )
}
