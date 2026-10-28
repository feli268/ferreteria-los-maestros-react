// Página: listado de usuarios.
import Badge from 'react-bootstrap/Badge'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import { roleOptions } from '../../data/catalogs'
import { formatRun } from '../../utils/format'
import ActionButton from '../atoms/ActionButton'
import ConfirmModal from '../molecules/ConfirmModal'
import FormField from '../molecules/FormField'
import PageHeader from '../molecules/PageHeader'
import DataTable from '../organisms/DataTable'

const ROLE_COLOR = { Administrador: 'dark', Vendedor: 'primary', Cliente: 'secondary' }

export default function AdminUsersPage({ users, filters, onFilterChange, pendingDelete, onAskDelete, onCancelDelete, onConfirmDelete }) {
  const columns = [
    { key: 'run', header: 'RUN', render: (u) => formatRun(u.run) },
    { key: 'name', header: 'Nombre', render: (u) => `${u.name} ${u.lastname}` },
    { key: 'email', header: 'Correo' },
    { key: 'role', header: 'Rol', render: (u) => <Badge bg={ROLE_COLOR[u.role] ?? 'secondary'}>{u.role}</Badge> },
    { key: 'comuna', header: 'Comuna' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (u) => (
        <div className="d-flex flex-wrap gap-1">
          <Link to={`/admin/usuarios/${u.run}`} className="btn btn-outline-secondary btn-sm" aria-label={`Ver ${u.name} ${u.lastname}`}>Ver</Link>
          <Link to={`/admin/usuarios/${u.run}/editar`} className="btn btn-outline-primary btn-sm" aria-label={`Editar ${u.name} ${u.lastname}`}>Editar</Link>
          <ActionButton variant="outline-danger" size="sm" aria-label={`Eliminar ${u.name} ${u.lastname}`} onClick={() => onAskDelete(u)}>
            Eliminar
          </ActionButton>
        </div>
      ),
    },
  ]
  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administra cuentas y roles."
        actions={<Link to="/admin/usuarios/nuevo" className="btn btn-primary">+ Nuevo usuario</Link>}
      />
      <Row className="g-2">
        <Col xs={12} md={6} lg={4}>
          <FormField id="usuario-buscar" type="search" label="Buscar" placeholder="Nombre, correo o RUN" value={filters.query}
            onChange={(e) => onFilterChange({ query: e.target.value })} />
        </Col>
        <Col xs={12} md={4} lg={3}>
          <FormField id="usuario-rol" as="select" label="Rol" placeholder="Todos" options={roleOptions.map((r) => ({ value: r.value, label: r.value }))}
            value={filters.role} onChange={(e) => onFilterChange({ role: e.target.value })} />
        </Col>
      </Row>
      <DataTable caption="Usuarios" columns={columns} rows={users} rowKey="run" emptyMessage="No hay usuarios que coincidan." />
      <ConfirmModal
        show={!!pendingDelete}
        title="Eliminar usuario"
        message={pendingDelete ? `¿Eliminar a ${pendingDelete.name} ${pendingDelete.lastname}?` : ''}
        confirmLabel="Sí, eliminar"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}
