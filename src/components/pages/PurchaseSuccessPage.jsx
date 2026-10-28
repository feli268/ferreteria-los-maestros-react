// Página: compra realizada con éxito (muestra la boleta).
import Alert from 'react-bootstrap/Alert'
import { Link } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import OrderReceipt from '../organisms/OrderReceipt'

export default function PurchaseSuccessPage({ order, onPrint }) {
  return (
    <>
      <Alert variant="success" className="lm-no-print">
        <h1 className="h4 alert-heading">¡Compra realizada con éxito!</h1>
        <p className="mb-0">
          Tu pedido <strong>N° {order.number}</strong> fue pagado correctamente. Enviamos una copia de la boleta a{' '}
          <strong>{order.customer.email}</strong> <span className="text-secondary">(envío simulado)</span>.
        </p>
      </Alert>
      <OrderReceipt order={order} />
      <div className="d-flex flex-wrap gap-2 mt-3 lm-no-print">
        <ActionButton variant="outline-primary" onClick={onPrint}>
          🖨️ Imprimir / guardar PDF
        </ActionButton>
        <Link to="/productos" className="btn btn-primary">
          Seguir comprando
        </Link>
      </div>
    </>
  )
}
