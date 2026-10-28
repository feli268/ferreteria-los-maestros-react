// Página: finalizar compra (formulario + resumen del pedido).
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import { formatCLP } from '../../utils/format'
import OrderSummary from '../molecules/OrderSummary'
import PageHeader from '../molecules/PageHeader'
import CheckoutForm from '../organisms/CheckoutForm'

export default function CheckoutPage({ lines, totals, couponCode, couponPercent, ...formProps }) {
  return (
    <>
      <PageHeader title="Finalizar compra" subtitle="Revisa tus datos y elige cómo recibir y pagar tu pedido." />
      <Row className="g-4">
        <Col xs={12} lg={7}>
          <Card body>
            <CheckoutForm total={totals.total} {...formProps} />
          </Card>
        </Col>
        <Col xs={12} lg={5}>
          <Card body className="lm-sticky-summary">
            <h2 className="h5">Tu pedido</h2>
            <ul className="list-unstyled small mb-3">
              {lines.map((l) => (
                <li key={l.productId} className="d-flex justify-content-between py-1">
                  <span>{l.quantity} × {l.name}</span>
                  <span>{formatCLP(l.subtotal)}</span>
                </li>
              ))}
            </ul>
            <OrderSummary totals={totals} couponCode={couponCode} couponPercent={couponPercent} />
            <Link to="/carrito" className="btn btn-link btn-sm px-0">← Volver al carrito</Link>
          </Card>
        </Col>
      </Row>
    </>
  )
}
