// Contenedor: plantilla de la tienda; renderiza la página de la ruta actual (Outlet).
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import StoreLayout from '../components/templates/StoreLayout'
import Footer from '../components/organisms/Footer'
import HeaderContainer from './HeaderContainer'

export default function StoreLayoutContainer() {
  const { pathname } = useLocation()

  // Al cambiar de página se vuelve al inicio.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <StoreLayout header={<HeaderContainer />} footer={<Footer />}>
      <Outlet />
    </StoreLayout>
  )
}
