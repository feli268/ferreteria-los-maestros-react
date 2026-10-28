// Contenedores: listado y detalle de órdenes del panel.
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminOrderDetailPage from '../components/pages/AdminOrderDetailPage'
import AdminOrdersPage from '../components/pages/AdminOrdersPage'
import NotFoundPage from '../components/pages/NotFoundPage'
import { useOrders } from '../hooks/useRepository'
import { filterOrders } from '../services/reportService'

const FILTROS_VACIOS = { query: '', status: '', from: '', to: '' }

export function AdminOrdersContainer() {
  const orders = useOrders()
  const [filters, setFilters] = useState(FILTROS_VACIOS)
  const ordenadas = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <AdminOrdersPage
      orders={filterOrders(ordenadas, filters)}
      filters={filters}
      onFilterChange={(cambio) => setFilters((f) => ({ ...f, ...cambio }))}
      onReset={() => setFilters(FILTROS_VACIOS)}
    />
  )
}

export function AdminOrderDetailContainer() {
  const { number } = useParams()
  const orders = useOrders()
  const order = orders.find((o) => o.number === number)
  if (!order) return <NotFoundPage title="Orden no encontrada" message="No existe una orden con ese número." />
  return <AdminOrderDetailPage order={order} onPrint={() => window.print()} />
}
