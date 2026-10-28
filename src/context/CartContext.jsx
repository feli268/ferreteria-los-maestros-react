// Carrito de compras: ítems {id, qty} + cupón, guardados en localStorage.
// Los precios y el stock se leen siempre de la base de datos simulada, así si
// el administrador cambia un precio, el carrito se actualiza en tiempo real.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '../data/storage'
import { useProducts } from '../hooks/useRepository'
import { buildOrderLines, summarizeCart } from '../services/orderService'
import { findCouponPercent, isOutOfStock } from '../utils/pricing'

const CART_KEY = 'cart'
const CartContext = createContext(null)

function cargarCarrito() {
  const guardado = storage.get(CART_KEY)
  const items = Array.isArray(guardado?.items)
    ? guardado.items.filter((i) => i && i.id && Number(i.qty) > 0)
    : []
  return { items, coupon: typeof guardado?.coupon === 'string' ? guardado.coupon : '' }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(cargarCarrito)
  const cartRef = useRef(cart) // siempre el último valor, aunque haya varias acciones seguidas
  const products = useProducts() // se vuelve a calcular si cambian precios o stock

  const commit = useCallback((siguiente) => {
    cartRef.current = siguiente
    setCart(siguiente)
  }, [])

  useEffect(() => {
    storage.set(CART_KEY, cart)
  }, [cart])

  const stockDe = useCallback((id) => products.find((p) => p.id === id)?.stock ?? 0, [products])

  /** Agrega unidades. Nunca supera el stock disponible. */
  const addItem = useCallback(
    (id, qty = 1) => {
      const producto = products.find((p) => p.id === id)
      if (!producto) return { ok: false, message: 'El producto ya no existe.' }
      if (isOutOfStock(producto)) return { ok: false, message: `"${producto.name}" está agotado.` }

      const actual = cartRef.current
      const existente = actual.items.find((i) => i.id === id)
      const deseado = (existente?.qty ?? 0) + qty
      const final = Math.min(deseado, producto.stock)
      const items = existente
        ? actual.items.map((i) => (i.id === id ? { ...i, qty: final } : i))
        : [...actual.items, { id, qty: final }]
      commit({ ...actual, items })

      return final < deseado
        ? { ok: true, limited: true, message: `Solo hay ${producto.stock} unidades de "${producto.name}".` }
        : { ok: true, message: `"${producto.name}" se agregó al carrito.` }
    },
    [products, commit],
  )

  /** Fija la cantidad (entre 1 y el stock). 0 o menos elimina el ítem. */
  const setQuantity = useCallback(
    (id, qty) => {
      const numero = Math.floor(Number(qty))
      const actual = cartRef.current
      if (!(numero > 0)) {
        commit({ ...actual, items: actual.items.filter((i) => i.id !== id) })
        return
      }
      const tope = Math.max(1, stockDe(id))
      commit({
        ...actual,
        items: actual.items.map((i) => (i.id === id ? { ...i, qty: Math.min(numero, tope) } : i)),
      })
    },
    [stockDe, commit],
  )

  const removeItem = useCallback(
    (id) => {
      const actual = cartRef.current
      commit({ ...actual, items: actual.items.filter((i) => i.id !== id) })
    },
    [commit],
  )

  const clear = useCallback(() => commit({ items: [], coupon: '' }), [commit])

  const applyCoupon = useCallback(
    (code) => {
      const percent = findCouponPercent(code)
      if (percent === 0) return { ok: false, message: 'El cupón ingresado no es válido.' }
      const normalizado = String(code).trim().toUpperCase()
      commit({ ...cartRef.current, coupon: normalizado })
      return { ok: true, percent, message: `Cupón ${normalizado} aplicado: ${percent}% de descuento.` }
    },
    [commit],
  )

  const removeCoupon = useCallback(() => commit({ ...cartRef.current, coupon: '' }), [commit])

  const value = useMemo(() => {
    // Los ítems cuyo producto ya no existe se ignoran; la cantidad se ajusta al stock actual.
    const items = cart.items
      .map((i) => ({ id: i.id, qty: Math.min(i.qty, Math.max(stockDe(i.id), 0)) }))
      .filter((i) => i.qty > 0)
    const lines = buildOrderLines(items)
    const { totals, couponPercent } = summarizeCart(items, { couponCode: cart.coupon })
    return {
      items,
      lines,
      count: items.reduce((suma, i) => suma + i.qty, 0),
      couponCode: couponPercent > 0 ? cart.coupon : '',
      couponPercent,
      totals,
      addItem,
      setQuantity,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
    }
    // `products` se incluye para recalcular precios cuando cambia la base de datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, products, stockDe, addItem, setQuantity, removeItem, clear, applyCoupon, removeCoupon])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const contexto = useContext(CartContext)
  if (!contexto) throw new Error('useCart debe usarse dentro de <CartProvider>.')
  return contexto
}
