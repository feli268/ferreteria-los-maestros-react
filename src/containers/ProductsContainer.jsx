// Contenedor: catálogo con filtros. Sirve tres rutas según `mode`:
//   all (/productos), category (/categorias/:slug) y offers (/ofertas).
// Los filtros se guardan también en la URL (?q=&categoria=&oferta=1...) para poder compartir la búsqueda.
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import NotFoundPage from '../components/pages/NotFoundPage'
import ProductsPage from '../components/pages/ProductsPage'
import { useAddToCart } from '../hooks/useAddToCart'
import { useCategories, useProducts } from '../hooks/useRepository'
import { filterProducts } from '../utils/filters'

function readFilters(params) {
  return {
    query: params.get('q') ?? '',
    categoryId: params.get('categoria') ?? '',
    onlyOffers: params.get('oferta') === '1',
    onlyAvailable: params.get('disp') === '1',
    minPrice: params.get('min') ?? '',
    maxPrice: params.get('max') ?? '',
    sort: params.get('orden') ?? 'relevancia',
  }
}

function writeParams(filters) {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.categoryId) params.set('categoria', filters.categoryId)
  if (filters.onlyOffers) params.set('oferta', '1')
  if (filters.onlyAvailable) params.set('disp', '1')
  if (filters.minPrice !== '') params.set('min', filters.minPrice)
  if (filters.maxPrice !== '') params.set('max', filters.maxPrice)
  if (filters.sort && filters.sort !== 'relevancia') params.set('orden', filters.sort)
  return params
}

export default function ProductsContainer({ mode = 'all' }) {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const products = useProducts()
  const categories = useCategories()
  const addToCart = useAddToCart()
  const paramsText = params.toString()

  // Los filtros viven en estado local (escribir nunca se "traba") y se reflejan en la URL.
  const [filters, setFilters] = useState(() => readFilters(params))

  useEffect(() => {
    // URL -> estado: cuando se navega desde fuera (por ejemplo, el buscador de la cabecera).
    if (paramsText !== writeParams(filters).toString()) setFilters(readFilters(params))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsText])

  useEffect(() => {
    // estado -> URL
    const siguiente = writeParams(filters)
    if (siguiente.toString() !== paramsText) setParams(siguiente, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const category = mode === 'category' ? categories.find((c) => c.id === slug) : null
  if (mode === 'category' && !category) {
    return <NotFoundPage title="Categoría no encontrada" message="Esa categoría no existe o fue eliminada." />
  }

  // En las rutas de categoría y ofertas, ese filtro queda fijo.
  const activos = {
    ...filters,
    categoryId: mode === 'category' ? slug : filters.categoryId,
    onlyOffers: mode === 'offers' ? true : filters.onlyOffers,
  }

  const titulo = mode === 'category' ? category.name : mode === 'offers' ? 'Ofertas' : 'Productos'
  const subtitulo =
    mode === 'category'
      ? category.description
      : mode === 'offers'
        ? 'Productos con descuento vigente.'
        : 'Busca por nombre, marca o código y filtra por precio, categoría u ofertas.'

  return (
    <ProductsPage
      title={titulo}
      subtitle={subtitulo}
      filters={activos}
      categories={categories}
      products={filterProducts(products, activos)}
      hideCategory={mode === 'category'}
      onFilterChange={(cambio) => setFilters((actuales) => ({ ...actuales, ...cambio }))}
      onReset={() => setFilters(readFilters(new URLSearchParams()))}
      onAdd={addToCart}
    />
  )
}
