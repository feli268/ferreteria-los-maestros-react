import { beforeEach, describe, expect, it, vi } from 'vitest'
import { orderRepository, productRepository } from '../data/db'
import {
  buildOrderLines,
  generateOrderNumber,
  ORDER_STATUS,
  orderService,
  summarizeCart,
  validateCheckoutForm,
} from './orderService'
import { paymentGateway } from './paymentGateway'

const formValido = {
  name: 'Felipe',
  lastname: 'Cortés',
  email: 'contratista@gmail.com',
  street: 'Calle Las Lilas 450',
  apartment: '',
  region: 'Región de Coquimbo',
  comuna: 'La Serena',
  notes: '',
  deliveryId: 'retiro',
  paymentMethod: 'tarjeta',
}

describe('orderService', () => {
  beforeEach(() => {
    // La pasarela real espera 800 ms: en las pruebas se reemplaza por un mock.
    vi.spyOn(paymentGateway, 'charge').mockResolvedValue({ approved: true, transactionId: 'TX-1' })
  })

  describe('número de orden', () => {
    it('usa el formato AAAAMMDD-NNN y parte en 001 cada día', () => {
      expect(generateOrderNumber(new Date(2026, 10, 3))).toBe('20261103-001')
    })

    it('incrementa según las órdenes ya creadas ese día', () => {
      expect(generateOrderNumber(new Date(2026, 9, 12))).toBe('20261012-002')
    })
  })

  describe('carrito', () => {
    it('buildOrderLines usa el precio con oferta y descarta productos inexistentes', () => {
      const lines = buildOrderLines([
        { id: 'MC002', qty: 2 },
        { id: 'NOEXISTE', qty: 1 },
      ])
      expect(lines).toHaveLength(1)
      expect(lines[0].unitPrice).toBe(6367)
      expect(lines[0].subtotal).toBe(12734)
    })

    it('summarizeCart aplica cupón y despacho', () => {
      const { totals, couponPercent } = summarizeCart([{ id: 'MC001', qty: 2 }], {
        couponCode: 'maestro10',
        deliveryId: 'despacho',
      })
      expect(couponPercent).toBe(10)
      expect(totals.gross).toBe(11980)
      expect(totals.discount).toBe(1198)
      expect(totals.shipping).toBe(4990)
      expect(totals.total).toBe(15772)
    })

    it('el despacho es gratis sobre $50.000 y un carrito vacío no cobra despacho', () => {
      expect(summarizeCart([{ id: 'HE002', qty: 1 }], { deliveryId: 'despacho' }).totals.shipping).toBe(0)
      expect(summarizeCart([], { deliveryId: 'despacho' }).totals.total).toBe(0)
    })
  })

  describe('validateCheckoutForm', () => {
    it('acepta un formulario completo', () => {
      expect(validateCheckoutForm(formValido)).toEqual({})
    })

    it('reporta los campos obligatorios, el correo y la forma de entrega/pago', () => {
      const errores = validateCheckoutForm({ ...formValido, name: '', email: 'x@yahoo.com', deliveryId: '', paymentMethod: '' })
      expect(Object.keys(errores).sort()).toEqual(['deliveryId', 'email', 'name', 'paymentMethod'])
    })
  })

  describe('placeOrder', () => {
    it('con pago aprobado crea la orden Pagada y descuenta el stock', async () => {
      const r = await orderService.placeOrder({
        form: formValido,
        cartItems: [{ id: 'MC001', qty: 3 }],
        userRun: '189998880',
      })
      expect(r.ok).toBe(true)
      expect(r.order.status).toBe(ORDER_STATUS.PAID)
      expect(r.order.number).toMatch(/^\d{8}-\d{3}$/)
      expect(r.order.totals.total).toBe(17970)
      expect(paymentGateway.charge).toHaveBeenCalledWith({ amount: 17970, method: 'tarjeta' })
      expect(productRepository.getById('MC001').stock).toBe(77)
      expect(orderRepository.getById(r.order.number)).not.toBeNull()
    })

    it('con pago rechazado guarda la orden Rechazada y NO descuenta stock', async () => {
      paymentGateway.charge.mockResolvedValue({ approved: false, reason: 'Fondos insuficientes' })
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 3 }] })
      expect(r.ok).toBe(true)
      expect(r.order.status).toBe(ORDER_STATUS.REJECTED)
      expect(r.order.failureReason).toBe('Fondos insuficientes')
      expect(productRepository.getById('MC001').stock).toBe(80)
    })

    it('si la pasarela falla (excepción) la orden queda Rechazada', async () => {
      paymentGateway.charge.mockRejectedValue(new Error('timeout'))
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(r.order.status).toBe(ORDER_STATUS.REJECTED)
      expect(r.order.failureReason).toMatch(/medio de pago/)
    })

    it('no cobra si el formulario es inválido', async () => {
      const r = await orderService.placeOrder({ form: { ...formValido, street: '' }, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(r.ok).toBe(false)
      expect(r.errors.street).toBeDefined()
      expect(paymentGateway.charge).not.toHaveBeenCalled()
    })

    it('no cobra con el carrito vacío', async () => {
      const r = await orderService.placeOrder({ form: formValido, cartItems: [] })
      expect(r.errors.cart).toMatch(/vacío/)
      expect(paymentGateway.charge).not.toHaveBeenCalled()
    })

    it('revisa el stock disponible antes de cobrar', async () => {
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'HE004', qty: 4 }] })
      expect(r.ok).toBe(false)
      expect(r.errors.cart).toMatch(/stock suficiente/)
      expect(paymentGateway.charge).not.toHaveBeenCalled()
    })

    it('guarda el cupón aplicado y el despacho en la orden', async () => {
      const r = await orderService.placeOrder({
        form: { ...formValido, deliveryId: 'despacho' },
        cartItems: [{ id: 'MC001', qty: 2 }],
        couponCode: 'contratista10',
      })
      expect(r.order.coupon).toEqual({ code: 'CONTRATISTA10', percent: 10 })
      expect(r.order.delivery.cost).toBe(4990)
      expect(r.order.userRun).toBeNull()
    })

    it('dos compras el mismo día reciben números distintos y consecutivos', async () => {
      const a = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      const b = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(a.order.number).not.toBe(b.order.number)
      expect(Number(b.order.number.split('-')[1])).toBe(Number(a.order.number.split('-')[1]) + 1)
    })
  })

  it('getAllSorted ordena los pedidos del más reciente al más antiguo', () => {
    const numeros = orderService.getAllSorted().map((o) => o.number)
    expect(numeros[0]).toBe('20261012-001')
    expect(numeros.at(-1)).toBe('20260928-001')
    expect(orderService.getByNumber('20261002-001').customer.name).toBe('María')
  })
})
