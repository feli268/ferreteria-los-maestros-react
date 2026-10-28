// Devuelve una función para agregar un producto al carrito y avisar con un toast.
import { useCallback } from 'react'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

export function useAddToCart() {
  const { addItem } = useCart()
  const { notify } = useToast()

  return useCallback(
    (product, quantity = 1) => {
      const resultado = addItem(product.id, quantity)
      notify(resultado.message, !resultado.ok ? 'danger' : resultado.limited ? 'warning' : 'success')
      return resultado
    },
    [addItem, notify],
  )
}
