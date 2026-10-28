// Átomo: precio final y, si hay oferta, el precio normal tachado.
import { formatCLP } from '../../utils/format'
import { getEffectivePrice, isOnOffer } from '../../utils/pricing'

export default function PriceTag({ product, size = 'md' }) {
  const enOferta = isOnOffer(product)
  const clase = size === 'lg' ? 'fs-3' : size === 'sm' ? 'fs-6' : 'fs-5'
  return (
    <div className="lm-price">
      <span className={`fw-bold ${clase}`} data-testid="precio-final">
        {formatCLP(getEffectivePrice(product))}
      </span>
      {enOferta && (
        <del className="ms-2 text-secondary small" data-testid="precio-original">
          {formatCLP(product.price)}
        </del>
      )}
    </div>
  )
}
