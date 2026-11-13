// CRUD y validación de categorías. Las reglas se validan aquí (respuesta inmediata) y de nuevo en el backend.
import { categoriasApi } from '../api'
import { categoryRepository, productRepository } from '../data/db'
import { slugify } from '../utils/format'
import { collectErrors, validateOptional, validateRequired } from '../utils/validators'
import { falla } from './apiResult'

export function validateCategoryForm(data, { mode = 'create', originalId = null } = {}) {
  const errores = collectErrors({
    name: validateRequired(data.name, 'El nombre', 40),
    description: validateOptional(data.description, 'La descripción', 200),
  })
  if (!errores.name) {
    const id = slugify(data.name)
    if (!id) {
      errores.name = 'El nombre debe contener letras o números.'
    } else {
      const repetida = categoryRepository.find(
        (c) => c.name.toLowerCase() === data.name.trim().toLowerCase() && c.id !== originalId,
      )
      const mismoId = mode === 'create' && categoryRepository.getById(id)
      if (repetida.length > 0 || mismoId) errores.name = 'Ya existe una categoría con ese nombre.'
    }
  }
  return errores
}

const cuerpo = (data) => ({
  name: data.name.trim(),
  icon: data.icon?.trim() || '📦',
  description: String(data.description ?? '').trim(),
})

export const categoryService = {
  /** POST /api/v1/categorias */
  async create(data) {
    const errors = validateCategoryForm(data, { mode: 'create' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const category = categoryRepository.upsert(await categoriasApi.crear(cuerpo(data)))
      return { ok: true, category }
    } catch (error) {
      return falla(error)
    }
  },

  /** PUT /api/v1/categorias/{id} */
  async update(id, data) {
    if (!categoryRepository.getById(id)) {
      return { ok: false, errors: { general: 'La categoría no existe.' } }
    }
    const errors = validateCategoryForm(data, { mode: 'edit', originalId: id })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    try {
      const category = categoryRepository.upsert(await categoriasApi.actualizar(id, cuerpo(data)))
      return { ok: true, category }
    } catch (error) {
      return falla(error)
    }
  },

  /** DELETE /api/v1/categorias/{id}. No se puede borrar una categoría que todavía tiene productos. */
  async remove(id) {
    if (!categoryRepository.getById(id)) return { ok: false, message: 'La categoría no existe.' }
    const enUso = productRepository.find((p) => p.categoryId === id).length
    if (enUso > 0) {
      return {
        ok: false,
        message: `No se puede eliminar: tiene ${enUso} producto(s) asociado(s). Reasígnalos primero.`,
      }
    }
    try {
      await categoriasApi.eliminar(id)
      categoryRepository.drop(id)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: falla(error).message }
    }
  },
}
