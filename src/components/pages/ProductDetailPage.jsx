// Página: ficha de producto + productos relacionados.
import { Link } from 'react-router-dom'
import ProductDetailView from '../organisms/ProductDetailView'
import ProductGrid from '../organisms/ProductGrid'

export default function ProductDetailPage({ product, category, categories, related, quantity, onQuantityChange, onAdd, onAddRelated }) {
  return (
    <>
      <nav aria-label="Ruta de navegación" className="small mb-3">
        <Link to="/">Inicio</Link> / <Link to="/productos">Productos</Link> / <span aria-current="page">{product.name}</span>
      </nav>
      <ProductDetailView
        product={product}
        category={category}
        quantity={quantity}
        onQuantityChange={onQuantityChange}
        onAdd={onAdd}
      />
      {related.length > 0 && (
        <section className="mt-5" aria-labelledby="titulo-relacionados">
          <h2 id="titulo-relacionados" className="h4 mb-3">También te puede interesar</h2>
          <ProductGrid products={related} categories={categories} onAdd={onAddRelated} />
        </section>
      )}
    </>
  )
}
