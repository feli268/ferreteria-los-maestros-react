// Sesión de usuario sobre la base de datos simulada.
import { ROLES } from '../data/catalogs'
import { userRepository } from '../data/db'
import { storage } from '../data/storage'
import { cleanRun, validateEmail, validatePassword } from '../utils/validators'

const SESSION_KEY = 'session'

export const authService = {
  /**
   * Inicia sesión con correo y contraseña.
   * @returns {{ok:true, user:object} | {ok:false, message:string}}
   */
  login(email, password) {
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) return { ok: false, message: emailCheck.message }
    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) return { ok: false, message: passwordCheck.message }

    const correo = String(email).trim().toLowerCase()
    const user = userRepository.find((u) => u.email.toLowerCase() === correo)[0]
    if (!user || user.password !== password) {
      return { ok: false, message: 'Correo o contraseña incorrectos.' }
    }
    storage.set(SESSION_KEY, { run: user.run })
    return { ok: true, user }
  },

  logout() {
    storage.remove(SESSION_KEY)
  },

  /** Usuario con sesión activa (o null). Si fue eliminado, la sesión se descarta. */
  getSessionUser() {
    const session = storage.get(SESSION_KEY)
    if (!session?.run) return null
    const user = userRepository.getById(cleanRun(session.run))
    if (!user) {
      storage.remove(SESSION_KEY)
      return null
    }
    return user
  },
}

/** ¿Puede entrar al panel de administración? (Administrador y Vendedor) */
export function canAccessAdmin(user) {
  return !!user && (user.role === ROLES.ADMIN || user.role === ROLES.SELLER)
}

/** Permisos por rol: el Vendedor solo gestiona inventario y pedidos. */
const PERMISSIONS = {
  [ROLES.ADMIN]: ['dashboard', 'orders', 'products', 'categories', 'users', 'reports', 'profile'],
  [ROLES.SELLER]: ['dashboard', 'orders', 'products', 'profile'],
  [ROLES.CLIENT]: [],
}

export function can(user, area) {
  if (!user) return false
  return (PERMISSIONS[user.role] ?? []).includes(area)
}
