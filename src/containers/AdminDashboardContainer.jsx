// Contenedor: cifras y accesos directos del dashboard según el rol.
import AdminDashboardPage from '../components/pages/AdminDashboardPage'
import { useAuth } from '../context/AuthContext'
import { ADMIN_MENU } from '../data/adminMenu'
import { useOrders, useProducts, useUsers } from '../hooks/useRepository'
import { getDashboardStats } from '../services/reportService'
import { formatCLP } from '../utils/format'

export default function AdminDashboardContainer() {
  const { user, can } = useAuth()
  const orders = useOrders()
  const products = useProducts()
  const users = useUsers()
  const stats = getDashboardStats({ orders, products, users })

  const cards = [
    can('orders') && { icon: '🧾', label: 'Órdenes', value: stats.orders, to: '/admin/ordenes' },
    can('reports') && { icon: '💰', label: 'Ingresos (pagados)', value: formatCLP(stats.revenue), to: '/admin/reportes', tone: 'success' },
    can('products') && { icon: '📦', label: 'Productos', value: stats.products, to: '/admin/productos' },
    can('products') && { icon: '⚠️', label: 'Stock crítico', value: stats.criticalProducts, to: '/admin/productos/criticos', tone: 'danger' },
    can('users') && { icon: '👥', label: 'Usuarios', value: stats.users, to: '/admin/usuarios', tone: 'warning' },
  ].filter(Boolean)

  const shortcuts = ADMIN_MENU.filter((m) => m.area !== 'dashboard' && can(m.area))
  return <AdminDashboardPage user={user} cards={cards} shortcuts={shortcuts} />
}
