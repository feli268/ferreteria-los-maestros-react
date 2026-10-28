// Plantilla: estructura del panel de administración (menú lateral + contenido).
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'

export default function AdminLayout({ sidebar, children }) {
  return (
    <div className="lm-admin min-vh-100">
      <Row className="g-0">
        <Col xs={12} lg={3} xl={2} className="lm-admin-side-col">
          {sidebar}
        </Col>
        <Col xs={12} lg={9} xl={10}>
          <main className="p-3 p-md-4" id="contenido-admin" tabIndex={-1}>
            {children}
          </main>
        </Col>
      </Row>
    </div>
  )
}
