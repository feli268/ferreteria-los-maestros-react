// Contenedor: página de inicio del panel (/admin).
// El Administrador ve el dashboard; el Vendedor no tiene dashboard y entra directo al listado de productos.
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminDashboardContainer from './AdminDashboardContainer'

export default function AdminHomeContainer() {
  const { can } = useAuth()
  if (!can('dashboard')) return <Navigate to="/admin/productos" replace />
  return <AdminDashboardContainer />
}
