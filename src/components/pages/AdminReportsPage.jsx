// Página: reporte de ventas con filtro por fechas.
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'
import PageHeader from '../molecules/PageHeader'
import SalesReport from '../organisms/SalesReport'

export default function AdminReportsPage({ filters, onFilterChange, onReset, summary, byProduct, byCategory }) {
  return (
    <>
      <PageHeader title="Reporte de ventas" subtitle="Solo se consideran los pedidos pagados en los ingresos." />
      <Row className="g-2 align-items-end">
        <Col xs={6} md={3}>
          <FormField id="reporte-desde" type="date" label="Desde" value={filters.from} onChange={(e) => onFilterChange({ from: e.target.value })} />
        </Col>
        <Col xs={6} md={3}>
          <FormField id="reporte-hasta" type="date" label="Hasta" value={filters.to} onChange={(e) => onFilterChange({ to: e.target.value })} />
        </Col>
        <Col xs={12} md={2} className="mb-3">
          <ActionButton variant="outline-secondary" className="w-100" onClick={onReset}>Limpiar</ActionButton>
        </Col>
      </Row>
      <SalesReport summary={summary} byProduct={byProduct} byCategory={byCategory} />
    </>
  )
}
