// Organismo: grilla de categorías. `counts` = { idCategoria: cantidadDeProductos }.
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import CategoryCard from '../molecules/CategoryCard'
import EmptyState from '../molecules/EmptyState'

export default function CategoryGrid({ categories, counts = {} }) {
  if (categories.length === 0) {
    return <EmptyState icon="🗂️" title="Aún no hay categorías" />
  }
  return (
    <Row className="g-3 row-cols-2 row-cols-md-3 row-cols-lg-5">
      {categories.map((categoria) => (
        <Col key={categoria.id}>
          <CategoryCard category={categoria} productCount={counts[categoria.id] ?? 0} />
        </Col>
      ))}
    </Row>
  )
}
