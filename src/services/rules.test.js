// Reglas de negocio de casos límite: roles, edición con datos inválidos y reportes con datos incompletos.
import { describe, expect, it } from 'vitest'
import { categoryRepository, productRepository, userRepository } from '../data/db'
import { initialOrders } from '../data/seed'
import { validateOptional } from '../utils/validators'
import { categoryService } from './categoryService'
import { productService } from './productService'
import { salesByCategory } from './reportService'
import { userService } from './userService'

// Igual que el formulario de edición: la contraseña va vacía (= no se cambia).
const datosUsuario = (run) => ({ ...userRepository.getById(run), password: '', passwordConfirm: '' })

describe('userService.update: cambios de rol', () => {
  it('rechaza un rol que no existe', () => {
    const r = userService.update('222222222', { ...datosUsuario('222222222'), role: 'Superusuario' })
    expect(r.ok).toBe(false)
    expect(r.errors.role).toBe('Selecciona un rol válido.')
  })

  it('no deja quitarle el rol al único administrador', () => {
    const r = userService.update('111111111', { ...datosUsuario('111111111'), role: 'Vendedor' })
    expect(r.ok).toBe(false)
    expect(r.errors.role).toBe('Debe existir al menos un administrador.')
    expect(userRepository.getById('111111111').role).toBe('Administrador')
  })

  it('sí lo permite si hay otro administrador', () => {
    userService.update('222222222', { ...datosUsuario('222222222'), role: 'Administrador' })
    const r = userService.update('111111111', { ...datosUsuario('111111111'), role: 'Vendedor' })
    expect(r.ok).toBe(true)
    expect(userRepository.getById('111111111').role).toBe('Vendedor')
  })

  it('un administrador puede ascender a un Cliente a Vendedor', () => {
    const r = userService.update('123456785', { ...datosUsuario('123456785'), role: 'Vendedor' })
    expect(r.ok).toBe(true)
    expect(userRepository.getById('123456785').role).toBe('Vendedor')
  })
})

describe('productService.update y create: casos límite', () => {
  const valido = {
    name: 'Cemento actualizado', categoryId: 'mat-construccion', subcategory: 'Cementos', brand: 'Polpaico',
    price: '6100', discountPercent: '5', stock: '70', criticalStock: '15', description: 'Nuevo texto',
  }

  it('update guarda los cambios convirtiendo los textos a números', () => {
    const r = productService.update('MC001', valido)
    expect(r.ok).toBe(true)
    expect(productRepository.getById('MC001')).toMatchObject({ price: 6100, discountPercent: 5, stock: 70, criticalStock: 15 })
  })

  it('update con datos inválidos no modifica el producto', () => {
    const r = productService.update('MC001', { ...valido, name: '', price: '-1' })
    expect(r.ok).toBe(false)
    expect(Object.keys(r.errors)).toEqual(expect.arrayContaining(['name', 'price']))
    expect(productRepository.getById('MC001').name).toBe('Cemento Polpaico gris 25 kg')
  })

  it('update de un producto inexistente informa el error', () => {
    expect(productService.update('NOEXISTE', valido).errors.general).toMatch(/no existe/)
  })

  it('create completa los opcionales: descuento 0, ícono por defecto y textos vacíos', () => {
    const r = productService.create({
      id: 'zz-1', name: 'Mínimo', categoryId: 'pinturas', price: '100', stock: '1', discountPercent: '', criticalStock: '',
    })
    expect(r.ok).toBe(true)
    expect(r.product).toMatchObject({ id: 'ZZ-1', discountPercent: 0, criticalStock: 0, icon: '📦', brand: '', subcategory: '', description: '' })
  })
})

describe('categoryService: casos límite', () => {
  it('rechaza un nombre sin letras ni números', () => {
    const r = categoryService.create({ name: '###', icon: '', description: '' })
    expect(r.ok).toBe(false)
    expect(r.errors.name).toBe('El nombre debe contener letras o números.')
  })

  it('update rechaza un nombre que ya usa otra categoría pero acepta conservar el propio', () => {
    expect(categoryService.update('pinturas', { name: 'Herramientas', icon: '🎨', description: '' }).errors.name).toMatch(/Ya existe/)
    const r = categoryService.update('pinturas', { name: 'Pinturas', icon: '🎨', description: 'Nueva descripción' })
    expect(r.ok).toBe(true)
    expect(categoryRepository.getById('pinturas').description).toBe('Nueva descripción')
  })

  it('update de una categoría inexistente informa el error', () => {
    expect(categoryService.update('nada', { name: 'X' }).errors.general).toMatch(/no existe/)
  })
})

describe('reportService.salesByCategory: pedidos antiguos', () => {
  it('si el ítem no guarda la categoría, la deduce del producto; si tampoco existe, usa "Sin categoría"', () => {
    const base = initialOrders.find((o) => o.status === 'Pagada')
    const item = (productId, categoryId) => ({ productId, categoryId, name: 'x', quantity: 2, unitPrice: 100, subtotal: 200 })
    const pedido = {
      ...base,
      items: [item('HE001', undefined), item('ELIMINADO', undefined)],
    }
    const filas = salesByCategory([pedido], [{ id: 'herramientas', name: 'Herramientas' }], [{ id: 'HE001', categoryId: 'herramientas' }])
    expect(filas.find((f) => f.categoryId === 'herramientas')).toMatchObject({ units: 2, revenue: 200 })
    expect(filas.find((f) => f.categoryId === 'sin-categoria')).toMatchObject({ name: 'Sin categoría', units: 2 })
  })
})

describe('validateOptional', () => {
  it('acepta vacío y rechaza textos que superan el máximo', () => {
    expect(validateOptional('', 'La marca', 5).valid).toBe(true)
    expect(validateOptional(undefined, 'La marca', 5).valid).toBe(true)
    expect(validateOptional('123456', 'La marca', 5).message).toBe('La marca: máximo 5 caracteres.')
  })
})
