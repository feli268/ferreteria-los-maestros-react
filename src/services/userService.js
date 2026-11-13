// CRUD y validación de usuarios (registro público y mantenedor del administrador).
import { authApi, usuariosApi } from '../api'
import { ROLES } from '../data/catalogs'
import { orderRepository, userRepository } from '../data/db'
import {
  cleanRun,
  collectErrors,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateRegionComuna,
  validateRequired,
  validateRun,
} from '../utils/validators'
import { falla } from './apiResult'

/**
 * Valida el formulario de usuario. Devuelve { campo: mensaje } (vacío si todo está bien).
 * @param {object} data valores del formulario
 * @param {{mode?:'create'|'edit', originalRun?:string}} options
 */
export function validateUserForm(data, { mode = 'create', originalRun = null } = {}) {
  const resultados = {
    name: validateRequired(data.name, 'El nombre', 50),
    lastname: validateRequired(data.lastname, 'Los apellidos', 100),
    email: validateEmail(data.email),
    region: validateRegionComuna(data.region, data.comuna),
    address: validateRequired(data.address, 'La dirección', 300),
  }

  if (mode === 'create') {
    resultados.run = validateRun(data.run)
    resultados.password = validatePassword(data.password)
    resultados.passwordConfirm = validatePasswordConfirm(data.password, data.passwordConfirm)
  } else if (data.password) {
    // En edición la contraseña es opcional: solo se valida si se quiere cambiar.
    resultados.password = validatePassword(data.password)
    resultados.passwordConfirm = validatePasswordConfirm(data.password, data.passwordConfirm)
  }

  const errores = collectErrors(resultados)

  // Reglas que dependen de los datos ya guardados (unicidad).
  const run = mode === 'create' ? cleanRun(data.run) : originalRun
  if (!errores.run && mode === 'create' && userRepository.getById(run)) {
    errores.run = 'Ya existe un usuario registrado con este RUN.'
  }
  if (!errores.email) {
    const correo = String(data.email).trim().toLowerCase()
    const repetido = userRepository.find((u) => u.email.toLowerCase() === correo && u.run !== run)
    if (repetido.length > 0) errores.email = 'Este correo ya está registrado.'
  }
  return errores
}

function normalizar(data) {
  return {
    name: data.name.trim(),
    lastname: data.lastname.trim(),
    email: data.email.trim().toLowerCase(),
    region: data.region,
    comuna: data.comuna,
    address: data.address.trim(),
  }
}

/** Cuerpo que recibe el backend (UsuarioRequest). La contraseña solo se envía si se escribió una. */
function cuerpo(data, { run, role } = {}) {
  const body = { ...normalizar(data), run: run ?? cleanRun(data.run) }
  if (data.password) {
    body.password = data.password
    body.passwordConfirm = data.passwordConfirm
  }
  if (role !== undefined) body.role = role
  return body
}

export const userService = {
  /** Registro público (POST /api/v1/auth/registro): el backend siempre crea un Cliente. */
  async register(data) {
    const errors = validateUserForm(data, { mode: 'create' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      return { ok: true, user: await authApi.registro(cuerpo(data)) }
    } catch (error) {
      return falla(error)
    }
  },

  /** Alta desde el mantenedor de usuarios (POST /api/v1/usuarios): permite elegir rol. */
  async create(data) {
    const errors = validateUserForm(data, { mode: 'create' })
    if (!Object.values(ROLES).includes(data.role)) errors.role = 'Selecciona un rol válido.'
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const user = userRepository.upsert(await usuariosApi.crear(cuerpo(data, { role: data.role })))
      return { ok: true, user }
    } catch (error) {
      return falla(error)
    }
  },

  /** Edición desde el mantenedor (PUT /api/v1/usuarios/{run}). */
  async update(run, data) {
    const existente = userRepository.getById(run)
    if (!existente) return { ok: false, errors: { general: 'El usuario no existe.' } }
    const errors = validateUserForm(data, { mode: 'edit', originalRun: run })
    if (data.role !== undefined && !Object.values(ROLES).includes(data.role)) {
      errors.role = 'Selecciona un rol válido.'
    } else if (existente.role === ROLES.ADMIN && data.role !== undefined && data.role !== ROLES.ADMIN) {
      // No se puede quitar el rol al último administrador: nadie podría administrar la tienda.
      const admins = userRepository.find((u) => u.role === ROLES.ADMIN)
      if (admins.length <= 1) errors.role = 'Debe existir al menos un administrador.'
    }
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const user = userRepository.upsert(await usuariosApi.actualizar(run, cuerpo(data, { run, role: data.role })))
      return { ok: true, user }
    } catch (error) {
      return falla(error)
    }
  },

  /**
   * DELETE /api/v1/usuarios/{run}.
   * No se puede eliminar al último administrador ni a quien tiene la sesión abierta.
   */
  async remove(run, currentUserRun = null) {
    const usuario = userRepository.getById(run)
    if (!usuario) return { ok: false, message: 'El usuario no existe.' }
    if (currentUserRun && usuario.run === currentUserRun) {
      return { ok: false, message: 'No puedes eliminar tu propio usuario mientras tienes la sesión abierta.' }
    }
    if (usuario.role === ROLES.ADMIN) {
      const admins = userRepository.find((u) => u.role === ROLES.ADMIN)
      if (admins.length <= 1) return { ok: false, message: 'Debe existir al menos un administrador.' }
    }
    try {
      await usuariosApi.eliminar(run)
      userRepository.drop(run)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: falla(error).message }
    }
  },

  /** Edición del propio perfil (PUT /api/v1/auth/me): el backend nunca cambia el rol por esta vía. */
  async updateProfile(run, data) {
    const errors = validateUserForm(data, { mode: 'edit', originalRun: run })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const user = await authApi.actualizarPerfil(cuerpo(data, { run }))
      if (userRepository.getById(user.run)) userRepository.upsert(user) // mantiene al día la lista de usuarios
      return { ok: true, user }
    } catch (error) {
      return falla(error)
    }
  },

  /** Historial de compras de un usuario (más recientes primero). */
  getPurchaseHistory(run) {
    return orderRepository
      .find((o) => o.userRun === run)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}
