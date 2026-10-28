// Página: listado de categorías.
import { Link } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import Icon from '../atoms/Icon'
import ConfirmModal from '../molecules/ConfirmModal'
import PageHeader from '../molecules/PageHeader'
import DataTable from '../organisms/DataTable'

export default function AdminCategoriesPage({ categories, counts, pendingDelete, onAskDelete, onCancelDelete, onConfirmDelete }) {
  const columns = [
    { key: 'icon', header: '', render: (c) => <Icon symbol={c.icon} /> },
    { key: 'name', header: 'Nombre' },
    { key: 'description', header: 'Descripción' },
    { key: 'count', header: 'Productos', align: 'end', render: (c) => counts[c.id] ?? 0 },
    {
      key: 'actions',
      header: 'Acciones',
      render: (c) => (
        <div className="d-flex gap-1">
          <Link to={`/admin/categorias/${c.id}/editar`} className="btn btn-outline-primary btn-sm" aria-label={`Editar ${c.name}`}>
            Editar
          </Link>
          <ActionButton variant="outline-danger" size="sm" aria-label={`Eliminar ${c.name}`} onClick={() => onAskDelete(c)}>
            Eliminar
          </ActionButton>
        </div>
      ),
    },
  ]
  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Agrupan los productos de la tienda."
        actions={<Link to="/admin/categorias/nueva" className="btn btn-primary">+ Nueva categoría</Link>}
      />
      <DataTable caption="Categorías" columns={columns} rows={categories} emptyMessage="Aún no hay categorías." />
      <ConfirmModal
        show={!!pendingDelete}
        title="Eliminar categoría"
        message={pendingDelete ? `¿Eliminar la categoría "${pendingDelete.name}"?` : ''}
        confirmLabel="Sí, eliminar"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}
