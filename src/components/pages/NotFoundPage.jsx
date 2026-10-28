// Página: 404.
import { Link } from 'react-router-dom'
import EmptyState from '../molecules/EmptyState'

export default function NotFoundPage({ title = 'Página no encontrada', message = 'La dirección que buscas no existe o fue movida.' }) {
  return (
    <EmptyState
      icon="🧭"
      title={title}
      message={message}
      action={
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      }
    />
  )
}
