// CRUD y validación de categorías.
import { categoryRepository, productRepository } from '../data/db'
import { slugify } from '../utils/format'
import { collectErrors, validateOptional, validateRequired } from '../utils/validators'

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

export const categoryService = {
  create(data) {
    const errors = validateCategoryForm(data, { mode: 'create' })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const category = categoryRepository.create({
      id: slugify(data.name),
      name: data.name.trim(),
      icon: data.icon?.trim() || '📦',
      description: String(data.description ?? '').trim(),
    })
    return { ok: true, category }
  },

  update(id, data) {
    if (!categoryRepository.getById(id)) {
      return { ok: false, errors: { general: 'La categoría no existe.' } }
    }
    const errors = validateCategoryForm(data, { mode: 'edit', originalId: id })
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const category = categoryRepository.update(id, {
      name: data.name.trim(),
      icon: data.icon?.trim() || '📦',
      description: String(data.description ?? '').trim(),
    })
    return { ok: true, category }
  },

  /** No se puede borrar una categoría que todavía tiene productos. */
  remove(id) {
    if (!categoryRepository.getById(id)) return { ok: false, message: 'La categoría no existe.' }
    const enUso = productRepository.find((p) => p.categoryId === id).length
    if (enUso > 0) {
      return {
        ok: false,
        message: `No se puede eliminar: tiene ${enUso} producto(s) asociado(s). Reasígnalos primero.`,
      }
    }
    categoryRepository.remove(id)
    return { ok: true }
  },
}
