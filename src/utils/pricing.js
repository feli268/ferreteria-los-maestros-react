// Reglas de precios, stock, cupones, despacho e IVA (funciones puras).
import { DELIVERY_OPTIONS } from '../data/catalogs'

export const IVA_RATE = 0.19

// Cupones simulados: código -> porcentaje de descuento.
export const COUPONS = {
  CONTRATISTA10: 10,
  MAESTRO10: 10,
}

/** ¿El producto tiene un descuento de oferta vigente? */
export function isOnOffer(product) {
  return Number(product?.discountPercent) > 0
}

/** Precio que paga el cliente (con IVA incluido y oferta aplicada). */
export function getEffectivePrice(product) {
  const price = Number(product?.price) || 0
  if (!isOnOffer(product)) return price
  return Math.round(price * (1 - Number(product.discountPercent) / 100))
}

export function isOutOfStock(product) {
  return !product || Number(product.stock) <= 0
}

/** Stock crítico: igual o inferior al umbral definido (y aún hay unidades). */
export function isCritical(product) {
  return Number(product.stock) <= Number(product.criticalStock)
}

/** Porcentaje del cupón o 0 si el código no es válido. */
export function findCouponPercent(code) {
  const clave = String(code ?? '').trim().toUpperCase()
  return COUPONS[clave] ?? 0
}

/** Costo de despacho según la opción elegida y el monto de la compra. */
export function getShippingCost(deliveryId, amountAfterDiscount) {
  const option = DELIVERY_OPTIONS.find((o) => o.id === deliveryId)
  if (!option) return 0
  if (option.freeFrom !== null && amountAfterDiscount >= option.freeFrom) return 0
  return option.cost
}

/**
 * Calcula los totales de una compra.
 * Los precios de los productos ya incluyen IVA, por eso el neto se obtiene dividiendo.
 *
 * @param {{unitPrice:number, quantity:number}[]} lines líneas del carrito
 * @param {{couponPercent?:number, shipping?:number}} options
 */
export function calculateTotals(lines, { couponPercent = 0, shipping = 0 } = {}) {
  const gross = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const discount = Math.round(gross * (couponPercent / 100))
  const afterDiscount = gross - discount
  const total = afterDiscount + shipping
  const net = Math.round(total / (1 + IVA_RATE))
  const iva = total - net
  return { gross, discount, afterDiscount, shipping, net, iva, total }
}
