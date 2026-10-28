// Contenedor: deja pasar solo si el rol del usuario tiene permiso sobre el área (p. ej. "users").
import { Outlet } from 'react-router-dom'
import ForbiddenPage from '../components/pages/ForbiddenPage'
import { useAuth } from '../context/AuthContext'

export default function RequireArea({ area }) {
  const { can } = useAuth()
  if (!can(area)) {
    return <ForbiddenPage message="Tu rol no tiene permiso para ver esta sección del panel." />
  }
  return <Outlet />
}
