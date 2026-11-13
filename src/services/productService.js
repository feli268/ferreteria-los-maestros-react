// CRUD y validación de productos e inventario.
import { productosApi } from '../api'
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
import { falla } from './apiResult'

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
  /** POST /api/v1/productos */
  async create(data) {
    const errors = validateProductForm(data, { mode: 'create' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const product = productRepository.upsert(
        await productosApi.crear({ id: String(data.id).trim().toUpperCase(), ...normalizar(data) }),
      )
      return { ok: true, product }
    } catch (error) {
      return falla(error)
    }
  },

  /** PUT /api/v1/productos/{id} */
  async update(id, data) {
    if (!productRepository.getById(id)) {
      return { ok: false, errors: { general: 'El producto no existe.' } }
    }
    const errors = validateProductForm(data, { mode: 'edit' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const product = productRepository.upsert(await productosApi.actualizar(id, normalizar(data)))
      return { ok: true, product }
    } catch (error) {
      return falla(error)
    }
  },

  /** DELETE /api/v1/productos/{id}. El backend no deja borrar productos que ya tienen ventas. */
  async remove(id) {
    try {
      await productosApi.eliminar(id)
      productRepository.drop(id)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: falla(error).message }
    }
  },

  /** Productos con stock igual o inferior al umbral crítico, los más urgentes primero. */
  getCritical() {
    return productRepository
      .find((p) => p.stock <= p.criticalStock)
      .slice()
      .sort((a, b) => a.stock - b.stock)
  },
}
