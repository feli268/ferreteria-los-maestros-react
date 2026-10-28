// Página: sin permisos para ver esta sección.
import { Link } from 'react-router-dom'
import EmptyState from '../molecules/EmptyState'

export default function ForbiddenPage({ message = 'Tu rol no tiene acceso a esta sección.' }) {
  return (
    <EmptyState
      icon="🔒"
      title="Acceso restringido"
      message={message}
      action={
        <Link to="/" className="btn btn-primary">
          Volver a la tienda
        </Link>
      }
    />
  )
}
