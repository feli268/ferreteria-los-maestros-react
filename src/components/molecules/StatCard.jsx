// Molécula: tarjeta con una cifra (dashboard). Si recibe `to`, es un enlace.
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon'

export default function StatCard({ icon, label, value, to, tone = 'primary' }) {
  const contenido = (
    <Card.Body className="d-flex align-items-center gap-3">
      <span className={`lm-stat-icon bg-${tone}-subtle`}>
        <Icon symbol={icon} size="1.75rem" />
      </span>
      <div>
        <div className="small text-secondary">{label}</div>
        <div className="fs-4 fw-bold lh-1">{value}</div>
      </div>
    </Card.Body>
  )
  return to ? (
    <Card as={Link} to={to} className="h-100 text-decoration-none text-reset lm-stat-card" aria-label={`${label}: ${value}`}>
      {contenido}
    </Card>
  ) : (
    <Card className="h-100 lm-stat-card">{contenido}</Card>
  )
}
