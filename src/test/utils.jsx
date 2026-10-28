// Ayudas para las pruebas: renderiza un componente con router y proveedores de contexto.
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { ToastProvider } from '../context/ToastContext'
import { authService } from '../services/authService'

/** Muestra la ruta actual para poder comprobar redirecciones y navegación. */
export function LocationDisplay() {
  const { pathname, search } = useLocation()
  return <div data-testid="ubicacion">{pathname + search}</div>
}

/**
 * @param {React.ReactElement} ui
 * @param {{route?:string, path?:string, loginAs?:[string,string]}} options
 *   loginAs = [correo, contraseña] inicia sesión antes de renderizar.
 */
export function renderWithProviders(ui, { route = '/', path = '*', loginAs } = {}) {
  if (loginAs) authService.login(loginAs[0], loginAs[1])
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path={path} element={ui} />
            </Routes>
            <LocationDisplay />
          </CartProvider>
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
