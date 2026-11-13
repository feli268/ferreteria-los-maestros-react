// Checkout y pedidos: valida los datos en el navegador (respuesta inmediata) y envía la compra al backend
// (POST /api/v1/boletas). El backend calcula los precios, cobra con la pasarela simulada, descuenta
// el stock solo si el pago es aprobado, genera el número de orden y guarda la boleta.
import { boletasApi } from '../api'
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from '../data/catalogs'
import { orderRepository, productRepository } from '../data/db'
import { storage } from '../data/storage'
import { calculateTotals, findCouponPercent, getEffectivePrice, getShippingCost } from '../utils/pricing'
import {
  collectErrors,
  validateEmail,
  validateOptional,
  validateRegionComuna,
  validateRequired,
} from '../utils/validators'
import { falla } from './apiResult'

export const ORDER_STATUS = { PAID: 'Pagada', REJECTED: 'Rechazada' }

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
  async placeOrder({ form, cartItems, couponCode = '' }) {
    const errors = validateCheckoutForm(form)
    if (Object.keys(errors).length > 0) return { ok: false, errors }

    const { lines } = summarizeCart(cartItems, { couponCode, deliveryId: form.deliveryId })
    if (lines.length === 0) return { ok: false, errors: { cart: 'Tu carrito está vacío.' } }

    // El stock se revisa al pagar: pudo cambiar desde que se agregó al carrito (el backend lo vuelve a revisar).
    const sinStock = lines.find((l) => l.quantity > (productRepository.getById(l.productId)?.stock ?? 0))
    if (sinStock) {
      return {
        ok: false,
        errors: { cart: `No hay stock suficiente de "${sinStock.name}". Ajusta la cantidad en el carrito.` },
      }
    }

    let order
    try {
      order = await boletasApi.crear({
        form: {
          name: form.name.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim().toLowerCase(),
          street: form.street.trim(),
          apartment: String(form.apartment ?? '').trim(),
          region: form.region,
          comuna: form.comuna,
          notes: String(form.notes ?? '').trim(),
          deliveryId: form.deliveryId,
          paymentMethod: form.paymentMethod,
        },
        items: lines.map((l) => ({ id: l.productId, qty: l.quantity })),
        couponCode: String(couponCode ?? '').trim().toUpperCase(),
      })
    } catch (error) {
      const fallo = falla(error)
      return { ok: false, errors: fallo.errors.general ? { cart: fallo.errors.general } : fallo.errors }
    }

    // La boleta queda en la copia local y en el navegador (para poder ver el comprobante al recargar).
    orderRepository.upsert(order)
    storage.set('last_order', order)
    // Si el pago fue aprobado, el stock cambió en el backend: se vuelve a pedir el catálogo.
    if (order.status === ORDER_STATUS.PAID) await productRepository.refresh()
    return { ok: true, order }
  },

  /** Boleta por número: de la lista cargada o, si recién se compró y se recargó la página, la última compra. */
  getByNumber(number) {
    const ultima = storage.get('last_order')
    return orderRepository.getById(number) ?? (ultima?.number === number ? ultima : null)
  },

  /** Pedidos más recientes primero. */
  getAllSorted() {
    return [...orderRepository.getAll()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}
