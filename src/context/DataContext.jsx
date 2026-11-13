// Carga de datos desde el backend: decide qué listas hay que pedir según el rol de la sesión
// y avisa si todavía están cargando o si hubo un error de conexión.
//   - Todos:          categorías y productos (públicos).
//   - Vendedor:       + órdenes.
//   - Administrador:  + órdenes y usuarios.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { ROLES } from '../data/catalogs'
import { categoryRepository, orderRepository, productRepository, userRepository } from '../data/db'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

function repositoriosPara(user) {
  const publicos = [categoryRepository, productRepository]
  if (user?.role === ROLES.ADMIN) return [...publicos, orderRepository, userRepository]
  if (user?.role === ROLES.SELLER) return [...publicos, orderRepository]
  return publicos
}

function calcularEstado(repositorios) {
  if (repositorios.some((r) => r.status === 'error')) return 'error'
  if (repositorios.every((r) => r.status === 'ready')) return 'ready'
  return 'loading' // incluye los que aún no empiezan a cargar
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const rol = user?.role ?? null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const repositorios = useMemo(() => repositoriosPara(user), [rol])
  const [, redibujar] = useReducer((n) => n + 1, 0)

  // Se vuelve a calcular el estado cada vez que alguna de las listas cambia.
  useEffect(() => {
    const bajas = repositorios.map((r) => r.subscribe(redibujar))
    redibujar()
    return () => bajas.forEach((baja) => baja())
  }, [repositorios])

  // Pide al backend las listas que todavía no se han cargado (al abrir la app y al iniciar sesión).
  useEffect(() => {
    repositorios.forEach((r) => {
      if (r.status === 'idle') r.refresh()
    })
  }, [repositorios])

  const status = calcularEstado(repositorios)

  const retry = useCallback(() => {
    repositorios.forEach((r) => {
      if (r.status === 'error') r.refresh()
    })
  }, [repositorios])

  const value = useMemo(() => {
    const fallida = repositorios.find((r) => r.status === 'error')
    return {
      status,
      error: fallida?.error ?? null,
      message: fallida?.error?.message ?? '',
      retry,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, retry])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const contexto = useContext(DataContext)
  if (!contexto) throw new Error('useData debe usarse dentro de <DataProvider>.')
  return contexto
}
