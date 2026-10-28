// Página: portada de la tienda.
import { Link } from 'react-router-dom'
import CategoryGrid from '../organisms/CategoryGrid'
import HeroCarousel from '../organisms/HeroCarousel'
import ProductGrid from '../organisms/ProductGrid'

export default function HomePage({ slides, categories, counts, offers, featured, onAdd }) {
  return (
    <>
      <HeroCarousel slides={slides} />

      <section className="mt-5" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="h3 mb-3">Compra por categoría</h2>
        <CategoryGrid categories={categories} counts={counts} />
      </section>

      {offers.length > 0 && (
        <section className="mt-5" aria-labelledby="titulo-ofertas">
          <div className="d-flex justify-content-between align-items-end mb-3">
            <h2 id="titulo-ofertas" className="h3 mb-0">Ofertas</h2>
            <Link to="/ofertas">Ver todas las ofertas →</Link>
          </div>
          <ProductGrid products={offers} categories={categories} onAdd={onAdd} />
        </section>
      )}

      <section className="mt-5" aria-labelledby="titulo-destacados">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h2 id="titulo-destacados" className="h3 mb-0">Productos destacados</h2>
          <Link to="/productos">Ver catálogo completo →</Link>
        </div>
        <ProductGrid products={featured} categories={categories} onAdd={onAdd} />
      </section>
    </>
  )
}
