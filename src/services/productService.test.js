import { describe, expect, it } from 'vitest'
import { productRepository } from '../data/db'
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

describe('productService', () => {
  it('create agrega el producto con código en mayúsculas y números reales', () => {
    const r = productService.create({ ...valido, price: '15990', stock: '12' })
    expect(r.ok).toBe(true)
    expect(r.product.id).toBe('TA-001')
    expect(r.product.price).toBe(15990)
    expect(productRepository.getById('TA-001').stock).toBe(12)
  })

  it('create rechaza código repetido y categoría inexistente', () => {
    expect(productService.create({ ...valido, id: 'mc001' }).errors.id).toMatch(/Ya existe/)
    expect(productService.create({ ...valido, categoryId: 'nada' }).errors.categoryId).toBeDefined()
  })

  it('acepta precio 0 sin cambiarlo (error de la entrega 1)', () => {
    const r = productService.create({ ...valido, price: 0 })
    expect(r.ok).toBe(true)
    expect(r.product.price).toBe(0)
  })

  it('valida precio, stock, descuento y nombre', () => {
    const errores = validateProductForm({ ...valido, name: '', price: -5, stock: 1.5, discountPercent: 95 })
    expect(Object.keys(errores).sort()).toEqual(['discountPercent', 'name', 'price', 'stock'])
  })

  it('update modifica el producto y conserva su código', () => {
    const r = productService.update('MC001', { ...productRepository.getById('MC001'), price: 6500, stock: 70 })
    expect(r.ok).toBe(true)
    expect(productRepository.getById('MC001').price).toBe(6500)
    expect(productRepository.getById('MC001').id).toBe('MC001')
  })

  it('update de un producto inexistente falla', () => {
    expect(productService.update('XX', valido).errors.general).toBeDefined()
  })

  it('remove elimina el producto', () => {
    expect(productService.remove('MC001').ok).toBe(true)
    expect(productRepository.getById('MC001')).toBeNull()
    expect(productService.remove('MC001').ok).toBe(false)
  })

  it('decreaseStock descuenta sin dejar el stock en negativo', () => {
    productService.decreaseStock('MC001', 5)
    expect(productRepository.getById('MC001').stock).toBe(75)
    productService.decreaseStock('MC001', 1000)
    expect(productRepository.getById('MC001').stock).toBe(0)
    expect(productService.decreaseStock('NOEXISTE', 1)).toBeNull()
  })

  it('getCritical lista productos con stock bajo el umbral, el más urgente primero', () => {
    const ids = productService.getCritical().map((p) => p.id)
    expect(ids).toEqual(['HE004', 'GA002', 'MC002'])
  })
})
