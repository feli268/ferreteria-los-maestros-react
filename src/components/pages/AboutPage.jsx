// Página: Nosotros (contenido estático).
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Icon from '../atoms/Icon'
import PageHeader from '../molecules/PageHeader'

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Nuestra empresa" />
      <Card body className="mb-4">
        <p className="fs-5">
          <strong>Ferretería Los Maestros</strong> es un negocio familiar fundado en La Serena, Región de Coquimbo, con
          más de <strong>22 años de trayectoria</strong> en el rubro de la construcción, herramientas manuales y
          eléctricas, gasfitería y electricidad.
        </p>
        <p className="text-secondary mb-0">
          Atendida por su dueño, su hijo y un equipo especializado de mesón, nuestra misión es brindar asesoría técnica
          confiable, disponibilidad inmediata de inventario para contratistas y particulares, y precios justos que
          apoyen el desarrollo local de las obras de nuestra región.
        </p>
      </Card>
      <Row className="g-3">
        <Col xs={12} md={6}>
          <Card body className="text-center h-100">
            <Icon symbol="👨‍💻" size="2.5rem" />
            <h2 className="h5 mt-2">Equipo de desarrollo Duoc UC</h2>
            <p className="small fw-semibold mb-1">Felipe Cortés · Dario Sagredo · Eduardo Contreras</p>
            <p className="small text-secondary mb-1">Ingeniería en Informática</p>
            <p className="small text-warning-emphasis mb-0">Curso DSY1104 - Desarrollo Fullstack II</p>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card body className="text-center h-100">
            <Icon symbol="🏪" size="2.5rem" />
            <h2 className="h5 mt-2">Casa matriz</h2>
            <p className="small text-secondary mb-1">La Serena, IV Región</p>
            <p className="small text-success mb-0">Atención de lunes a sábado</p>
          </Card>
        </Col>
      </Row>
    </>
  )
}
