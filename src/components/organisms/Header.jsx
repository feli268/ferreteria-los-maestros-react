// Organismo: barra de navegación principal (responsive con Navbar de Bootstrap).
import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Navbar from 'react-bootstrap/Navbar'
import { Link, NavLink } from 'react-router-dom'
import { formatCLP } from '../../utils/format'
import Icon from '../atoms/Icon'
import SearchForm from '../molecules/SearchForm'

export default function Header({ user, isStaff, cartCount, cartTotal, categories, onSearch, onLogout }) {
  const [expanded, setExpanded] = useState(false)
  // En móvil el menú se cierra al elegir una opción.
  const cerrar = () => setExpanded(false)
  const enlace = (to, texto, extra = {}) => (
    <Nav.Link as={NavLink} to={to} onClick={cerrar} {...extra}>
      {texto}
    </Nav.Link>
  )

  return (
    <header className="sticky-top lm-header">
    <Navbar expand="xl" expanded={expanded} onToggle={setExpanded} variant="dark" className="lm-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={cerrar} className="d-flex align-items-center gap-2">
          <Icon symbol="🔨" size="1.75rem" />
          <span className="lh-1">
            <span className="d-block fw-bold">Ferretería Los Maestros</span>
            <small className="d-none d-md-block text-white-50">La Serena • Región de Coquimbo</small>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="menu-principal" aria-expanded={expanded} label="Abrir menú" />

        <Navbar.Collapse id="menu-principal">
          <Nav className="me-auto">
            {enlace('/', 'Home', { end: true })}
            {enlace('/productos', 'Productos', { end: true })}
            {enlace('/ofertas', 'Ofertas')}
            <NavDropdown title="Categorías" id="menu-categorias">
              {categories.map((c) => (
                <NavDropdown.Item key={c.id} as={Link} to={`/categorias/${c.id}`} onClick={cerrar}>
                  {c.icon} {c.name}
                </NavDropdown.Item>
              ))}
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/categorias" onClick={cerrar}>
                Ver todas las categorías
              </NavDropdown.Item>
            </NavDropdown>
            {enlace('/nosotros', 'Nosotros')}
            {enlace('/blogs', 'Blogs')}
            {enlace('/contacto', 'Contacto')}
          </Nav>

          <Nav className="align-items-xl-center">
            {user ? (
              <NavDropdown title={`Hola, ${user.name}`} id="menu-usuario" align="end">
                {isStaff && (
                  <NavDropdown.Item as={Link} to="/admin" onClick={cerrar}>
                    Panel de administración
                  </NavDropdown.Item>
                )}
                <NavDropdown.Item
                  as="button"
                  type="button"
                  onClick={() => {
                    cerrar()
                    onLogout()
                  }}
                >
                  Cerrar sesión
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                {enlace('/login', 'Iniciar sesión')}
                {enlace('/registro', 'Registrarse', { className: 'text-warning' })}
              </>
            )}
            {enlace(
              '/carrito',
              <>
                <Icon symbol="🛒" /> Carrito{' '}
                <span className="badge text-bg-warning" data-testid="cart-count">
                  {cartCount}
                </span>{' '}
                <span className="small" data-testid="cart-total">
                  {formatCLP(cartTotal)}
                </span>
              </>,
              { 'aria-label': `Carrito: ${cartCount} productos, ${formatCLP(cartTotal)}` },
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    <div className="lm-subbar py-2">
      <Container>
        <SearchForm
          className="lm-header-search mx-auto"
          placeholder="Buscar productos..."
          onSearch={(texto) => {
            cerrar()
            onSearch(texto)
          }}
        />
      </Container>
    </div>
    </header>
  )
}
