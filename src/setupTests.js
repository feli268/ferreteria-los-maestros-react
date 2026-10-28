// Configuración común de las pruebas (Vitest + React Testing Library).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { resetDatabase } from './data/db'

// jsdom no implementa scrollTo (la tienda lo usa al cambiar de página).
window.scrollTo = vi.fn()
window.print = vi.fn()

// Cada prueba parte con la "base de datos" simulada en su estado inicial,
// sin sesión ni carrito guardados.
beforeEach(() => {
  window.localStorage.clear()
  resetDatabase()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
