// Plantilla: estructura de las páginas de la tienda (cabecera, contenido y pie).
import Container from 'react-bootstrap/Container'

export default function StoreLayout({ header, footer, children }) {
  return (
    <div className="lm-app d-flex flex-column min-vh-100">
      <a href="#contenido" className="visually-hidden-focusable lm-skip-link">
        Saltar al contenido
      </a>
      {header}
      <Container as="main" id="contenido" className="flex-grow-1 py-4" tabIndex={-1}>
        {children}
      </Container>
      {footer}
    </div>
  )
}
