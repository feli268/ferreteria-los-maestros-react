// CRUD y validación de productos e inventario.
import { categoryRepository, productRepository } from '../data/db'
import {
  collectErrors,
  validateCriticalStock,
  validateDiscount,
  validateOptional,
  validatePrice,
  validateProductCode,
  validateRequired,
  validateStock,
} from '../utils/validators'

/**
 * Devuelve { campo: mensaje } (vacío si todo está bien).
 * @param {{mode?:'create'|'edit'}} options
 */
export function validateProductForm(data, { mode = 'create' } = {}) {
  const resultados = {
    name: validateRequired(data.name, 'El nombre', 100),
    description: validateOptional(data.description, 'La descripción', 500),
    price: validatePrice(data.price),
    stock: validateStock(data.stock),
    criticalStock: validateCriticalStock(data.criticalStock),
    discountPercent: validateDiscount(data.discountPercent),
    brand: validateOptional(data.brand, 'La marca', 60),
    subcategory: validateOptional(data.subcategory, 'La subcategoría', 60),
  }
  if (mode === 'create') resultados.id = validateProductCode(data.id)

  const errores = collectErrors(resultados)

  if (!data.categoryId || !categoryRepository.getById(data.categoryId)) {
    errores.categoryId = 'Selecciona una categoría válida.'
  }
  if (mode === 'create' && !errores.id && productRepository.getById(String(data.id).trim().toUpperCase())) {
    errores.id = 'Ya existe un producto con este código.'
  }
  return errores
}

function normalizar(data) {
  return {
    name: data.name.trim(),
    categoryId: data.categoryId,
    subcategory: String(data.subcategory ?? '').trim(),
    brand: String(data.brand ?? '').trim(),
    price: Number(data.price),
    discountPercent: Number(data.discountPercent) || 0,
    stock: Number(data.stock),
    criticalStock: Number(data.criticalStock) || 0,
    icon: data.icon?.trim() || '📦',
    description: String(data.description ?? '').trim(),
  }
}

export const productService = {
  create(data) {
    const errors = validateProductForm(data, { mode: 'create' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const product = productRepository.create({
      id: String(data.id).trim().toUpperCase(),
      ...normalizar(data),
    })
    return { ok: true, product }
  },

  update(id, data) {
    if (!productRepository.getById(id)) {
      return { ok: false, errors: { general: 'El producto no existe.' } }
    }
    const errors = validateProductForm(data, { mode: 'edit' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const product = productRepository.update(id, normalizar(data))
    return { ok: true, product }
  },

  remove(id) {
    return { ok: productRepository.remove(id) }
  },

  /** Descuenta stock (compra pagada). Nunca deja el stock en negativo. */
  decreaseStock(id, quantity) {
    const product = productRepository.getById(id)
    if (!product) return null
    return productRepository.update(id, { stock: Math.max(0, product.stock - quantity) })
  },

  /** Productos con stock igual o inferior al umbral crítico, los más urgentes primero. */
  getCritical() {
    return productRepository
      .find((p) => p.stock <= p.criticalStock)
      .slice()
      .sort((a, b) => a.stock - b.stock)
  },
}
