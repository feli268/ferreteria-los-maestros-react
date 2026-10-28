// Contenedor: ficha de producto.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import NotFoundPage from '../components/pages/NotFoundPage'
import ProductDetailPage from '../components/pages/ProductDetailPage'
import { useAddToCart } from '../hooks/useAddToCart'
import { useCategories, useProducts } from '../hooks/useRepository'

export default function ProductDetailContainer() {
  const { id } = useParams()
  const products = useProducts()
  const categories = useCategories()
  const addToCart = useAddToCart()
  const [quantity, setQuantity] = useState(1)

  useEffect(() => setQuantity(1), [id])

  const product = products.find((p) => p.id === id)
  if (!product) {
    return <NotFoundPage title="Producto no encontrado" message="Este producto no existe o ya no está a la venta." />
  }

  const maximo = Math.max(product.stock, 1)
  return (
    <ProductDetailPage
      product={product}
      category={categories.find((c) => c.id === product.categoryId)}
      categories={categories}
      related={products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)}
      quantity={Math.min(quantity, maximo)}
      onQuantityChange={setQuantity}
      onAdd={() => addToCart(product, Math.min(quantity, maximo))}
      onAddRelated={addToCart}
    />
  )
}
