// Contenedor: datos de la portada.
import { useMemo } from 'react'
import HomePage from '../components/pages/HomePage'
import { heroSlides } from '../data/content'
import { useAddToCart } from '../hooks/useAddToCart'
import { useCategories, useProducts } from '../hooks/useRepository'
import { isOnOffer } from '../utils/pricing'

export default function HomeContainer() {
  const products = useProducts()
  const categories = useCategories()
  const addToCart = useAddToCart()

  const counts = useMemo(() => {
    const cuenta = {}
    products.forEach((p) => {
      cuenta[p.categoryId] = (cuenta[p.categoryId] ?? 0) + 1
    })
    return cuenta
  }, [products])

  return (
    <HomePage
      slides={heroSlides}
      categories={categories}
      counts={counts}
      offers={products.filter(isOnOffer).slice(0, 4)}
      featured={products.slice(0, 8)}
      onAdd={addToCart}
    />
  )
}
