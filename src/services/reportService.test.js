import { describe, expect, it } from 'vitest'
import { categoryRepository, orderRepository, productRepository, userRepository } from '../data/db'
import { filterOrders, getDashboardStats, salesByCategory, salesByProduct, summarizeOrders } from './reportService'

const orders = () => orderRepository.getAll()

describe('reportService', () => {
  it('summarizeOrders cuenta pagadas y rechazadas y suma solo los ingresos pagados', () => {
    const r = summarizeOrders(orders())
    expect(r.totalOrders).toBe(4)
    expect(r.paidOrders).toBe(3)
    expect(r.rejectedOrders).toBe(1)
    const sumaPagadas = orders()
      .filter((o) => o.status === 'Pagada')
      .reduce((s, o) => s + o.totals.total, 0)
    expect(r.revenue).toBe(sumaPagadas)
    expect(r.averageTicket).toBe(Math.round(sumaPagadas / 3))
  })

  it('summarizeOrders con lista vacía no divide por cero', () => {
    expect(summarizeOrders([])).toMatchObject({ revenue: 0, averageTicket: 0, unitsSold: 0 })
  })

  it('salesByProduct ordena de mayor a menor ingreso y excluye pedidos rechazados', () => {
    const r = salesByProduct(orders())
    expect(r[0].revenue).toBeGreaterThanOrEqual(r[1].revenue)
    expect(r.find((p) => p.productId === 'GA001')).toBeUndefined() // solo estaba en el pedido rechazado
    expect(r.find((p) => p.productId === 'MC001').units).toBe(10)
  })

  it('salesByCategory agrupa por categoría', () => {
    const r = salesByCategory(orders(), categoryRepository.getAll(), productRepository.getAll())
    const construccion = r.find((c) => c.categoryId === 'mat-construccion')
    expect(construccion.units).toBe(14)
    expect(r.find((c) => c.categoryId === 'gasfiteria').revenue).toBe(0)
  })

  it('filterOrders filtra por estado, texto y fechas', () => {
    expect(filterOrders(orders(), { status: 'Rechazada' })).toHaveLength(1)
    expect(filterOrders(orders(), { query: 'rojas' })).toHaveLength(1)
    expect(filterOrders(orders(), { query: '20260928' })).toHaveLength(1)
    expect(filterOrders(orders(), { from: '2026-10-02', to: '2026-10-08' })).toHaveLength(2)
    expect(filterOrders(orders(), {})).toHaveLength(4)
  })

  it('getDashboardStats entrega las cifras del panel', () => {
    const stats = getDashboardStats({
      orders: orders(),
      products: productRepository.getAll(),
      users: userRepository.getAll(),
    })
    expect(stats).toMatchObject({ orders: 4, products: 17, criticalProducts: 3, users: 4 })
    expect(stats.revenue).toBeGreaterThan(0)
  })
})
