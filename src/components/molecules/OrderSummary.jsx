// Molécula: desglose de totales (subtotal, cupón, despacho, neto, IVA y total).
import { formatCLP } from '../../utils/format'
import { IVA_RATE } from '../../utils/pricing'

function Fila({ label, value, strong = false, tone }) {
  return (
    <div className={`d-flex justify-content-between py-1 ${strong ? 'fw-bold fs-5 border-top mt-2 pt-2' : ''}`}>
      <span className={tone ? `text-${tone}` : undefined}>{label}</span>
      <span className={tone ? `text-${tone}` : undefined}>{value}</span>
    </div>
  )
}

export default function OrderSummary({ totals, couponCode, couponPercent = 0, showShipping = true, title = 'Resumen' }) {
  return (
    <section aria-label={title} className="lm-order-summary">
      <h2 className="fs-5 mb-3">{title}</h2>
      <Fila label="Subtotal" value={formatCLP(totals.gross)} />
      {totals.discount > 0 && (
        <Fila
          label={`Cupón ${couponCode ?? ''} (-${couponPercent}%)`.replace('  ', ' ')}
          value={`-${formatCLP(totals.discount)}`}
          tone="success"
        />
      )}
      {showShipping && (
        <Fila label="Despacho" value={totals.shipping === 0 ? 'Gratis' : formatCLP(totals.shipping)} />
      )}
      <Fila label="Neto" value={formatCLP(totals.net)} tone="secondary" />
      <Fila label={`IVA (${Math.round(IVA_RATE * 100)}%)`} value={formatCLP(totals.iva)} tone="secondary" />
      <Fila label="Total a pagar" value={formatCLP(totals.total)} strong />
      <p className="small text-secondary mb-0 mt-2">Los precios incluyen IVA.</p>
    </section>
  )
}
