// Página: detalle de un producto del inventario (solo lectura). Lo pueden ver Administrador y Vendedor.
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import { formatCLP } from '../../utils/format'
import { getEffectivePrice } from '../../utils/pricing'
import StockBadge from '../atoms/StockBadge'
import PageHeader from '../molecules/PageHeader'

export default function AdminProductDetailPage({ product, categoryName, canManage = false }) {
  return (
    <>
      <PageHeader
        title={`${product.icon} ${product.name}`}
        subtitle={`Código ${product.id} · ${categoryName}`}
        actions={
          <>
            {canManage && (
              <Link to={`/admin/productos/${product.id}/editar`} className="btn btn-primary">
                Editar
              </Link>
            )}
            <Link to="/admin/productos" className="btn btn-outline-secondary">← Volver a productos</Link>
          </>
        }
      />
      <Card body className="mb-4">
        <dl className="row mb-0">
          <dt className="col-sm-3">Categoría</dt><dd className="col-sm-9">{categoryName}</dd>
          <dt className="col-sm-3">Subcategoría</dt><dd className="col-sm-9">{product.subcategory || '—'}</dd>
          <dt className="col-sm-3">Marca</dt><dd className="col-sm-9">{product.brand || '—'}</dd>
          <dt className="col-sm-3">Precio</dt>
          <dd className="col-sm-9">
            {formatCLP(getEffectivePrice(product))}
            {product.discountPercent > 0 && (
              <>
                {' '}
                <Badge bg="danger">-{product.discountPercent}%</Badge>{' '}
                <span className="text-secondary text-decoration-line-through">{formatCLP(product.price)}</span>
              </>
            )}
          </dd>
          <dt className="col-sm-3">Stock</dt>
          <dd className="col-sm-9">
            <StockBadge product={product} />
          </dd>
          <dt className="col-sm-3">Stock crítico</dt><dd className="col-sm-9">{product.criticalStock} unidades</dd>
          <dt className="col-sm-3">Descripción</dt><dd className="col-sm-9">{product.description || '—'}</dd>
        </dl>
      </Card>
    </>
  )
}
