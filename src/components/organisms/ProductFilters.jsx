// Organismo: filtros del catálogo (texto, categoría, precio, ofertas, disponibilidad y orden).
// Es controlado: el estado vive en el contenedor y llega por `filters`.
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { SORT_OPTIONS } from '../../utils/filters'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'

export default function ProductFilters({ filters, categories, onChange, onReset, resultCount, hideCategory = false }) {
  return (
    <Card body className="mb-4 lm-filters" as="form" role="search" aria-label="Filtrar productos" onSubmit={(e) => e.preventDefault()}>
      <Row className="g-2 align-items-end">
        <Col xs={12} md={hideCategory ? 6 : 4}>
          <FormField
            id="filtro-texto"
            label="Buscar"
            type="search"
            placeholder="Nombre, marca o código"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
          />
        </Col>
        {!hideCategory && (
          <Col xs={12} sm={6} md={4}>
            <FormField
              id="filtro-categoria"
              label="Categoría"
              as="select"
              placeholder="Todas"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={filters.categoryId}
              onChange={(e) => onChange({ categoryId: e.target.value })}
            />
          </Col>
        )}
        <Col xs={12} sm={hideCategory ? 12 : 6} md={hideCategory ? 6 : 4}>
          <FormField
            id="filtro-orden"
            label="Ordenar por"
            as="select"
            placeholder="Relevancia"
            options={SORT_OPTIONS.filter((o) => o.value !== 'relevancia')}
            value={filters.sort === 'relevancia' ? '' : filters.sort}
            onChange={(e) => onChange({ sort: e.target.value || 'relevancia' })}
          />
        </Col>
        <Col xs={6} md={3}>
          <FormField
            id="filtro-min"
            label="Precio mínimo"
            type="number"
            min="0"
            placeholder="$0"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
        </Col>
        <Col xs={6} md={3}>
          <FormField
            id="filtro-max"
            label="Precio máximo"
            type="number"
            min="0"
            placeholder="Sin tope"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </Col>
        <Col xs={12} md={6} className="mb-3 d-flex flex-wrap gap-3 align-items-center">
          <Form.Check
            type="switch"
            id="filtro-ofertas"
            label="Solo ofertas"
            checked={filters.onlyOffers}
            onChange={(e) => onChange({ onlyOffers: e.target.checked })}
          />
          <Form.Check
            type="switch"
            id="filtro-disponibles"
            label="Solo disponibles"
            checked={filters.onlyAvailable}
            onChange={(e) => onChange({ onlyAvailable: e.target.checked })}
          />
        </Col>
      </Row>
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-secondary small" role="status" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'producto encontrado' : 'productos encontrados'}
        </span>
        <ActionButton variant="outline-secondary" size="sm" onClick={onReset}>
          Limpiar filtros
        </ActionButton>
      </div>
    </Card>
  )
}
