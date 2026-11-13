import { beforeEach, describe, expect, it } from 'vitest'
import { categoryRepository } from '../data/db'
import { fakeCalls, fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
import { categoryService } from './categoryService'

describe('categoryService (CRUD contra /api/v1/categorias)', () => {
  beforeEach(() => {
    iniciarSesion('admin@duoc.cl')
  })

  it('create envía POST con el token y actualiza la lista local', async () => {
    const r = await categoryService.create({ name: 'Jardín y Riego', icon: '🌱', description: 'Mangueras' })
    expect(r.ok).toBe(true)
    expect(r.category.id).toBe('jardin-y-riego')
    expect(categoryRepository.getById('jardin-y-riego').icon).toBe('🌱')
    expect(fakeDb().categories.some((c) => c.id === 'jardin-y-riego')).toBe(true)
    expect(fakeCalls()[0]).toMatchObject({ method: 'POST', path: '/categorias', body: { name: 'Jardín y Riego' } })
    expect(fakeCalls()[0].auth).toMatch(/^Bearer /)
  })

  it('create exige nombre y rechaza nombres repetidos (sin llamar al backend)', async () => {
    expect((await categoryService.create({ name: '' })).errors.name).toMatch(/obligatorio/)
    expect((await categoryService.create({ name: 'herramientas' })).errors.name).toMatch(/Ya existe/)
    expect(fakeCalls()).toHaveLength(0)
  })

  it('update envía PUT, cambia nombre e ícono y permite conservar el mismo nombre', async () => {
    const r = await categoryService.update('pinturas', { name: 'Pinturas y Barnices', icon: '🖌️', description: '' })
    expect(r.ok).toBe(true)
    expect(categoryRepository.getById('pinturas').name).toBe('Pinturas y Barnices')
    expect(fakeCalls()[0]).toMatchObject({ method: 'PUT', path: '/categorias/pinturas' })
    expect((await categoryService.update('pinturas', { name: 'Pinturas y Barnices' })).ok).toBe(true)
  })

  it('update falla si la categoría no existe', async () => {
    expect((await categoryService.update('nada', { name: 'X' })).errors.general).toBeDefined()
  })

  it('no elimina categorías que aún tienen productos', async () => {
    const r = await categoryService.remove('herramientas')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/producto/)
  })

  it('elimina una categoría vacía con DELETE', async () => {
    await categoryService.create({ name: 'Vacía' })
    expect((await categoryService.remove('vacia')).ok).toBe(true)
    expect(categoryRepository.getById('vacia')).toBeNull()
    expect(fakeDb().categories.some((c) => c.id === 'vacia')).toBe(false)
    expect(fakeCalls().at(-1)).toMatchObject({ method: 'DELETE', path: '/categorias/vacia' })
    expect((await categoryService.remove('vacia')).ok).toBe(false)
  })

  it('muestra el error del backend cuando rechaza (409 por nombre repetido que el navegador no conocía)', async () => {
    fakeDb().categories.push({ id: 'oculta', name: 'Oculta', icon: '📦', description: '' }) // el navegador aún no la ve
    const r = await categoryService.create({ name: 'Oculta' })
    expect(r.ok).toBe(false)
    expect(r.errors.name).toMatch(/Ya existe/)
  })

  it('un Vendedor no puede crear categorías: el backend responde 403 y el servicio lo informa', async () => {
    iniciarSesion('vendedor@profesor.duoc.cl')
    const r = await categoryService.create({ name: 'Nueva' })
    expect(r).toMatchObject({ ok: false, status: 403 })
    expect(r.errors.general).toMatch(/permiso/)
  })
})
