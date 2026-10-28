// Página: listado de órdenes con filtros.
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import { formatCLP, formatDate } from '../../utils/format'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'
import PageHeader from '../molecules/PageHeader'
import DataTable from '../organisms/DataTable'

export const ORDER_COLUMNS = [
  {
    key: 'number',
    header: 'N° orden',
    render: (o) => <Link to={`/admin/ordenes/${o.number}`}>{o.number}</Link>,
  },
  { key: 'createdAt', header: 'Fecha', render: (o) => formatDate(o.createdAt) },
  { key: 'customer', header: 'Cliente', render: (o) => `${o.customer.name} ${o.customer.lastname}` },
  { key: 'delivery', header: 'Entrega', render: (o) => o.delivery.label },
  { key: 'total', header: 'Total', align: 'end', render: (o) => formatCLP(o.totals.total) },
  {
    key: 'status',
    header: 'Estado',
    render: (o) => <Badge bg={o.status === 'Pagada' ? 'success' : 'danger'}>{o.status}</Badge>,
  },
]

export default function AdminOrdersPage({ orders, filters, onFilterChange, onReset }) {
  return (
    <>
      <PageHeader title="Órdenes de compra" subtitle="Revisa y filtra los pedidos de la tienda." />
      <Card body className="mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={4}>
            <FormField id="orden-texto" label="Buscar" placeholder="N° de orden, nombre o correo" value={filters.query}
              onChange={(e) => onFilterChange({ query: e.target.value })} />
          </Col>
          <Col xs={12} sm={4} md={2}>
            <FormField id="orden-estado" as="select" label="Estado" placeholder="Todos"
              options={[{ value: 'Pagada', label: 'Pagada' }, { value: 'Rechazada', label: 'Rechazada' }]}
              value={filters.status} onChange={(e) => onFilterChange({ status: e.target.value })} />
          </Col>
          <Col xs={6} sm={4} md={2}>
            <FormField id="orden-desde" type="date" label="Desde" value={filters.from}
              onChange={(e) => onFilterChange({ from: e.target.value })} />
          </Col>
          <Col xs={6} sm={4} md={2}>
            <FormField id="orden-hasta" type="date" label="Hasta" value={filters.to}
              onChange={(e) => onFilterChange({ to: e.target.value })} />
          </Col>
          <Col xs={12} md={2} className="mb-3">
            <ActionButton variant="outline-secondary" className="w-100" onClick={onReset}>Limpiar</ActionButton>
          </Col>
        </Row>
      </Card>
      <DataTable
        caption="Órdenes de compra"
        columns={ORDER_COLUMNS}
        rows={orders}
        rowKey="number"
        emptyMessage="No hay órdenes que coincidan con los filtros."
      />
    </>
  )
}
