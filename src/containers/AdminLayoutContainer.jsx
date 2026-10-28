// Contenedor: protege el panel (solo Administrador y Vendedor) y arma menú + contenido.
import { useRef } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import ForbiddenPage from '../components/pages/ForbiddenPage'
import AdminSidebar from '../components/organisms/AdminSidebar'
import AdminLayout from '../components/templates/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ADMIN_MENU } from '../data/adminMenu'

export default function AdminLayoutContainer() {
  const { user, isStaff, can, logout } = useAuth()
  const { notify } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  // Si la persona cierra sesión desde el panel, va a la tienda (no al login).
  const cerrandoSesion = useRef(false)

  // Sin sesión: al login, y al entrar vuelve a la página que se pidió.
  if (!user) {
    return cerrandoSesion.current ? (
      <Navigate to="/" replace />
    ) : (
      <Navigate to="/login" state={{ from: location.pathname }} replace />
    )
  }
  // Con sesión pero sin permiso (Cliente): acceso denegado.
  if (!isStaff) {
    return (
      <div className="container py-5">
        <ForbiddenPage message="El panel de administración es solo para Administradores y Vendedores." />
      </div>
    )
  }

  return (
    <AdminLayout
      sidebar={
        <AdminSidebar
          user={user}
          items={ADMIN_MENU.filter((item) => can(item.area))}
          onLogout={() => {
            cerrandoSesion.current = true
            logout()
            notify('Cerraste sesión.', 'info')
            navigate('/')
          }}
        />
      }
    >
      <Outlet />
    </AdminLayout>
  )
}
