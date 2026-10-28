// Página: ficha de un usuario con su historial de compras.
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import { formatCLP, formatDate, formatRun } from '../../utils/format'
import PageHeader from '../molecules/PageHeader'
import DataTable from '../organisms/DataTable'

export default function AdminUserDetailPage({ user, history }) {
  return (
    <>
      <PageHeader
        title={`${user.name} ${user.lastname}`}
        subtitle={`RUN ${formatRun(user.run)} · ${user.role}`}
        actions={
          <>
            <Link to={`/admin/usuarios/${user.run}/editar`} className="btn btn-primary">Editar</Link>
            <Link to="/admin/usuarios" className="btn btn-outline-secondary">← Volver a usuarios</Link>
          </>
        }
      />
      <Card body className="mb-4">
        <dl className="row mb-0">
          <dt className="col-sm-3">Correo</dt><dd className="col-sm-9">{user.email}</dd>
          <dt className="col-sm-3">Dirección</dt><dd className="col-sm-9">{user.address}, {user.comuna}, {user.region}</dd>
        </dl>
      </Card>
      <h2 className="h5">Historial de compras</h2>
      <DataTable
        caption="Historial de compras"
        rowKey="number"
        rows={history}
        emptyMessage="Este usuario aún no registra compras."
        columns={[
          { key: 'number', header: 'N° orden', render: (o) => <Link to={`/admin/ordenes/${o.number}`}>{o.number}</Link> },
          { key: 'createdAt', header: 'Fecha', render: (o) => formatDate(o.createdAt) },
          { key: 'items', header: 'Productos', render: (o) => o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ') },
          { key: 'total', header: 'Total', align: 'end', render: (o) => formatCLP(o.totals.total) },
          { key: 'status', header: 'Estado', render: (o) => <Badge bg={o.status === 'Pagada' ? 'success' : 'danger'}>{o.status}</Badge> },
        ]}
      />
    </>
  )
}
