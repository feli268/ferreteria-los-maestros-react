import { storage } from './storage'

const clonar = (valor) => JSON.parse(JSON.stringify(valor))

/**
 * Crea un "repositorio": una colección de registros persistida en localStorage
 * con las operaciones CRUD (Crear, Leer, Actualizar, Eliminar).
 * Funciona como una tabla de una base de datos simulada.
 *
 * - Los datos iniciales (seed) se cargan la primera vez.
 * - Cada escritura notifica a los suscriptores: así los componentes React
 *   se actualizan "en tiempo real" (también entre pestañas, vía evento "storage").
 * - Los datos se tratan como inmutables: getAll() devuelve el mismo arreglo
 *   hasta que algo cambia, y cada escritura crea un arreglo nuevo.
 */
export function createRepository({ key, seed = [], idField = 'id' }) {
  let cache = null
  const listeners = new Set()

  const mismoId = (registro, id) => String(registro[idField]) === String(id)
  const notificar = () => listeners.forEach((listener) => listener())

  function cargar() {
    if (cache === null) {
      const guardado = storage.get(key)
      if (Array.isArray(guardado)) {
        cache = guardado
      } else {
        cache = clonar(seed)
        storage.set(key, cache)
      }
    }
    return cache
  }

  function guardar(siguiente) {
    cache = siguiente
    storage.set(key, cache)
    notificar()
  }

  // Otra pestaña modificó los datos: se vuelve a leer desde localStorage.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (evento) => {
      if (evento.key === storage.prefix + key) {
        cache = null
        notificar()
      }
    })
  }

  return {
    key,
    idField,

    /** READ: todos los registros. */
    getAll() {
      return cargar()
    },

    /** READ: un registro por su identificador (o null). */
    getById(id) {
      return cargar().find((r) => mismoId(r, id)) ?? null
    },

    /** READ: registros que cumplen una condición. */
    find(condicion) {
      return cargar().filter(condicion)
    },

    /** CREATE: agrega un registro. Falla si falta el id o ya existe. */
    create(registro) {
      const id = registro[idField]
      if (id === undefined || id === null || id === '') {
        throw new Error(`Falta el campo "${idField}".`)
      }
      const todos = cargar()
      if (todos.some((r) => mismoId(r, id))) {
        throw new Error(`Ya existe un registro con ${idField} "${id}".`)
      }
      const nuevo = { ...registro }
      guardar([...todos, nuevo])
      return nuevo
    },

    /** UPDATE: modifica campos de un registro existente (el id no cambia). */
    update(id, cambios) {
      const todos = cargar()
      const indice = todos.findIndex((r) => mismoId(r, id))
      if (indice === -1) {
        throw new Error(`No existe un registro con ${idField} "${id}".`)
      }
      const actualizado = { ...todos[indice], ...cambios, [idField]: todos[indice][idField] }
      guardar(todos.map((r, i) => (i === indice ? actualizado : r)))
      return actualizado
    },

    /** DELETE: elimina un registro. Devuelve true si existía. */
    remove(id) {
      const todos = cargar()
      if (!todos.some((r) => mismoId(r, id))) return false
      guardar(todos.filter((r) => !mismoId(r, id)))
      return true
    },

    /** Vuelve a los datos iniciales. */
    reset() {
      guardar(clonar(seed))
    },

    /** Suscripción a cambios. Devuelve la función para cancelarla. */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
