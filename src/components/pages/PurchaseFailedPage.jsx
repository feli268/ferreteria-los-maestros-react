// Página: no se pudo realizar el pago.
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import { formatCLP } from '../../utils/format'

export default function PurchaseFailedPage({ order }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 680 }}>
      <Alert variant="danger">
        <h1 className="h4 alert-heading">No se pudo realizar el pago</h1>
        <p className="mb-1">
          Tu pedido <strong>N° {order.number}</strong> no fue cobrado.
        </p>
        <p className="mb-0">Motivo: {order.failureReason}</p>
      </Alert>
      <Card body className="mb-3">
        <h2 className="h5">Resumen del intento</h2>
        <ul className="list-unstyled small mb-2">
          {order.items.map((i) => (
            <li key={i.productId} className="d-flex justify-content-between">
              <span>{i.quantity} × {i.name}</span>
              <span>{formatCLP(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="d-flex justify-content-between fw-bold border-top pt-2">
          <span>Total</span>
          <span>{formatCLP(order.totals.total)}</span>
        </div>
      </Card>
      <p className="text-secondary small">
        Tus productos siguen en el carrito y no se descontó stock. Revisa los datos de pago e inténtalo nuevamente.
      </p>
      <div className="d-flex flex-wrap gap-2">
        <Link to="/checkout" className="btn btn-primary btn-lg">
          VOLVER A REALIZAR EL PAGO
        </Link>
        <Link to="/carrito" className="btn btn-outline-secondary btn-lg">
          Revisar carrito
        </Link>
      </div>
    </div>
  )
}
