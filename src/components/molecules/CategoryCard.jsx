// Molécula: tarjeta de categoría (enlaza a su listado de productos).
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon'

export default function CategoryCard({ category, productCount = 0 }) {
  return (
    <Card as={Link} to={`/categorias/${category.id}`} className="h-100 text-center text-decoration-none lm-category-card">
      <Card.Body>
        <Icon symbol={category.icon} size="2.75rem" />
        <Card.Title as="h3" className="fs-6 fw-semibold mt-2 mb-1">
          {category.name}
        </Card.Title>
        <Card.Text className="small text-secondary mb-2 d-none d-sm-block">{category.description}</Card.Text>
        <span className="small fw-semibold text-primary">
          {productCount} {productCount === 1 ? 'producto' : 'productos'}
        </span>
      </Card.Body>
    </Card>
  )
}
