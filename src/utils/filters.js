// Búsqueda, filtros y orden del catálogo (funciones puras, fáciles de probar).
import { getEffectivePrice, isOnOffer, isOutOfStock } from './pricing'

export const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
]

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Filtra y ordena productos.
 * @param {object[]} products
 * @param {{query?:string, categoryId?:string, onlyOffers?:boolean, onlyAvailable?:boolean,
 *          minPrice?:number|string, maxPrice?:number|string, sort?:string}} filters
 */
export function filterProducts(products, filters = {}) {
  const { query = '', categoryId = '', onlyOffers = false, onlyAvailable = false, sort = 'relevancia' } = filters
  const minPrice = filters.minPrice === '' || filters.minPrice == null ? null : Number(filters.minPrice)
  const maxPrice = filters.maxPrice === '' || filters.maxPrice == null ? null : Number(filters.maxPrice)
  const palabras = normalizar(query).split(/\s+/).filter(Boolean)

  const resultado = products.filter((p) => {
    if (categoryId && p.categoryId !== categoryId) return false
    if (onlyOffers && !isOnOffer(p)) return false
    if (onlyAvailable && isOutOfStock(p)) return false
    const precio = getEffectivePrice(p)
    if (minPrice !== null && !Number.isNaN(minPrice) && precio < minPrice) return false
    if (maxPrice !== null && !Number.isNaN(maxPrice) && precio > maxPrice) return false
    if (palabras.length > 0) {
      const texto = normalizar(`${p.name} ${p.brand} ${p.subcategory} ${p.id} ${p.description}`)
      // Todas las palabras escritas deben aparecer en alguna parte del producto.
      if (!palabras.every((palabra) => texto.includes(palabra))) return false
    }
    return true
  })

  const copia = [...resultado]
  if (sort === 'precio-asc') copia.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b))
  else if (sort === 'precio-desc') copia.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a))
  else if (sort === 'nombre') copia.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return copia
}
