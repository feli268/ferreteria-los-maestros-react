// Organismo: ficha de un producto (imagen, datos, stock, cantidad y botón de compra).
import Badge from 'react-bootstrap/Badge'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import { isOutOfStock } from '../../utils/pricing'
import ActionButton from '../atoms/ActionButton'
import Icon from '../atoms/Icon'
import OfferBadge from '../atoms/OfferBadge'
import PriceTag from '../atoms/PriceTag'
import StockBadge from '../atoms/StockBadge'
import QuantityControl from '../molecules/QuantityControl'

export default function ProductDetailView({ product, category, quantity, onQuantityChange, onAdd }) {
  const agotado = isOutOfStock(product)
  return (
    <Row className="g-4">
      <Col xs={12} md={5}>
        <div className="lm-detail-img position-relative">
          <Icon symbol={product.icon} size="8rem" />
          <span className="position-absolute top-0 end-0 m-3 fs-5">
            <OfferBadge percent={product.discountPercent} />
          </span>
        </div>
      </Col>
      <Col xs={12} md={7}>
        {category && (
          <Link to={`/categorias/${category.id}`} className="text-uppercase small fw-semibold text-decoration-none">
            {category.name}
          </Link>
        )}
        <h1 className="h2 mt-1">{product.name}</h1>
        <p className="text-secondary mb-2">
          {product.brand && <>Marca: {product.brand} · </>}
          Código: <Badge bg="secondary">{product.id}</Badge>
        </p>
        <div className="mb-2">
          <PriceTag product={product} size="lg" />
          <span className="small text-secondary">IVA incluido</span>
        </div>
        <div className="mb-3">
          <StockBadge product={product} />
        </div>
        <p>{product.description}</p>

        {agotado ? (
          <p className="text-danger fw-semibold" role="status">
            Este producto está agotado por ahora.
          </p>
        ) : (
          <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
            <QuantityControl value={quantity} onChange={onQuantityChange} max={product.stock} />
            <ActionButton size="lg" onClick={onAdd}>
              🛒 Agregar al carrito
            </ActionButton>
          </div>
        )}
        <Link to="/productos" className="btn btn-outline-secondary btn-sm">
          ← Volver al catálogo
        </Link>
      </Col>
    </Row>
  )
}
