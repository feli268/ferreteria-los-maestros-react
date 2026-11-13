// Contenedor: resultado de una compra. `expected` = 'success' | 'failed'.
// Si la URL no coincide con el estado real de la orden, redirige a la pantalla correcta.
import { Navigate, useParams } from 'react-router-dom'
import NotFoundPage from '../components/pages/NotFoundPage'
import PurchaseFailedPage from '../components/pages/PurchaseFailedPage'
import PurchaseSuccessPage from '../components/pages/PurchaseSuccessPage'
import { useOrders } from '../hooks/useRepository'
import { ORDER_STATUS, orderService } from '../services/orderService'

export default function PurchaseResultContainer({ expected }) {
  const { orderNumber } = useParams()
  useOrders() // se vuelve a dibujar si cambia la lista de órdenes
  const order = orderService.getByNumber(orderNumber)

  if (!order) {
    return <NotFoundPage title="Pedido no encontrado" message="No existe un pedido con ese número." />
  }

  const pagada = order.status === ORDER_STATUS.PAID
  if (expected === 'success' && !pagada) return <Navigate to={`/compra-fallida/${order.number}`} replace />
  if (expected === 'failed' && pagada) return <Navigate to={`/compra-exitosa/${order.number}`} replace />

  return pagada ? (
    <PurchaseSuccessPage order={order} onPrint={() => window.print()} />
  ) : (
    <PurchaseFailedPage order={order} />
  )
}
