// Página: carrito de compras.
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import ConfirmModal from '../molecules/ConfirmModal'
import CouponForm from '../molecules/CouponForm'
import EmptyState from '../molecules/EmptyState'
import OrderSummary from '../molecules/OrderSummary'
import PageHeader from '../molecules/PageHeader'
import CartTable from '../organisms/CartTable'

export default function CartPage({
  lines,
  stockById,
  totals,
  couponCode,
  couponPercent,
  confirmClear,
  onQuantityChange,
  onRemove,
  onApplyCoupon,
  onRemoveCoupon,
  onAskClear,
  onCancelClear,
  onConfirmClear,
  onCheckout,
}) {
  if (lines.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Tu carrito está vacío"
        message="Agrega productos desde el catálogo para comenzar tu compra."
        action={
          <Link to="/productos" className="btn btn-primary">
            Ver productos
          </Link>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Carrito de compras"
        subtitle={`${lines.length} ${lines.length === 1 ? 'producto distinto' : 'productos distintos'}`}
        actions={
          <ActionButton variant="outline-danger" size="sm" onClick={onAskClear}>
            Vaciar carrito
          </ActionButton>
        }
      />
      <Row className="g-4">
        <Col xs={12} lg={8}>
          <CartTable lines={lines} stockById={stockById} onQuantityChange={onQuantityChange} onRemove={onRemove} />
          <Link to="/productos" className="btn btn-outline-secondary btn-sm">
            ← Seguir comprando
          </Link>
        </Col>
        <Col xs={12} lg={4}>
          <Card body className="lm-sticky-summary">
            <CouponForm
              appliedCode={couponCode}
              appliedPercent={couponPercent}
              onApply={onApplyCoupon}
              onRemove={onRemoveCoupon}
            />
            <hr />
            <OrderSummary totals={totals} couponCode={couponCode} couponPercent={couponPercent} showShipping={false} />
            <p className="small text-secondary">El costo de despacho se calcula en el siguiente paso.</p>
            <ActionButton size="lg" className="w-100" onClick={onCheckout}>
              Ir a pagar
            </ActionButton>
          </Card>
        </Col>
      </Row>
      <ConfirmModal
        show={confirmClear}
        title="Vaciar carrito"
        message="¿Quieres quitar todos los productos de tu carrito?"
        confirmLabel="Sí, vaciar"
        onConfirm={onConfirmClear}
        onCancel={onCancelClear}
      />
    </>
  )
}
