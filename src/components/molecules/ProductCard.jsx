// Molécula: tarjeta de producto del catálogo.
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import { isOutOfStock } from '../../utils/pricing'
import Icon from '../atoms/Icon'
import OfferBadge from '../atoms/OfferBadge'
import PriceTag from '../atoms/PriceTag'
import StockBadge from '../atoms/StockBadge'

export default function ProductCard({ product, categoryName, onAdd }) {
  const agotado = isOutOfStock(product)
  return (
    <Card className="h-100 lm-product-card" data-testid={`producto-${product.id}`}>
      <div className="lm-product-img position-relative">
        <Icon symbol={product.icon} size="3.5rem" />
        <span className="position-absolute top-0 end-0 m-2">
          <OfferBadge percent={product.discountPercent} />
        </span>
      </div>
      <Card.Body className="d-flex flex-column">
        {categoryName && <div className="text-uppercase small text-secondary fw-semibold">{categoryName}</div>}
        <Card.Title as="h3" className="fs-6 mb-1">
          {product.name}
        </Card.Title>
        {product.brand && <div className="small text-secondary mb-2">{product.brand}</div>}
        <div className="mb-2">
          <StockBadge product={product} />
        </div>
        <div className="mt-auto">
          <PriceTag product={product} />
          <div className="d-flex gap-2 mt-3">
            <Link
              to={`/productos/${product.id}`}
              className="btn btn-outline-primary btn-sm flex-fill"
              aria-label={`Ver detalles de ${product.name}`}
            >
              Detalles
            </Link>
            <Button
              variant="primary"
              size="sm"
              className="flex-fill"
              disabled={agotado}
              onClick={() => onAdd(product)}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              {agotado ? 'Agotado' : '+ Agregar'}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}
