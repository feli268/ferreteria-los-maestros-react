// Organismo: menú lateral del panel de administración (horizontal en móvil, vertical en escritorio).
import Nav from 'react-bootstrap/Nav'
import { NavLink } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import Icon from '../atoms/Icon'

export default function AdminSidebar({ items, user, onLogout }) {
  return (
    <aside className="lm-admin-sidebar p-3" aria-label="Menú de administración">
      <div className="text-white mb-3 d-none d-lg-block">
        <div className="fw-bold">{user.name} {user.lastname}</div>
        <div className="small text-white-50">{user.role}</div>
      </div>
      <Nav className="flex-row flex-lg-column flex-nowrap overflow-auto gap-1" variant="pills">
        {items.map((item) => (
          <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.end} className="text-nowrap">
            <Icon symbol={item.icon} size="1rem" /> {item.label}
          </Nav.Link>
        ))}
        <Nav.Link as={NavLink} to="/" className="text-nowrap" end>
          <Icon symbol="🏪" size="1rem" /> Tienda
        </Nav.Link>
      </Nav>
      <ActionButton variant="outline-light" size="sm" className="mt-3 w-100" onClick={onLogout}>
        Cerrar sesión
      </ActionButton>
    </aside>
  )
}
