// Contenedor: listado de categorías con su cantidad de productos.
import CategoriesPage from '../components/pages/CategoriesPage'
import { useCategories, useProducts } from '../hooks/useRepository'

export default function CategoriesContainer() {
  const categories = useCategories()
  const products = useProducts()
  const counts = {}
  products.forEach((p) => {
    counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
  })
  return <CategoriesPage categories={categories} counts={counts} />
}
