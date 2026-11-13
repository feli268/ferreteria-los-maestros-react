// Ayudas para las pruebas: renderiza un componente con router y proveedores de contexto.
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { DataProvider } from '../context/DataContext'
import { ToastProvider } from '../context/ToastContext'
import { iniciarSesion } from './session'

/** Muestra la ruta actual para poder comprobar redirecciones y navegación. */
export function LocationDisplay() {
  const { pathname, search } = useLocation()
  return <div data-testid="ubicacion">{pathname + search}</div>
}

/**
 * @param {React.ReactElement} ui
 * @param {{route?:string, path?:string, loginAs?:[string,string]}} options
 *   loginAs = [correo, contraseña] deja la sesión iniciada antes de renderizar (la contraseña no se usa:
 *   se salta el formulario de login; el login real se prueba en App.store.test.jsx).
 */
export function renderWithProviders(ui, { route = '/', path = '*', loginAs } = {}) {
  if (loginAs) iniciarSesion(loginAs[0])
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <CartProvider>
              <Routes>
                <Route path={path} element={ui} />
              </Routes>
              <LocationDisplay />
            </CartProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

/** Render con solo el router (para componentes presentacionales que usan <Link>). */
export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
      <LocationDisplay />
    </MemoryRouter>,
  )
}
