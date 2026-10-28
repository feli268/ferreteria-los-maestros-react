import { describe, expect, it } from 'vitest'
import { userRepository } from '../data/db'
import { userService, validateUserForm } from './userService'

const datosValidos = {
  run: '12.345.678-5',
  name: 'Ana',
  lastname: 'Pérez Soto',
  email: 'ana@gmail.com',
  password: 'abcd',
  passwordConfirm: 'abcd',
  region: 'Región de Coquimbo',
  comuna: 'La Serena',
  address: 'Calle 1 #23',
}

// El RUN 123456785 ya existe en los datos iniciales: se usa otro RUN válido.
const nuevo = { ...datosValidos, run: '10.000.000-8' }

describe('userService', () => {
  it('register crea un Cliente con el RUN limpio', () => {
    const r = userService.register(nuevo)
    expect(r.ok).toBe(true)
    expect(r.user.role).toBe('Cliente')
    expect(r.user.run).toBe('100000008')
    expect(userRepository.getById('100000008')).not.toBeNull()
  })

  it('register no deja elegir rol aunque se envíe', () => {
    const r = userService.register({ ...nuevo, role: 'Administrador' })
    expect(r.user.role).toBe('Cliente')
  })

  it('devuelve un mensaje por cada campo inválido', () => {
    const errores = validateUserForm({ ...nuevo, name: '', email: 'x@yahoo.com', passwordConfirm: 'zzzz' })
    expect(Object.keys(errores).sort()).toEqual(['email', 'name', 'passwordConfirm'])
  })

  it('no permite RUN ni correo repetidos', () => {
    const r1 = userService.register({ ...nuevo, run: '123456785', email: 'otro@gmail.com' })
    expect(r1.errors.run).toMatch(/Ya existe/)
    const r2 = userService.register({ ...nuevo, email: 'ADMIN@duoc.cl' })
    expect(r2.errors.email).toMatch(/ya está registrado/)
  })

  it('create (admin) exige un rol válido', () => {
    expect(userService.create({ ...nuevo, role: 'Jefe' }).errors.role).toBeDefined()
    const r = userService.create({ ...nuevo, role: 'Vendedor' })
    expect(r.ok).toBe(true)
    expect(r.user.role).toBe('Vendedor')
  })

  it('update cambia datos sin pedir contraseña y permite conservar el mismo correo', () => {
    const r = userService.update('189998880', {
      name: 'Felipe Andrés',
      lastname: 'Cortés',
      email: 'contratista@gmail.com',
      region: 'Región de Coquimbo',
      comuna: 'Coquimbo',
      address: 'Nueva dirección 99',
      role: 'Cliente',
    })
    expect(r.ok).toBe(true)
    expect(userRepository.getById('189998880').name).toBe('Felipe Andrés')
    expect(userRepository.getById('189998880').password).toBe('cliente1')
  })

  it('update cambia la contraseña solo si se escribe una nueva válida', () => {
    const base = { ...userRepository.getById('189998880') }
    expect(userService.update('189998880', { ...base, password: 'abc', passwordConfirm: 'abc' }).ok).toBe(false)
    const r = userService.update('189998880', { ...base, password: 'nueva1', passwordConfirm: 'nueva1' })
    expect(r.ok).toBe(true)
    expect(userRepository.getById('189998880').password).toBe('nueva1')
  })

  it('update de un usuario inexistente falla con mensaje', () => {
    expect(userService.update('999', {}).errors.general).toBeDefined()
  })

  it('updateProfile no modifica el rol', () => {
    const base = { ...userRepository.getById('222222222'), role: 'Administrador' }
    userService.updateProfile('222222222', base)
    expect(userRepository.getById('222222222').role).toBe('Vendedor')
  })

  it('remove elimina usuarios pero protege la sesión propia y al último administrador', () => {
    expect(userService.remove('123456785').ok).toBe(true)
    expect(userService.remove('123456785').message).toMatch(/no existe/)
    expect(userService.remove('111111111', '111111111').message).toMatch(/propio usuario/)
    expect(userService.remove('111111111', '222222222').message).toMatch(/al menos un administrador/)
  })

  it('getPurchaseHistory lista los pedidos del usuario, el más reciente primero', () => {
    const historial = userService.getPurchaseHistory('189998880')
    expect(historial.map((o) => o.number)).toEqual(['20261008-001', '20260928-001'])
    expect(userService.getPurchaseHistory('222222222')).toEqual([])
  })
})
