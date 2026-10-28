// Página: panel principal de administración (cifras y accesos directos).
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon'
import PageHeader from '../molecules/PageHeader'
import StatCard from '../molecules/StatCard'

export default function AdminDashboardPage({ user, cards, shortcuts }) {
  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Bienvenido/a, ${user.name}. Rol: ${user.role}.`} />
      <Row className="g-3 mb-4">
        {cards.map((c) => (
          <Col key={c.label} xs={12} sm={6} xl={4}>
            <StatCard {...c} />
          </Col>
        ))}
      </Row>
      <h2 className="h5 mb-3">Accesos directos</h2>
      <Row className="g-3">
        {shortcuts.map((s) => (
          <Col key={s.to} xs={12} sm={6} lg={4}>
            <Card as={Link} to={s.to} className="h-100 text-decoration-none lm-stat-card">
              <Card.Body>
                <Icon symbol={s.icon} size="2rem" />
                <Card.Title as="h3" className="h6 mt-2">{s.label}</Card.Title>
                <Card.Text className="small text-secondary mb-0">{s.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
