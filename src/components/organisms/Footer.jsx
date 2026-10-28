// Organismo: pie de página.
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="lm-footer mt-5 py-4">
      <Container>
        <Row className="gy-3">
          <Col xs={12} md={4}>
            <h2 className="h6 text-white">🔨 Ferretería Los Maestros</h2>
            <p className="small mb-0">Más de 22 años construyendo junto a ti en La Serena, Región de Coquimbo.</p>
          </Col>
          <Col xs={6} md={4}>
            <h2 className="h6 text-white">Navegación</h2>
            <ul className="list-unstyled small mb-0">
              <li><Link to="/productos">Productos</Link></li>
              <li><Link to="/ofertas">Ofertas</Link></li>
              <li><Link to="/blogs">Blogs</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </Col>
          <Col xs={6} md={4}>
            <h2 className="h6 text-white">Atención</h2>
            <p className="small mb-0">
              Casa matriz La Serena
              <br />
              Lunes a sábado
            </p>
          </Col>
        </Row>
        <hr className="border-secondary" />
        <p className="small text-center mb-0">
          © {new Date().getFullYear()} Ferretería Los Maestros · Proyecto DSY1104 Duoc UC
        </p>
      </Container>
    </footer>
  )
}
