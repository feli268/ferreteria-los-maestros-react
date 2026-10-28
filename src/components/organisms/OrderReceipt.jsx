// Organismo: boleta electrónica de una compra (se puede imprimir o guardar como PDF).
import Badge from 'react-bootstrap/Badge'
import Table from 'react-bootstrap/Table'
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from '../../data/catalogs'
import { formatCLP, formatDate } from '../../utils/format'
import OrderSummary from '../molecules/OrderSummary'

export default function OrderReceipt({ order }) {
  const metodo = PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod
  const entrega = order.delivery?.label ?? DELIVERY_OPTIONS.find((d) => d.id === order.delivery?.id)?.label
  const pagada = order.status === 'Pagada'

  return (
    <article className="lm-receipt border rounded p-3 p-md-4 bg-white" aria-label={`Boleta ${order.number}`}>
      <header className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <div>
          <h2 className="h4 mb-0">Boleta electrónica</h2>
          <div className="text-secondary">Ferretería Los Maestros · La Serena</div>
        </div>
        <div className="text-md-end">
          <div className="fw-bold">N° {order.number}</div>
          <div className="small text-secondary">{formatDate(order.createdAt)}</div>
          <Badge bg={pagada ? 'success' : 'danger'}>{order.status}</Badge>
        </div>
      </header>

      <div className="row g-3 mb-3">
        <section className="col-12 col-md-6" aria-label="Datos del cliente">
          <h3 className="h6">Cliente</h3>
          <div>
            {order.customer.name} {order.customer.lastname}
          </div>
          <div className="small text-secondary">{order.customer.email}</div>
        </section>
        <section className="col-12 col-md-6" aria-label="Datos de entrega">
          <h3 className="h6">Entrega</h3>
          <div>
            {order.address.street}
            {order.address.apartment ? `, ${order.address.apartment}` : ''}
          </div>
          <div className="small text-secondary">
            {order.address.comuna}, {order.address.region}
          </div>
          {order.address.notes && <div className="small fst-italic">“{order.address.notes}”</div>}
          <div className="small">
            {entrega} · {metodo}
          </div>
        </section>
      </div>

      <Table responsive size="sm" className="align-middle">
        <caption className="visually-hidden">Detalle de la compra</caption>
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col" className="text-end">Precio</th>
            <th scope="col" className="text-end">Cant.</th>
            <th scope="col" className="text-end">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.productId}>
              <td>{item.name}</td>
              <td className="text-end">{formatCLP(item.unitPrice)}</td>
              <td className="text-end">{item.quantity}</td>
              <td className="text-end">{formatCLP(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="ms-md-auto" style={{ maxWidth: 360 }}>
        <OrderSummary
          title="Totales"
          totals={order.totals}
          couponCode={order.coupon?.code}
          couponPercent={order.coupon?.percent}
        />
      </div>
    </article>
  )
}
