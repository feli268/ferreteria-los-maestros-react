import { describe, expect, it } from 'vitest'
import { initialProducts } from '../data/seed'
import { filterProducts } from './filters'

const ids = (lista) => lista.map((p) => p.id)

describe('filterProducts (búsqueda y filtros)', () => {
  it('sin filtros devuelve todo el catálogo', () => {
    expect(filterProducts(initialProducts)).toHaveLength(initialProducts.length)
  })

  it('busca por nombre ignorando mayúsculas y tildes', () => {
    expect(ids(filterProducts(initialProducts, { query: 'MELON' }))).toEqual(['MC002'])
    expect(ids(filterProducts(initialProducts, { query: 'cemento' }))).toEqual(['MC001', 'MC002'])
  })

  it('exige que aparezcan todas las palabras escritas', () => {
    expect(ids(filterProducts(initialProducts, { query: 'cemento polpaico' }))).toEqual(['MC001'])
    expect(filterProducts(initialProducts, { query: 'cemento taladro' })).toHaveLength(0)
  })

  it('busca también por marca y por código', () => {
    expect(ids(filterProducts(initialProducts, { query: 'bosch' }))).toEqual(['HE001'])
    expect(ids(filterProducts(initialProducts, { query: 'EL001' }))).toEqual(['EL001'])
  })

  it('filtra por categoría', () => {
    const lista = filterProducts(initialProducts, { categoryId: 'pinturas' })
    expect(ids(lista)).toEqual(['PI001', 'PI002', 'PI003'])
  })

  it('filtra solo ofertas', () => {
    const lista = filterProducts(initialProducts, { onlyOffers: true })
    expect(ids(lista).sort()).toEqual(['EL002', 'HE001', 'MC002', 'PI001'])
  })

  it('filtra por rango de precio usando el precio con oferta', () => {
    // EL002 cuesta $2.490 pero con 25% de oferta paga $1.868; MC005 cuesta $1.800.
    const lista = filterProducts(initialProducts, { minPrice: 1800, maxPrice: 2000 })
    expect(ids(lista)).toEqual(['MC005', 'EL002'])
    expect(filterProducts(initialProducts, { minPrice: '', maxPrice: '' })).toHaveLength(initialProducts.length)
  })

  it('oculta productos sin stock cuando se pide solo disponibles', () => {
    const conAgotado = [...initialProducts, { ...initialProducts[0], id: 'X1', stock: 0 }]
    expect(ids(filterProducts(conAgotado, { onlyAvailable: true }))).not.toContain('X1')
    expect(ids(filterProducts(conAgotado))).toContain('X1')
  })

  it('ordena por precio y por nombre sin alterar el arreglo original', () => {
    const copia = [...initialProducts]
    const baratos = filterProducts(initialProducts, { sort: 'precio-asc' })
    const caros = filterProducts(initialProducts, { sort: 'precio-desc' })
    expect(baratos[0].id).toBe('MC005') // $1.800, más barato que EL002 con oferta ($1.868)
    expect(caros[0].id).toBe('HE002')
    expect(filterProducts(initialProducts, { sort: 'nombre' })[0].name.startsWith('Ampolleta')).toBe(true)
    expect(initialProducts).toEqual(copia)
  })
})
