// Estado global de la sesión: quién está conectado y cómo entrar / salir.
// La sesión es un token JWT que entrega el backend; se guarda en localStorage junto con los datos del usuario.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onUnauthorized } from '../api/http'
import { clearPrivateData } from '../data/db'
import { authService, can, canAccessAdmin } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSessionUser())

  const cerrarSesion = useCallback(() => {
    authService.logout()
    clearPrivateData() // al salir no queda en memoria la lista de usuarios ni de órdenes
    setUser(null)
  }, [])

  // Si el backend rechaza el token (venció o el usuario fue eliminado), se cierra la sesión sola.
  useEffect(() => {
    onUnauthorized(cerrarSesion)
    return () => onUnauthorized(null)
  }, [cerrarSesion])

  // Al abrir la aplicación con una sesión guardada, se confirma con el backend (GET /auth/me)
  // y se actualizan los datos del usuario (por ejemplo, si le cambiaron el rol).
  useEffect(() => {
    if (!authService.getSessionUser()) return undefined
    let activo = true
    authService.refreshSession().then((actual) => {
      if (!activo) return
      setUser((previo) => (JSON.stringify(previo) === JSON.stringify(actual) ? previo : actual))
    })
    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const resultado = await authService.login(email, password)
    if (resultado.ok) {
      clearPrivateData() // datos privados de una sesión anterior (si la hubo)
      setUser(resultado.user)
    }
    return resultado
  }, [])

  /** Actualiza el usuario de la sesión (p. ej. después de editar su perfil). */
  const updateUser = useCallback((actualizado) => {
    authService.setSessionUser(actualizado)
    setUser(actualizado)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isStaff: canAccessAdmin(user),
      can: (area) => can(user, area),
      login,
      logout: cerrarSesion,
      updateUser,
    }),
    [user, login, cerrarSesion, updateUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return contexto
}
