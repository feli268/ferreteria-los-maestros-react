// Sesión de usuario: inicia sesión contra el backend (JWT) y guarda el token en el navegador.
import { ApiError } from '../api/http'
import { authApi } from '../api'
import { ROLES } from '../data/catalogs'
import { storage } from '../data/storage'
import { validateEmail, validatePassword } from '../utils/validators'

const SESSION_KEY = 'session'

export const authService = {
  /**
   * Inicia sesión con correo y contraseña (POST /api/v1/auth/login).
   * Guarda { token, user, expiresAt } en localStorage.
   * @returns {Promise<{ok:true, user:object} | {ok:false, message:string}>}
   */
  async login(email, password) {
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) return { ok: false, message: emailCheck.message }
    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) return { ok: false, message: passwordCheck.message }

    try {
      const respuesta = await authApi.login(String(email).trim().toLowerCase(), password)
      storage.set(SESSION_KEY, {
        token: respuesta.token,
        user: respuesta.user,
        expiresAt: Date.now() + Number(respuesta.expiresIn ?? 0) * 1000,
      })
      return { ok: true, user: respuesta.user }
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      return {
        ok: false,
        message: error.status === 401 ? 'Correo o contraseña incorrectos.' : error.message,
      }
    }
  },

  logout() {
    storage.remove(SESSION_KEY)
  },

  /** Usuario con sesión activa (o null). Si el token ya venció, la sesión se descarta. */
  getSessionUser() {
    const session = storage.get(SESSION_KEY)
    if (!session?.token || !session.user) return null
    if (session.expiresAt && Date.now() > session.expiresAt) {
      storage.remove(SESSION_KEY)
      return null
    }
    return session.user
  },

  /** Guarda los datos actualizados del usuario (p. ej. tras editar su perfil). */
  setSessionUser(user) {
    const session = storage.get(SESSION_KEY)
    if (session?.token) storage.set(SESSION_KEY, { ...session, user })
  },

  /**
   * Revisa con el backend que el token siga siendo válido (GET /api/v1/auth/me)
   * y trae los datos actuales del usuario. Si no hay conexión, se mantiene la sesión.
   */
  async refreshSession() {
    if (!authService.getSessionUser()) return null
    try {
      const user = await authApi.yo()
      authService.setSessionUser(user)
      return user
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      if (error.status === 401) {
        authService.logout() // el token ya no sirve (venció o el usuario fue eliminado)
        return null
      }
      return authService.getSessionUser() // sin conexión u otro error: se mantiene la sesión
    }
  },
}

/** ¿Puede entrar al panel de administración? (Administrador y Vendedor) */
export function canAccessAdmin(user) {
  return !!user && (user.role === ROLES.ADMIN || user.role === ROLES.SELLER)
}

/**
 * Permisos por rol (solo para mostrar u ocultar opciones; quien manda es el backend con Spring Security).
 *  - Administrador: todo el panel.
 *  - Vendedor: únicamente lista y detalle de productos, y lista y detalle de órdenes.
 *  - Cliente: solo la tienda.
 * "products" = ver lista y detalle · "products-manage" = crear, editar, eliminar, stock crítico y reporte.
 */
const PERMISSIONS = {
  [ROLES.ADMIN]: ['dashboard', 'orders', 'products', 'products-manage', 'categories', 'users', 'reports', 'profile'],
  [ROLES.SELLER]: ['orders', 'products'],
  [ROLES.CLIENT]: [],
}

export function can(user, area) {
  if (!user) return false
  return (PERMISSIONS[user.role] ?? []).includes(area)
}
