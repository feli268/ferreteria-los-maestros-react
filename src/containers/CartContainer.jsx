// Contenedor: carrito de compras.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CartPage from '../components/pages/CartPage'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useProducts } from '../hooks/useRepository'

export default function CartContainer() {
  const cart = useCart()
  const products = useProducts()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [confirmClear, setConfirmClear] = useState(false)

  const stockById = Object.fromEntries(products.map((p) => [p.id, p.stock]))

  return (
    <CartPage
      lines={cart.lines}
      stockById={stockById}
      totals={cart.totals}
      couponCode={cart.couponCode}
      couponPercent={cart.couponPercent}
      confirmClear={confirmClear}
      onQuantityChange={cart.setQuantity}
      onRemove={(id) => {
        cart.removeItem(id)
        notify('Producto quitado del carrito.', 'info')
      }}
      onApplyCoupon={(codigo) => {
        const resultado = cart.applyCoupon(codigo)
        if (resultado.ok) notify(resultado.message)
        return resultado
      }}
      onRemoveCoupon={() => {
        cart.removeCoupon()
        notify('Cupón quitado.', 'info')
      }}
      onAskClear={() => setConfirmClear(true)}
      onCancelClear={() => setConfirmClear(false)}
      onConfirmClear={() => {
        cart.clear()
        setConfirmClear(false)
        notify('Carrito vaciado.', 'info')
      }}
      onCheckout={() => navigate('/checkout')}
    />
  )
}
