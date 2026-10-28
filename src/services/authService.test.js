import { describe, expect, it } from 'vitest'
import { userRepository } from '../data/db'
import { authService, can, canAccessAdmin } from './authService'

describe('authService', () => {
  it('inicia sesión con credenciales correctas y guarda la sesión', () => {
    const resultado = authService.login('admin@duoc.cl', 'admin123')
    expect(resultado.ok).toBe(true)
    expect(resultado.user.role).toBe('Administrador')
    expect(authService.getSessionUser().run).toBe('111111111')
  })

  it('el correo no distingue mayúsculas', () => {
    expect(authService.login('ADMIN@duoc.cl', 'admin123').ok).toBe(true)
  })

  it('rechaza contraseña incorrecta o usuario inexistente (la entrega 1 aceptaba cualquiera)', () => {
    expect(authService.login('admin@duoc.cl', 'mala').message).toMatch(/incorrectos/)
    expect(authService.login('nadie@gmail.com', 'admin123').ok).toBe(false)
    expect(authService.getSessionUser()).toBeNull()
  })

  it('valida el formato antes de buscar al usuario', () => {
    expect(authService.login('', 'abcd').message).toMatch(/obligatorio/)
    expect(authService.login('x@hotmail.com', 'abcd').message).toMatch(/Solo se permiten/)
    expect(authService.login('admin@duoc.cl', 'a').message).toMatch(/entre 4 y 10/)
  })

  it('cierra la sesión', () => {
    authService.login('admin@duoc.cl', 'admin123')
    authService.logout()
    expect(authService.getSessionUser()).toBeNull()
  })

  it('descarta la sesión si el usuario fue eliminado', () => {
    authService.login('maria.rojas@gmail.com', 'maria123')
    userRepository.remove('123456785')
    expect(authService.getSessionUser()).toBeNull()
    expect(localStorage.getItem('lm_session')).toBeNull()
  })

  it('canAccessAdmin: solo Administrador y Vendedor', () => {
    expect(canAccessAdmin({ role: 'Administrador' })).toBe(true)
    expect(canAccessAdmin({ role: 'Vendedor' })).toBe(true)
    expect(canAccessAdmin({ role: 'Cliente' })).toBe(false)
    expect(canAccessAdmin(null)).toBe(false)
  })

  it('can: el Vendedor no administra usuarios ni categorías', () => {
    const vendedor = { role: 'Vendedor' }
    expect(can(vendedor, 'products')).toBe(true)
    expect(can(vendedor, 'orders')).toBe(true)
    expect(can(vendedor, 'users')).toBe(false)
    expect(can(vendedor, 'categories')).toBe(false)
    expect(can({ role: 'Administrador' }, 'users')).toBe(true)
    expect(can({ role: 'Cliente' }, 'dashboard')).toBe(false)
    expect(can(null, 'dashboard')).toBe(false)
  })
})
