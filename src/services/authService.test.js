import { describe, expect, it } from 'vitest'
import { storage } from '../data/storage'
import { fakeCalls, fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
import { authService, can, canAccessAdmin } from './authService'

describe('authService (login contra el backend con JWT)', () => {
  it('inicia sesión con credenciales correctas y guarda token y usuario', async () => {
    const resultado = await authService.login('admin@duoc.cl', 'admin123')
    expect(resultado.ok).toBe(true)
    expect(resultado.user.role).toBe('Administrador')
    expect(resultado.user.password).toBeUndefined() // el backend nunca envía la contraseña
    expect(authService.getSessionUser().run).toBe('111111111')
    expect(storage.get('session').token).toMatch(/^fake-jwt\./)
  })

  it('llama a POST /auth/login con el correo en minúsculas', async () => {
    await authService.login('ADMIN@duoc.cl', 'admin123')
    expect(fakeCalls()[0]).toMatchObject({
      method: 'POST',
      path: '/auth/login',
      body: { email: 'admin@duoc.cl', password: 'admin123' },
    })
  })

  it('rechaza contraseña incorrecta o usuario inexistente (el backend responde 401)', async () => {
    expect((await authService.login('admin@duoc.cl', 'mala')).message).toMatch(/incorrectos/)
    expect((await authService.login('nadie@gmail.com', 'admin123')).ok).toBe(false)
    expect(authService.getSessionUser()).toBeNull()
  })

  it('valida el formato antes de llamar al backend', async () => {
    expect((await authService.login('', 'abcd')).message).toMatch(/obligatorio/)
    expect((await authService.login('x@hotmail.com', 'abcd')).message).toMatch(/Solo se permiten/)
    expect((await authService.login('admin@duoc.cl', 'a')).message).toMatch(/entre 4 y 10/)
    expect(fakeCalls()).toHaveLength(0)
  })

  it('informa si el servidor no responde', async () => {
    fakeDb().offline = true
    const resultado = await authService.login('admin@duoc.cl', 'admin123')
    expect(resultado.ok).toBe(false)
    expect(resultado.message).toMatch(/comunicarse con el servidor/)
  })

  it('cierra la sesión', async () => {
    await authService.login('admin@duoc.cl', 'admin123')
    authService.logout()
    expect(authService.getSessionUser()).toBeNull()
  })

  it('descarta la sesión si el token ya venció', () => {
    iniciarSesion('maria.rojas@gmail.com')
    storage.set('session', { ...storage.get('session'), expiresAt: Date.now() - 1000 })
    expect(authService.getSessionUser()).toBeNull()
    expect(localStorage.getItem('lm_session')).toBeNull()
  })

  it('refreshSession confirma el token con GET /auth/me y actualiza los datos del usuario', async () => {
    iniciarSesion('maria.rojas@gmail.com')
    fakeDb().users.find((u) => u.run === '123456785').name = 'María José'
    const usuario = await authService.refreshSession()
    expect(usuario.name).toBe('María José')
    expect(authService.getSessionUser().name).toBe('María José')
    expect(fakeCalls().at(-1)).toMatchObject({ method: 'GET', path: '/auth/me' })
    expect(fakeCalls().at(-1).auth).toMatch(/^Bearer fake-jwt\./)
  })

  it('refreshSession cierra la sesión si el backend responde 401 (usuario eliminado)', async () => {
    iniciarSesion('maria.rojas@gmail.com')
    fakeDb().users = fakeDb().users.filter((u) => u.run !== '123456785')
    expect(await authService.refreshSession()).toBeNull()
    expect(authService.getSessionUser()).toBeNull()
  })

  it('refreshSession mantiene la sesión si no hay conexión', async () => {
    iniciarSesion('maria.rojas@gmail.com')
    fakeDb().offline = true
    expect((await authService.refreshSession()).run).toBe('123456785')
  })

  it('refreshSession sin sesión no llama al backend', async () => {
    expect(await authService.refreshSession()).toBeNull()
    expect(fakeCalls()).toHaveLength(0)
  })

  it('canAccessAdmin: solo Administrador y Vendedor', () => {
    expect(canAccessAdmin({ role: 'Administrador' })).toBe(true)
    expect(canAccessAdmin({ role: 'Vendedor' })).toBe(true)
    expect(canAccessAdmin({ role: 'Cliente' })).toBe(false)
    expect(canAccessAdmin(null)).toBe(false)
  })

  it('can: el Vendedor solo ve productos (lista y detalle) y órdenes', () => {
    const vendedor = { role: 'Vendedor' }
    expect(can(vendedor, 'products')).toBe(true)
    expect(can(vendedor, 'orders')).toBe(true)
    for (const area of ['dashboard', 'products-manage', 'categories', 'users', 'reports', 'profile']) {
      expect(can(vendedor, area)).toBe(false)
    }
  })

  it('can: el Administrador tiene acceso total y el Cliente a ninguna área del panel', () => {
    for (const area of ['dashboard', 'orders', 'products', 'products-manage', 'categories', 'users', 'reports', 'profile']) {
      expect(can({ role: 'Administrador' }, area)).toBe(true)
      expect(can({ role: 'Cliente' }, area)).toBe(false)
    }
    expect(can(null, 'dashboard')).toBe(false)
  })
})
