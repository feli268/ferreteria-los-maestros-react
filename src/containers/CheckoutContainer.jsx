// Contenedor: pago. Valida, cobra con la pasarela simulada y navega al resultado.
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import CheckoutPage from '../components/pages/CheckoutPage'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useForm } from '../hooks/useForm'
import { orderService, ORDER_STATUS, summarizeCart } from '../services/orderService'

export default function CheckoutContainer() {
  const { user } = useAuth()
  const cart = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const finished = useRef(false) // evita redirigir al carrito justo después de pagar

  // Si hay sesión, el formulario parte con los datos del usuario.
  const form = useForm({
    name: user?.name ?? '',
    lastname: user?.lastname ?? '',
    email: user?.email ?? '',
    street: user?.address ?? '',
    apartment: '',
    region: user?.region ?? '',
    comuna: user?.comuna ?? '',
    notes: '',
    deliveryId: 'despacho',
    paymentMethod: 'tarjeta',
  })

  if (cart.items.length === 0 && !finished.current) {
    return <Navigate to="/carrito" replace />
  }

  const resumen = summarizeCart(cart.items, {
    couponCode: cart.couponCode,
    deliveryId: form.values.deliveryId,
  })

  const enviar = async (evento) => {
    evento.preventDefault()
    form.setFormError('')
    setSubmitting(true)
    try {
      const resultado = await orderService.placeOrder({
        form: form.values,
        cartItems: cart.items,
        couponCode: cart.couponCode,
        userRun: user?.run ?? null,
      })
      if (!resultado.ok) {
        form.setErrors(resultado.errors)
        form.setFormError(resultado.errors.cart ?? 'Revisa los campos marcados en rojo.')
        return
      }
      const { order } = resultado
      finished.current = true
      if (order.status === ORDER_STATUS.PAID) {
        cart.clear()
        notify(`Pago aprobado. Pedido N° ${order.number}.`)
        navigate(`/compra-exitosa/${order.number}`)
      } else {
        notify('No se pudo realizar el pago.', 'danger')
        navigate(`/compra-fallida/${order.number}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CheckoutPage
      lines={resumen.lines}
      totals={resumen.totals}
      couponCode={cart.couponCode}
      couponPercent={resumen.couponPercent}
      values={form.values}
      errors={form.errors}
      formError={form.formError}
      submitting={submitting}
      onChange={form.setValue}
      onSubmit={enviar}
    />
  )
}
