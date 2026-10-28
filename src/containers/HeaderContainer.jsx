// Contenedor: datos de sesión, carrito y categorías para la cabecera.
import { useNavigate } from 'react-router-dom'
import Header from '../components/organisms/Header'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useCategories } from '../hooks/useRepository'

export default function HeaderContainer() {
  const { user, isStaff, logout } = useAuth()
  const cart = useCart()
  const categories = useCategories()
  const { notify } = useToast()
  const navigate = useNavigate()

  return (
    <Header
      user={user}
      isStaff={isStaff}
      cartCount={cart.count}
      cartTotal={cart.totals.total}
      categories={categories}
      onSearch={(texto) => navigate(texto ? `/productos?q=${encodeURIComponent(texto)}` : '/productos')}
      onLogout={() => {
        logout()
        notify('Cerraste sesión.', 'info')
        navigate('/')
      }}
    />
  )
}
