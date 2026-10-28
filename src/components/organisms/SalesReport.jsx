// Organismo: reporte de ventas (cifras generales + ventas por producto y por categoría).
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { formatCLP } from '../../utils/format'
import StatCard from '../molecules/StatCard'
import DataTable from './DataTable'

export default function SalesReport({ summary, byProduct, byCategory }) {
  return (
    <>
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}><StatCard icon="💰" label="Ingresos (pagados)" value={formatCLP(summary.revenue)} tone="success" /></Col>
        <Col xs={6} lg={3}><StatCard icon="🧾" label="Pedidos pagados" value={summary.paidOrders} /></Col>
        <Col xs={6} lg={3}><StatCard icon="⛔" label="Pedidos rechazados" value={summary.rejectedOrders} tone="danger" /></Col>
        <Col xs={6} lg={3}><StatCard icon="🎟️" label="Ticket promedio" value={formatCLP(summary.averageTicket)} tone="warning" /></Col>
      </Row>
      <Row className="g-4">
        <Col xs={12} xl={7}>
          <h2 className="h5">Ventas por producto</h2>
          <DataTable
            caption="Ventas por producto"
            rowKey="productId"
            rows={byProduct}
            emptyMessage="Aún no hay ventas."
            columns={[
              { key: 'name', header: 'Producto' },
              { key: 'units', header: 'Unidades', align: 'end' },
              { key: 'revenue', header: 'Ingresos', align: 'end', render: (r) => formatCLP(r.revenue) },
            ]}
          />
        </Col>
        <Col xs={12} xl={5}>
          <h2 className="h5">Ventas por categoría</h2>
          <DataTable
            caption="Ventas por categoría"
            rowKey="categoryId"
            rows={byCategory}
            columns={[
              { key: 'name', header: 'Categoría' },
              { key: 'units', header: 'Unidades', align: 'end' },
              { key: 'revenue', header: 'Ingresos', align: 'end', render: (r) => formatCLP(r.revenue) },
            ]}
          />
        </Col>
      </Row>
    </>
  )
}
