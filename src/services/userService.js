// CRUD y validación de usuarios (registro público y mantenedor del administrador).
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

export const userService = {
  /** Registro público: siempre crea un Cliente. */
  register(data) {
    const errors = validateUserForm(data, { mode: 'create' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const user = userRepository.create({
      ...normalizar(data),
      run: cleanRun(data.run),
      password: data.password,
      role: ROLES.CLIENT,
    })
    return { ok: true, user }
  },

  /** Alta desde el mantenedor de usuarios (permite elegir rol). */
  create(data) {
    const errors = validateUserForm(data, { mode: 'create' })
    if (!Object.values(ROLES).includes(data.role)) errors.role = 'Selecciona un rol válido.'
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const user = userRepository.create({
      ...normalizar(data),
      run: cleanRun(data.run),
      password: data.password,
      role: data.role,
    })
    return { ok: true, user }
  },

  update(run, data) {
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
    const cambios = { ...normalizar(data) }
    if (data.role !== undefined) cambios.role = data.role
    if (data.password) cambios.password = data.password
    const user = userRepository.update(run, cambios)
    return { ok: true, user }
  },

  /** No se puede eliminar al último administrador ni a quien tiene la sesión abierta. */
  remove(run, currentUserRun = null) {
    const usuario = userRepository.getById(run)
    if (!usuario) return { ok: false, message: 'El usuario no existe.' }
    if (currentUserRun && usuario.run === currentUserRun) {
      return { ok: false, message: 'No puedes eliminar tu propio usuario mientras tienes la sesión abierta.' }
    }
    if (usuario.role === ROLES.ADMIN) {
      const admins = userRepository.find((u) => u.role === ROLES.ADMIN)
      if (admins.length <= 1) return { ok: false, message: 'Debe existir al menos un administrador.' }
    }
    userRepository.remove(run)
    return { ok: true }
  },

  /** Edición del propio perfil: sin cambio de rol. */
  updateProfile(run, data) {
    return userService.update(run, { ...data, role: undefined })
  },

  /** Historial de compras de un usuario (más recientes primero). */
  getPurchaseHistory(run) {
    return orderRepository
      .find((o) => o.userRun === run)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}
