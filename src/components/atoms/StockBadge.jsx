// Átomo: estado del stock (Agotado / crítico / disponible).
import Badge from 'react-bootstrap/Badge'
import { isCritical, isOutOfStock } from '../../utils/pricing'

export default function StockBadge({ product }) {
  if (isOutOfStock(product)) {
    return <Badge bg="danger">Agotado</Badge>
  }
  if (isCritical(product)) {
    return (
      <Badge bg="warning" text="dark">
        Stock crítico: {product.stock} un.
      </Badge>
    )
  }
  return <Badge bg="success">Disponible: {product.stock} un.</Badge>
}
