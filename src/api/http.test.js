import { describe, expect, it, vi } from 'vitest'
import { storage } from '../data/storage'
import { fakeCalls, fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
import { boletasApi, categoriasApi, productosApi, usuariosApi } from './index'
import { ApiError, onUnauthorized, request } from './http'

describe('cliente HTTP (fetch + JWT)', () => {
  it('antepone la URL del backend y la versión /api/v1', async () => {
    const espia = vi.spyOn(globalThis, 'fetch')
    await request('/categorias')
    expect(espia.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/categorias')
  })

  it('no manda Authorization sin sesión y sí manda "Bearer <token>" con sesión', async () => {
    await productosApi.listar()
    expect(fakeCalls()[0].auth).toBeNull()
    iniciarSesion('admin@duoc.cl')
    await productosApi.listar()
    expect(fakeCalls()[1].auth).toBe(`Bearer ${storage.get('session').token}`)
  })

  it('envía el cuerpo como JSON', async () => {
    iniciarSesion('admin@duoc.cl')
    await categoriasApi.crear({ name: 'Nueva', icon: '🆕', description: '' })
    expect(fakeCalls()[0].body).toEqual({ name: 'Nueva', icon: '🆕', description: '' })
  })

  it('un error HTTP se convierte en ApiError con estado, mensaje y errores por campo', async () => {
    const error = await usuariosApi.crear({ run: '111111111' }).catch((e) => e) // sin sesión → 401
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)

    iniciarSesion('admin@duoc.cl')
    const invalido = await usuariosApi.crear({ run: '111111111', name: '', lastname: '' }).catch((e) => e)
    expect(invalido.status).toBe(400)
    expect(invalido.errors.name).toBeDefined()
  })

  it('403 cuando el rol no tiene permiso', async () => {
    iniciarSesion('vendedor@profesor.duoc.cl')
    const error = await productosApi.eliminar('MC001').catch((e) => e)
    expect(error.status).toBe(403)
  })

  it('404 para un recurso que no existe', async () => {
    const error = await productosApi.obtener('NOEXISTE').catch((e) => e)
    expect(error.status).toBe(404)
    expect(error.message).toMatch(/NOEXISTE/)
  })

  it('204 sin contenido devuelve null', async () => {
    iniciarSesion('admin@duoc.cl')
    await categoriasApi.crear({ name: 'Temporal', icon: '⏳', description: '' })
    expect(await categoriasApi.eliminar('temporal')).toBeNull()
  })

  it('si no hay conexión lanza ApiError con estado 0 y un mensaje claro', async () => {
    fakeDb().offline = true
    const error = await boletasApi.listar().catch((e) => e)
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/comunicarse con el servidor/)
  })

  it('un 401 con token guardado avisa para cerrar la sesión; sin token no', async () => {
    const aviso = vi.fn()
    onUnauthorized(aviso)
    await boletasApi.listar().catch(() => {})
    expect(aviso).not.toHaveBeenCalled()
    iniciarSesion('admin@duoc.cl')
    fakeDb().users = [] // el token ya no corresponde a nadie
    await boletasApi.listar().catch(() => {})
    expect(aviso).toHaveBeenCalledTimes(1)
    onUnauthorized(null)
  })

  it('cada recurso usa el método y la ruta REST correctos', async () => {
    iniciarSesion('admin@duoc.cl')
    await categoriasApi.listar()
    await productosApi.obtener('MC001')
    await usuariosApi.listar()
    await boletasApi.obtener('20260928-001')
    expect(fakeCalls().map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /categorias',
      'GET /productos/MC001',
      'GET /usuarios',
      'GET /boletas/20260928-001',
    ])
  })
})
