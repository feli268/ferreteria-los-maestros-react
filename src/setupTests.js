// Configuración común de las pruebas (Vitest + React Testing Library).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { resetDatabase } from './data/db'
import { fakeFetch, resetFakeBackend } from './test/fakeBackend'
import { cargarCatalogo } from './test/session'

// Las pruebas no necesitan el backend real: fetch responde el "backend falso" (ver test/fakeBackend.js).
globalThis.fetch = fakeFetch

// jsdom no implementa scrollTo (la tienda lo usa al cambiar de página).
window.scrollTo = vi.fn()
window.print = vi.fn()

// Cada prueba parte con el backend falso en su estado inicial, el catálogo ya cargado,
// y sin sesión ni carrito guardados.
beforeEach(() => {
  window.localStorage.clear()
  resetFakeBackend()
  resetDatabase()
  cargarCatalogo()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
