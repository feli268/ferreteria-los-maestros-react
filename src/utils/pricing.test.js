import { describe, expect, it } from 'vitest'
import {
  calculateTotals,
  findCouponPercent,
  getEffectivePrice,
  getShippingCost,
  isCritical,
  isOnOffer,
  isOutOfStock,
} from './pricing'

describe('pricing', () => {
  it('getEffectivePrice aplica el descuento de oferta', () => {
    expect(getEffectivePrice({ price: 7490, discountPercent: 15 })).toBe(6367)
    expect(getEffectivePrice({ price: 5990, discountPercent: 0 })).toBe(5990)
    expect(getEffectivePrice(undefined)).toBe(0)
  })

  it('isOnOffer solo es verdadero con descuento mayor que 0', () => {
    expect(isOnOffer({ discountPercent: 10 })).toBe(true)
    expect(isOnOffer({ discountPercent: 0 })).toBe(false)
    expect(isOnOffer({})).toBe(false)
  })

  it('un producto sin stock no se puede comprar (corrige error de la entrega 1)', () => {
    expect(isOutOfStock({ stock: 0 })).toBe(true)
    expect(isOutOfStock({ stock: 1 })).toBe(false)
    expect(isOutOfStock(null)).toBe(true)
  })

  it('isCritical marca stock igual o menor al umbral', () => {
    expect(isCritical({ stock: 10, criticalStock: 10 })).toBe(true)
    expect(isCritical({ stock: 3, criticalStock: 5 })).toBe(true)
    expect(isCritical({ stock: 11, criticalStock: 10 })).toBe(false)
  })

  it('findCouponPercent ignora mayúsculas y espacios; 0 si no existe', () => {
    expect(findCouponPercent(' contratista10 ')).toBe(10)
    expect(findCouponPercent('MAESTRO10')).toBe(10)
    expect(findCouponPercent('NOEXISTE')).toBe(0)
    expect(findCouponPercent('')).toBe(0)
  })

  it('getShippingCost: retiro gratis, despacho con costo y gratis sobre $50.000', () => {
    expect(getShippingCost('retiro', 1000)).toBe(0)
    expect(getShippingCost('despacho', 10000)).toBe(4990)
    expect(getShippingCost('despacho', 49999)).toBe(4990)
    expect(getShippingCost('despacho', 50000)).toBe(0)
    expect(getShippingCost('otro', 100)).toBe(0)
  })

  it('calculateTotals separa neto e IVA (19% incluido en el precio)', () => {
    const t = calculateTotals([{ unitPrice: 11900, quantity: 1 }])
    expect(t.total).toBe(11900)
    expect(t.net).toBe(10000)
    expect(t.iva).toBe(1900)
  })

  it('calculateTotals aplica cupón y despacho', () => {
    const t = calculateTotals(
      [
        { unitPrice: 10000, quantity: 2 },
        { unitPrice: 5000, quantity: 1 },
      ],
      { couponPercent: 10, shipping: 4990 },
    )
    expect(t.gross).toBe(25000)
    expect(t.discount).toBe(2500)
    expect(t.afterDiscount).toBe(22500)
    expect(t.total).toBe(27490)
    expect(t.net + t.iva).toBe(t.total)
  })

  it('calculateTotals con carrito vacío da todo en cero', () => {
    expect(calculateTotals([]).total).toBe(0)
  })
})
