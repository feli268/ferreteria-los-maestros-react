// Página: reporte de inventario por categoría.
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import { formatCLP } from '../../utils/format'
import PageHeader from '../molecules/PageHeader'
import StatCard from '../molecules/StatCard'
import DataTable from '../organisms/DataTable'

export default function AdminInventoryReportPage({ report }) {
  return (
    <>
      <PageHeader
        title="Reporte de inventario"
        subtitle="Existencias y valor del inventario (precio de lista, IVA incluido)."
        actions={<Link to="/admin/productos" className="btn btn-outline-secondary">← Volver a productos</Link>}
      />
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}><StatCard icon="📦" label="Productos" value={report.totalProducts} /></Col>
        <Col xs={6} lg={3}><StatCard icon="🧮" label="Unidades en stock" value={report.totalUnits} tone="success" /></Col>
        <Col xs={6} lg={3}><StatCard icon="💵" label="Valor del inventario" value={formatCLP(report.totalValue)} tone="warning" /></Col>
        <Col xs={6} lg={3}><StatCard icon="⚠️" label="Stock crítico" value={report.criticalProducts} to="/admin/productos/criticos" tone="danger" /></Col>
      </Row>
      <DataTable
        caption="Inventario por categoría"
        rowKey="categoryId"
        rows={report.byCategory}
        columns={[
          { key: 'name', header: 'Categoría' },
          { key: 'products', header: 'Productos', align: 'end' },
          { key: 'units', header: 'Unidades', align: 'end' },
          { key: 'value', header: 'Valor', align: 'end', render: (r) => formatCLP(r.value) },
          { key: 'critical', header: 'Críticos', align: 'end' },
        ]}
      />
    </>
  )
}
