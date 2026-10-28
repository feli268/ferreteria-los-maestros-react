// Reportes de ventas e inventario (funciones puras sobre los datos).
import { ORDER_STATUS } from './orderService'

const pagadas = (orders) => orders.filter((o) => o.status === ORDER_STATUS.PAID)

/** Resumen general de pedidos. */
export function summarizeOrders(orders) {
  const ok = pagadas(orders)
  const ingresos = ok.reduce((s, o) => s + o.totals.total, 0)
  return {
    totalOrders: orders.length,
    paidOrders: ok.length,
    rejectedOrders: orders.length - ok.length,
    revenue: ingresos,
    averageTicket: ok.length > 0 ? Math.round(ingresos / ok.length) : 0,
    unitsSold: ok.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
  }
}

/** Ventas por producto (solo pedidos pagados), de mayor a menor ingreso. */
export function salesByProduct(orders) {
  const mapa = new Map()
  pagadas(orders).forEach((o) =>
    o.items.forEach((i) => {
      const actual = mapa.get(i.productId) ?? { productId: i.productId, name: i.name, units: 0, revenue: 0 }
      actual.units += i.quantity
      actual.revenue += i.subtotal
      mapa.set(i.productId, actual)
    }),
  )
  return [...mapa.values()].sort((a, b) => b.revenue - a.revenue)
}

/** Ventas por categoría usando las categorías vigentes. */
export function salesByCategory(orders, categories, products) {
  const categoriaDe = (item) =>
    item.categoryId ?? products.find((p) => p.id === item.productId)?.categoryId ?? 'sin-categoria'
  const mapa = new Map(categories.map((c) => [c.id, { categoryId: c.id, name: c.name, units: 0, revenue: 0 }]))
  pagadas(orders).forEach((o) =>
    o.items.forEach((i) => {
      const id = categoriaDe(i)
      const actual = mapa.get(id) ?? { categoryId: id, name: 'Sin categoría', units: 0, revenue: 0 }
      actual.units += i.quantity
      actual.revenue += i.subtotal
      mapa.set(id, actual)
    }),
  )
  return [...mapa.values()].sort((a, b) => b.revenue - a.revenue)
}

/**
 * Filtra pedidos por estado, texto (N° de orden, nombre o correo) y rango de fechas (AAAA-MM-DD).
 */
export function filterOrders(orders, { status = '', query = '', from = '', to = '' } = {}) {
  const texto = query.trim().toLowerCase()
  return orders.filter((o) => {
    if (status && o.status !== status) return false
    const dia = o.createdAt.slice(0, 10)
    if (from && dia < from) return false
    if (to && dia > to) return false
    if (texto) {
      const base = `${o.number} ${o.customer.name} ${o.customer.lastname} ${o.customer.email}`.toLowerCase()
      if (!base.includes(texto)) return false
    }
    return true
  })
}

/** Cifras para las tarjetas del dashboard de administración. */
export function getDashboardStats({ orders, products, users }) {
  const resumen = summarizeOrders(orders)
  return {
    orders: resumen.totalOrders,
    revenue: resumen.revenue,
    products: products.length,
    criticalProducts: products.filter((p) => p.stock <= p.criticalStock).length,
    users: users.length,
  }
}

/**
 * Reporte de inventario: totales y detalle por categoría.
 * El valor del inventario usa el precio de lista (con IVA) por las unidades en stock.
 */
export function inventoryReport(products, categories) {
  const filas = categories.map((c) => {
    const delaCategoria = products.filter((p) => p.categoryId === c.id)
    return {
      categoryId: c.id,
      name: c.name,
      products: delaCategoria.length,
      units: delaCategoria.reduce((s, p) => s + p.stock, 0),
      value: delaCategoria.reduce((s, p) => s + p.stock * p.price, 0),
      critical: delaCategoria.filter((p) => p.stock <= p.criticalStock).length,
    }
  })
  return {
    totalProducts: products.length,
    totalUnits: filas.reduce((s, f) => s + f.units, 0),
    totalValue: filas.reduce((s, f) => s + f.value, 0),
    criticalProducts: products.filter((p) => p.stock <= p.criticalStock).length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
    byCategory: filas,
  }
}
