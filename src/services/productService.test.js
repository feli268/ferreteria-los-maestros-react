import { beforeEach, describe, expect, it } from 'vitest'
import { productRepository } from '../data/db'
import { fakeCalls, fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
import { productService, validateProductForm } from './productService'

const valido = {
  id: 'ta-001',
  name: 'Taladro de mano',
  categoryId: 'herramientas',
  subcategory: 'Manuales',
  brand: 'Truper',
  price: 15990,
  discountPercent: 0,
  stock: 12,
  criticalStock: 4,
  description: 'Taladro manual.',
}

describe('productService (CRUD contra /api/v1/productos)', () => {
  beforeEach(() => {
    iniciarSesion('admin@duoc.cl')
  })

  it('create envía POST con el código en mayúsculas y números reales', async () => {
    const r = await productService.create({ ...valido, price: '15990', stock: '12' })
    expect(r.ok).toBe(true)
    expect(r.product.id).toBe('TA-001')
    expect(r.product.price).toBe(15990)
    expect(productRepository.getById('TA-001').stock).toBe(12)
    expect(fakeDb().products.some((p) => p.id === 'TA-001')).toBe(true)
    expect(fakeCalls()[0]).toMatchObject({ method: 'POST', path: '/productos', body: { id: 'TA-001', price: 15990, stock: 12 } })
  })

  it('create rechaza código repetido y categoría inexistente', async () => {
    expect((await productService.create({ ...valido, id: 'mc001' })).errors.id).toMatch(/Ya existe/)
    expect((await productService.create({ ...valido, categoryId: 'nada' })).errors.categoryId).toBeDefined()
    expect(fakeCalls()).toHaveLength(0)
  })

  it('acepta precio 0 sin cambiarlo (error de la entrega 1)', async () => {
    const r = await productService.create({ ...valido, price: 0 })
    expect(r.ok).toBe(true)
    expect(r.product.price).toBe(0)
  })

  it('valida precio, stock, descuento y nombre', () => {
    const errores = validateProductForm({ ...valido, name: '', price: -5, stock: 1.5, discountPercent: 95 })
    expect(Object.keys(errores).sort()).toEqual(['discountPercent', 'name', 'price', 'stock'])
  })

  it('update envía PUT, modifica el producto y conserva su código', async () => {
    const r = await productService.update('MC001', { ...productRepository.getById('MC001'), price: 6500, stock: 70 })
    expect(r.ok).toBe(true)
    expect(productRepository.getById('MC001').price).toBe(6500)
    expect(productRepository.getById('MC001').id).toBe('MC001')
    expect(fakeDb().products.find((p) => p.id === 'MC001').price).toBe(6500)
    expect(fakeCalls()[0]).toMatchObject({ method: 'PUT', path: '/productos/MC001' })
  })

  it('update de un producto inexistente falla', async () => {
    expect((await productService.update('XX', valido)).errors.general).toBeDefined()
  })

  it('remove envía DELETE y quita el producto', async () => {
    await productService.create(valido) // un producto sin ventas
    expect((await productService.remove('TA-001')).ok).toBe(true)
    expect(productRepository.getById('TA-001')).toBeNull()
    expect(fakeCalls().at(-1)).toMatchObject({ method: 'DELETE', path: '/productos/TA-001' })
    expect((await productService.remove('TA-001')).ok).toBe(false)
  })

  it('no se puede eliminar un producto con ventas registradas (409 del backend)', async () => {
    const r = await productService.remove('MC001') // está en una boleta de ejemplo
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/ventas registradas/)
    expect(productRepository.getById('MC001')).not.toBeNull()
  })

  it('un Vendedor no puede modificar productos: el backend responde 403', async () => {
    iniciarSesion('vendedor@profesor.duoc.cl')
    const r = await productService.update('MC001', { ...productRepository.getById('MC001'), price: 1 })
    expect(r).toMatchObject({ ok: false, status: 403 })
    expect(fakeDb().products.find((p) => p.id === 'MC001').price).toBe(5990)
  })

  it('getCritical lista productos con stock bajo el umbral, el más urgente primero', () => {
    const ids = productService.getCritical().map((p) => p.id)
    expect(ids).toEqual(['HE004', 'GA002', 'MC002'])
  })
})
