import { describe, expect, it } from 'vitest'
import { categoryRepository } from '../data/db'
import { categoryService } from './categoryService'

describe('categoryService', () => {
  it('create genera el identificador a partir del nombre', () => {
    const r = categoryService.create({ name: 'Jardín y Riego', icon: '🌱', description: 'Mangueras' })
    expect(r.ok).toBe(true)
    expect(r.category.id).toBe('jardin-y-riego')
    expect(categoryRepository.getById('jardin-y-riego').icon).toBe('🌱')
  })

  it('create exige nombre y rechaza nombres repetidos', () => {
    expect(categoryService.create({ name: '' }).errors.name).toMatch(/obligatorio/)
    expect(categoryService.create({ name: 'herramientas' }).errors.name).toMatch(/Ya existe/)
  })

  it('update cambia nombre e ícono, y permite conservar el mismo nombre', () => {
    const r = categoryService.update('pinturas', { name: 'Pinturas y Barnices', icon: '🖌️', description: '' })
    expect(r.ok).toBe(true)
    expect(categoryRepository.getById('pinturas').name).toBe('Pinturas y Barnices')
    expect(categoryService.update('pinturas', { name: 'Pinturas y Barnices' }).ok).toBe(true)
  })

  it('update falla si la categoría no existe', () => {
    expect(categoryService.update('nada', { name: 'X' }).errors.general).toBeDefined()
  })

  it('no elimina categorías que aún tienen productos', () => {
    const r = categoryService.remove('herramientas')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/producto/)
  })

  it('elimina una categoría vacía', () => {
    categoryService.create({ name: 'Vacía' })
    expect(categoryService.remove('vacia').ok).toBe(true)
    expect(categoryService.remove('vacia').ok).toBe(false)
  })
})
