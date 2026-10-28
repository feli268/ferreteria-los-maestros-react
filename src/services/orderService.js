// Checkout y pedidos: valida los datos, "cobra" con la pasarela simulada,
// descuenta el stock solo si el pago es aprobado y guarda la orden.
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from '../data/catalogs'
import { orderRepository, productRepository } from '../data/db'
import { calculateTotals, findCouponPercent, getEffectivePrice, getShippingCost } from '../utils/pricing'
import {
  collectErrors,
  validateEmail,
  validateOptional,
  validateRegionComuna,
  validateRequired,
} from '../utils/validators'
import { paymentGateway } from './paymentGateway'
import { productService } from './productService'

export const ORDER_STATUS = { PAID: 'Pagada', REJECTED: 'Rechazada' }

const pad = (n, largo) => String(n).padStart(largo, '0')

/** Número de orden con formato AAAAMMDD-NNN (NNN se reinicia cada día). */
export function generateOrderNumber(date = new Date()) {
  const prefijo = `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`
  const delDia = orderRepository.find((o) => o.number.startsWith(`${prefijo}-`))
  const mayor = delDia.reduce((max, o) => Math.max(max, parseInt(o.number.split('-')[1], 10) || 0), 0)
  return `${prefijo}-${pad(mayor + 1, 3)}`
}

/** Une los ítems del carrito ({id, qty}) con los productos vigentes de la base de datos. */
export function buildOrderLines(cartItems) {
  return cartItems
    .map(({ id, qty }) => {
      const product = productRepository.getById(id)
      if (!product) return null
      const unitPrice = getEffectivePrice(product)
      return {
        productId: product.id,
        name: product.name,
        icon: product.icon,
        categoryId: product.categoryId,
        quantity: qty,
        unitPrice,
        subtotal: unitPrice * qty,
      }
    })
    .filter(Boolean)
}

/** Totales de un carrito según cupón y forma de entrega. */
export function summarizeCart(cartItems, { couponCode = '', deliveryId = 'retiro' } = {}) {
  const lines = buildOrderLines(cartItems)
  const couponPercent = findCouponPercent(couponCode)
  const bruto = lines.reduce((s, l) => s + l.subtotal, 0)
  const trasDescuento = bruto - Math.round(bruto * (couponPercent / 100))
  const shipping = lines.length > 0 ? getShippingCost(deliveryId, trasDescuento) : 0
  return { lines, couponPercent, totals: calculateTotals(lines, { couponPercent, shipping }) }
}

export function validateCheckoutForm(data) {
  const errores = collectErrors({
    name: validateRequired(data.name, 'El nombre', 50),
    lastname: validateRequired(data.lastname, 'Los apellidos', 100),
    email: validateEmail(data.email),
    street: validateRequired(data.street, 'La calle', 300),
    apartment: validateOptional(data.apartment, 'El departamento', 50),
    region: validateRegionComuna(data.region, data.comuna),
    notes: validateOptional(data.notes, 'Las indicaciones', 500),
  })
  if (!DELIVERY_OPTIONS.some((d) => d.id === data.deliveryId)) {
    errores.deliveryId = 'Selecciona una forma de entrega.'
  }
  if (!PAYMENT_METHODS.some((m) => m.id === data.paymentMethod)) {
    errores.paymentMethod = 'Selecciona un método de pago.'
  }
  return errores
}

export const orderService = {
  /**
   * Procesa la compra.
   * @returns {Promise<{ok:true, order:object} | {ok:false, errors:object}>}
   *   Si el pago es rechazado también devuelve ok:true, con order.status === 'Rechazada'.
   */
  async placeOrder({ form, cartItems, couponCode = '', userRun = null }) {
    const errors = validateCheckoutForm(form)
    if (Object.keys(errors).length > 0) return { ok: false, errors }

    const { lines, couponPercent, totals } = summarizeCart(cartItems, {
      couponCode,
      deliveryId: form.deliveryId,
    })
    if (lines.length === 0) return { ok: false, errors: { cart: 'Tu carrito está vacío.' } }

    // El stock se revisa al pagar: pudo cambiar desde que se agregó al carrito.
    const sinStock = lines.find((l) => l.quantity > (productRepository.getById(l.productId)?.stock ?? 0))
    if (sinStock) {
      return {
        ok: false,
        errors: { cart: `No hay stock suficiente de "${sinStock.name}". Ajusta la cantidad en el carrito.` },
      }
    }

    let pago
    try {
      pago = await paymentGateway.charge({ amount: totals.total, method: form.paymentMethod })
    } catch {
      pago = { approved: false, reason: 'No fue posible comunicarse con el medio de pago.' }
    }

    const delivery = DELIVERY_OPTIONS.find((d) => d.id === form.deliveryId)
    const order = orderRepository.create({
      number: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      status: pago.approved ? ORDER_STATUS.PAID : ORDER_STATUS.REJECTED,
      failureReason: pago.approved ? null : (pago.reason ?? 'Pago rechazado.'),
      userRun,
      customer: {
        name: form.name.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim().toLowerCase(),
      },
      address: {
        street: form.street.trim(),
        apartment: String(form.apartment ?? '').trim(),
        region: form.region,
        comuna: form.comuna,
        notes: String(form.notes ?? '').trim(),
      },
      delivery: { id: delivery.id, label: delivery.label, cost: totals.shipping },
      paymentMethod: form.paymentMethod,
      coupon: couponPercent > 0 ? { code: String(couponCode).trim().toUpperCase(), percent: couponPercent } : null,
      items: lines,
      totals,
    })

    if (pago.approved) lines.forEach((l) => productService.decreaseStock(l.productId, l.quantity))
    return { ok: true, order }
  },

  getByNumber(number) {
    return orderRepository.getById(number)
  },

  /** Pedidos más recientes primero. */
  getAllSorted() {
    return [...orderRepository.getAll()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}
