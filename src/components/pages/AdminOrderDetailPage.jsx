// Página: detalle de una orden (boleta).
import { Link } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import PageHeader from '../molecules/PageHeader'
import OrderReceipt from '../organisms/OrderReceipt'

export default function AdminOrderDetailPage({ order, onPrint }) {
  return (
    <>
      <PageHeader
        title={`Orden ${order.number}`}
        actions={
          <>
            <ActionButton variant="outline-primary" onClick={onPrint}>🖨️ Imprimir</ActionButton>
            <Link to="/admin/ordenes" className="btn btn-outline-secondary">← Volver a órdenes</Link>
          </>
        }
      />
      {order.status === 'Rechazada' && (
        <div className="alert alert-danger" role="alert">
          Pago rechazado: {order.failureReason}
        </div>
      )}
      <OrderReceipt order={order} />
    </>
  )
}
