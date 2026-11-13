import { describe, expect, it } from 'vitest'
import { orderRepository, productRepository } from '../data/db'
import { storage } from '../data/storage'
import { fakeCalls, fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
import { buildOrderLines, ORDER_STATUS, orderService, summarizeCart, validateCheckoutForm } from './orderService'

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

  describe('placeOrder (POST /api/v1/boletas)', () => {
    it('con pago aprobado devuelve la boleta Pagada y el stock baja en el backend', async () => {
      iniciarSesion('contratista@gmail.com')
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 3 }] })
      expect(r.ok).toBe(true)
      expect(r.order.status).toBe(ORDER_STATUS.PAID)
      expect(r.order.number).toMatch(/^\d{8}-\d{3}$/)
      expect(r.order.totals.total).toBe(17970)
      expect(r.order.userRun).toBe('189998880') // el backend asocia la boleta al usuario del token
      expect(fakeDb().products.find((p) => p.id === 'MC001').stock).toBe(77)
      expect(productRepository.getById('MC001').stock).toBe(77) // el catálogo se vuelve a pedir tras pagar
      expect(orderRepository.getById(r.order.number)).not.toBeNull()
    })

    it('envía los productos como { id, qty } con el formulario y el cupón en mayúsculas', async () => {
      await orderService.placeOrder({
        form: { ...formValido, deliveryId: 'despacho' },
        cartItems: [{ id: 'MC001', qty: 2 }],
        couponCode: 'contratista10',
      })
      expect(fakeCalls()[0]).toMatchObject({
        method: 'POST',
        path: '/boletas',
        body: {
          items: [{ id: 'MC001', qty: 2 }],
          couponCode: 'CONTRATISTA10',
          form: { name: 'Felipe', deliveryId: 'despacho', paymentMethod: 'tarjeta' },
        },
      })
    })

    it('un invitado (sin sesión) también puede comprar: la boleta queda sin usuario', async () => {
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(r.ok).toBe(true)
      expect(r.order.userRun).toBeNull()
      expect(fakeCalls()[0].auth).toBeNull()
    })

    it('con pago rechazado devuelve la boleta Rechazada y NO descuenta stock', async () => {
      const r = await orderService.placeOrder({
        form: { ...formValido, paymentMethod: 'tarjeta-rechazada' },
        cartItems: [{ id: 'MC001', qty: 3 }],
      })
      expect(r.ok).toBe(true)
      expect(r.order.status).toBe(ORDER_STATUS.REJECTED)
      expect(r.order.failureReason).toMatch(/rechazado/i)
      expect(fakeDb().products.find((p) => p.id === 'MC001').stock).toBe(80)
    })

    it('no llama al backend si el formulario es inválido', async () => {
      const r = await orderService.placeOrder({ form: { ...formValido, street: '' }, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(r.ok).toBe(false)
      expect(r.errors.street).toBeDefined()
      expect(fakeCalls()).toHaveLength(0)
    })

    it('no llama al backend con el carrito vacío', async () => {
      const r = await orderService.placeOrder({ form: formValido, cartItems: [] })
      expect(r.errors.cart).toMatch(/vacío/)
      expect(fakeCalls()).toHaveLength(0)
    })

    it('revisa el stock disponible antes de enviar la compra', async () => {
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'HE004', qty: 4 }] })
      expect(r.ok).toBe(false)
      expect(r.errors.cart).toMatch(/stock suficiente/)
      expect(fakeCalls()).toHaveLength(0)
    })

    it('si el stock cambió y el navegador no lo sabía, muestra el error del backend (400)', async () => {
      fakeDb().products.find((p) => p.id === 'MC001').stock = 1 // otra persona compró antes
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 3 }] })
      expect(r.ok).toBe(false)
      expect(r.errors.cart).toMatch(/stock suficiente/)
      expect(fakeDb().orders).toHaveLength(4) // no se creó ninguna boleta
    })

    it('guarda el cupón aplicado y el despacho en la boleta', async () => {
      const r = await orderService.placeOrder({
        form: { ...formValido, deliveryId: 'despacho' },
        cartItems: [{ id: 'MC001', qty: 2 }],
        couponCode: 'contratista10',
      })
      expect(r.order.coupon).toEqual({ code: 'CONTRATISTA10', percent: 10 })
      expect(r.order.delivery.cost).toBe(4990)
    })

    it('dos compras el mismo día reciben números distintos y consecutivos', async () => {
      const a = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      const b = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(a.order.number).not.toBe(b.order.number)
      expect(Number(b.order.number.split('-')[1])).toBe(Number(a.order.number.split('-')[1]) + 1)
    })

    it('informa si el servidor no responde y no se pierde el carrito', async () => {
      fakeDb().offline = true
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(r.ok).toBe(false)
      expect(r.errors.cart).toMatch(/comunicarse con el servidor/)
    })

    it('guarda la última compra en el navegador para poder ver el comprobante al recargar', async () => {
      const r = await orderService.placeOrder({ form: formValido, cartItems: [{ id: 'MC001', qty: 1 }] })
      expect(storage.get('last_order').number).toBe(r.order.number)
      orderRepository.clear() // como si se recargara la página
      expect(orderService.getByNumber(r.order.number).number).toBe(r.order.number)
      expect(orderService.getByNumber('20250101-001')).toBeNull()
    })
  })

  it('getAllSorted ordena las boletas del más reciente al más antiguo', () => {
    iniciarSesion('admin@duoc.cl')
    const numeros = orderService.getAllSorted().map((o) => o.number)
    expect(numeros[0]).toBe('20261012-001')
    expect(numeros.at(-1)).toBe('20260928-001')
    expect(orderService.getByNumber('20261002-001').customer.name).toBe('María')
  })
})
