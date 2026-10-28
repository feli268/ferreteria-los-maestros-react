// Página: inventario de productos (todos o solo con stock crítico).
import Badge from 'react-bootstrap/Badge'
import { Link } from 'react-router-dom'
import { formatCLP } from '../../utils/format'
import { getEffectivePrice } from '../../utils/pricing'
import ActionButton from '../atoms/ActionButton'
import StockBadge from '../atoms/StockBadge'
import ConfirmModal from '../molecules/ConfirmModal'
import FormField from '../molecules/FormField'
import PageHeader from '../molecules/PageHeader'
import DataTable from '../organisms/DataTable'

export default function AdminProductsPage({
  title = 'Productos',
  subtitle,
  products,
  categories,
  query,
  onQueryChange,
  canCreate = true,
  pendingDelete,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const nombreCategoria = (id) => categories.find((c) => c.id === id)?.name ?? '—'
  const columns = [
    { key: 'id', header: 'Código' },
    { key: 'name', header: 'Nombre' },
    { key: 'category', header: 'Categoría', render: (p) => nombreCategoria(p.categoryId) },
    {
      key: 'price',
      header: 'Precio',
      align: 'end',
      render: (p) => (
        <>
          {formatCLP(getEffectivePrice(p))}
          {p.discountPercent > 0 && <Badge bg="danger" className="ms-1">-{p.discountPercent}%</Badge>}
        </>
      ),
    },
    { key: 'stock', header: 'Stock', render: (p) => <StockBadge product={p} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (p) => (
        <div className="d-flex gap-1">
          <Link to={`/admin/productos/${p.id}/editar`} className="btn btn-outline-primary btn-sm" aria-label={`Editar ${p.name}`}>
            Editar
          </Link>
          <ActionButton variant="outline-danger" size="sm" aria-label={`Eliminar ${p.name}`} onClick={() => onAskDelete(p)}>
            Eliminar
          </ActionButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {canCreate && <Link to="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>}
            <Link to="/admin/productos/criticos" className="btn btn-outline-warning">⚠️ Stock crítico</Link>
            <Link to="/admin/productos/reportes" className="btn btn-outline-secondary">📋 Reporte</Link>
          </>
        }
      />
      <div style={{ maxWidth: 420 }}>
        <FormField id="producto-buscar" label="Buscar producto" type="search" placeholder="Código, nombre o marca"
          value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <DataTable caption={title} columns={columns} rows={products} emptyMessage="No hay productos que mostrar." />
      <ConfirmModal
        show={!!pendingDelete}
        title="Eliminar producto"
        message={pendingDelete ? `¿Eliminar "${pendingDelete.name}"? Las órdenes anteriores conservarán su detalle.` : ''}
        confirmLabel="Sí, eliminar"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}
