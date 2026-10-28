// Contenedor: reporte de ventas filtrable por fechas.
import { useState } from 'react'
import AdminReportsPage from '../components/pages/AdminReportsPage'
import { useCategories, useOrders, useProducts } from '../hooks/useRepository'
import { filterOrders, salesByCategory, salesByProduct, summarizeOrders } from '../services/reportService'

const FILTROS_VACIOS = { from: '', to: '' }

export default function AdminReportsContainer() {
  const orders = useOrders()
  const products = useProducts()
  const categories = useCategories()
  const [filters, setFilters] = useState(FILTROS_VACIOS)

  const filtradas = filterOrders(orders, filters)
  return (
    <AdminReportsPage
      filters={filters}
      onFilterChange={(cambio) => setFilters((f) => ({ ...f, ...cambio }))}
      onReset={() => setFilters(FILTROS_VACIOS)}
      summary={summarizeOrders(filtradas)}
      byProduct={salesByProduct(filtradas)}
      byCategory={salesByCategory(filtradas, categories, products)}
    />
  )
}
