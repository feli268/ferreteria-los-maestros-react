import { beforeEach, describe, expect, it } from 'vitest'
import { userRepository } from '../data/db'
import { fakeCalls, fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
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
const claveEnServidor = (run) => fakeDb().users.find((u) => u.run === run)?.password

describe('userService (contra /api/v1/auth y /api/v1/usuarios)', () => {
  describe('registro público (sin sesión)', () => {
    it('register envía POST /auth/registro y crea un Cliente con el RUN limpio', async () => {
      const r = await userService.register(nuevo)
      expect(r.ok).toBe(true)
      expect(r.user.role).toBe('Cliente')
      expect(r.user.run).toBe('100000008')
      expect(r.user.password).toBeUndefined()
      expect(fakeDb().users.some((u) => u.run === '100000008')).toBe(true)
      expect(fakeCalls()[0]).toMatchObject({ method: 'POST', path: '/auth/registro', body: { run: '100000008' } })
      expect(fakeCalls()[0].auth).toBeNull() // el registro es público: no lleva token
    })

    it('register no deja elegir rol aunque se envíe', async () => {
      const r = await userService.register({ ...nuevo, role: 'Administrador' })
      expect(r.user.role).toBe('Cliente')
    })

    it('devuelve un mensaje por cada campo inválido (sin llamar al backend)', async () => {
      const errores = validateUserForm({ ...nuevo, name: '', email: 'x@yahoo.com', passwordConfirm: 'zzzz' })
      expect(Object.keys(errores).sort()).toEqual(['email', 'name', 'passwordConfirm'])
      const r = await userService.register({ ...nuevo, name: '' })
      expect(r.ok).toBe(false)
      expect(fakeCalls()).toHaveLength(0)
    })

    it('el RUN y el correo repetidos los detecta el backend (409) aunque el navegador no vea los usuarios', async () => {
      const r1 = await userService.register({ ...nuevo, run: '123456785', email: 'otro@gmail.com' })
      expect(r1.ok).toBe(false)
      expect(r1.errors.run).toMatch(/Ya existe/)
      const r2 = await userService.register({ ...nuevo, email: 'ADMIN@duoc.cl' })
      expect(r2.errors.email).toMatch(/ya está registrado/)
    })

    it('informa si el servidor no responde', async () => {
      fakeDb().offline = true
      const r = await userService.register(nuevo)
      expect(r.ok).toBe(false)
      expect(r.errors.general).toMatch(/comunicarse con el servidor/)
    })
  })

  describe('mantenedor del administrador', () => {
    beforeEach(() => {
      iniciarSesion('admin@duoc.cl')
    })

    it('create (admin) exige un rol válido y envía POST /usuarios con token', async () => {
      expect((await userService.create({ ...nuevo, role: 'Jefe' })).errors.role).toBeDefined()
      const r = await userService.create({ ...nuevo, role: 'Vendedor' })
      expect(r.ok).toBe(true)
      expect(r.user.role).toBe('Vendedor')
      expect(userRepository.getById('100000008')).not.toBeNull()
      expect(fakeCalls().at(-1)).toMatchObject({ method: 'POST', path: '/usuarios', body: { role: 'Vendedor' } })
      expect(fakeCalls().at(-1).auth).toMatch(/^Bearer /)
    })

    it('update cambia datos sin pedir contraseña (la clave queda igual en el servidor)', async () => {
      const r = await userService.update('189998880', {
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
      expect(claveEnServidor('189998880')).toBe('cliente1')
      expect(fakeCalls().at(-1).body.password).toBeUndefined() // no se envía contraseña si no se escribió
    })

    it('update cambia la contraseña solo si se escribe una nueva válida', async () => {
      const base = { ...userRepository.getById('189998880') }
      expect((await userService.update('189998880', { ...base, password: 'abc', passwordConfirm: 'abc' })).ok).toBe(false)
      const r = await userService.update('189998880', { ...base, password: 'nueva1', passwordConfirm: 'nueva1' })
      expect(r.ok).toBe(true)
      expect(claveEnServidor('189998880')).toBe('nueva1')
    })

    it('update de un usuario inexistente falla con mensaje', async () => {
      expect((await userService.update('999', {})).errors.general).toBeDefined()
    })

    it('updateProfile envía PUT /auth/me y no modifica el rol', async () => {
      iniciarSesion('vendedor@profesor.duoc.cl')
      const base = { ...fakeDb().users.find((u) => u.run === '222222222'), role: 'Administrador', password: '', passwordConfirm: '' }
      const r = await userService.updateProfile('222222222', { ...base, address: 'Otra calle 5' })
      expect(r.ok).toBe(true)
      expect(r.user.role).toBe('Vendedor')
      expect(r.user.address).toBe('Otra calle 5')
      expect(fakeDb().users.find((u) => u.run === '222222222').role).toBe('Vendedor')
      expect(fakeCalls().at(-1)).toMatchObject({ method: 'PUT', path: '/auth/me' })
    })

    it('remove envía DELETE y protege la sesión propia y al último administrador', async () => {
      expect((await userService.remove('123456785')).ok).toBe(true)
      expect(userRepository.getById('123456785')).toBeNull()
      expect(fakeCalls().at(-1)).toMatchObject({ method: 'DELETE', path: '/usuarios/123456785' })
      expect((await userService.remove('123456785')).message).toMatch(/no existe/)
      expect((await userService.remove('111111111', '111111111')).message).toMatch(/propio usuario/)
      expect((await userService.remove('111111111', '222222222')).message).toMatch(/al menos un administrador/)
    })

    it('al eliminar un usuario sus compras quedan sin dueño en el backend (el historial se conserva)', async () => {
      await userService.remove('189998880')
      expect(fakeDb().orders.filter((o) => o.userRun === '189998880')).toHaveLength(0)
      expect(fakeDb().orders.some((o) => o.number === '20260928-001')).toBe(true)
    })

    it('getPurchaseHistory lista los pedidos del usuario, el más reciente primero', () => {
      const historial = userService.getPurchaseHistory('189998880')
      expect(historial.map((o) => o.number)).toEqual(['20261008-001', '20260928-001'])
      expect(userService.getPurchaseHistory('222222222')).toEqual([])
    })

    it('un Vendedor no puede administrar usuarios: el backend responde 403', async () => {
      iniciarSesion('vendedor@profesor.duoc.cl')
      const r = await userService.create({ ...nuevo, role: 'Vendedor' })
      expect(r).toMatchObject({ ok: false, status: 403 })
    })
  })
})
