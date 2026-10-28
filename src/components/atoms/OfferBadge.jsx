// Átomo: etiqueta de oferta "-15%". No se muestra si no hay descuento.
import Badge from 'react-bootstrap/Badge'

export default function OfferBadge({ percent }) {
  if (!(Number(percent) > 0)) return null
  return (
    <Badge bg="danger" className="lm-offer-badge">
      -{percent}%
    </Badge>
  )
}
