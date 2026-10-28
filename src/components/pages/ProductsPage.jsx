// Página: listado de productos con filtros (catálogo, categoría u ofertas).
import { Link } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import PageHeader from '../molecules/PageHeader'
import ProductFilters from '../organisms/ProductFilters'
import ProductGrid from '../organisms/ProductGrid'

export default function ProductsPage({
  title,
  subtitle,
  filters,
  categories,
  products,
  onFilterChange,
  onReset,
  onAdd,
  hideCategory = false,
}) {
  return (
    <>
      <nav aria-label="Ruta de navegación" className="small mb-2">
        <Link to="/">Inicio</Link> / <span aria-current="page">{title}</span>
      </nav>
      <PageHeader title={title} subtitle={subtitle} />
      <ProductFilters
        filters={filters}
        categories={categories}
        onChange={onFilterChange}
        onReset={onReset}
        resultCount={products.length}
        hideCategory={hideCategory}
      />
      <ProductGrid
        products={products}
        categories={categories}
        onAdd={onAdd}
        emptyAction={
          <ActionButton variant="outline-primary" onClick={onReset}>
            Limpiar filtros
          </ActionButton>
        }
      />
    </>
  )
}
