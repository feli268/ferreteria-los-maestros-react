// Organismo: grilla responsive de productos (1 columna en móvil, hasta 4 en escritorio).
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import EmptyState from '../molecules/EmptyState'
import ProductCard from '../molecules/ProductCard'

export default function ProductGrid({
  products,
  categories = [],
  onAdd,
  emptyTitle = 'No encontramos productos',
  emptyMessage = 'Prueba con otra búsqueda o limpia los filtros.',
  emptyAction,
}) {
  if (products.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
  }
  const nombreCategoria = (id) => categories.find((c) => c.id === id)?.name

  return (
    <Row className="g-3" as="ul" aria-label="Productos" style={{ listStyle: 'none', paddingLeft: 0 }}>
      {products.map((producto) => (
        <Col as="li" key={producto.id} xs={12} sm={6} lg={4} xl={3}>
          <ProductCard product={producto} categoryName={nombreCategoria(producto.categoryId)} onAdd={onAdd} />
        </Col>
      ))}
    </Row>
  )
}
