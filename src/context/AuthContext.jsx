// Estado global de la sesión: quién está conectado y cómo entrar / salir.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { userRepository } from '../data/db'
import { authService, can, canAccessAdmin } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSessionUser())

  // Si el usuario cambia (p. ej. edita su perfil) o es eliminado, la sesión se actualiza sola.
  useEffect(() => userRepository.subscribe(() => setUser(authService.getSessionUser())), [])

  const login = useCallback((email, password) => {
    const resultado = authService.login(email, password)
    if (resultado.ok) setUser(resultado.user)
    return resultado
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isStaff: canAccessAdmin(user),
      can: (area) => can(user, area),
      login,
      logout,
    }),
    [user, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return contexto
}
