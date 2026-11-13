/**
 * Repositorio "remoto": una colección de registros que vive en la base de datos del backend
 * (MySQL, a través de la API REST) y se guarda en memoria como copia (caché) para mostrarla.
 *
 * Tiene la misma forma de lectura que el repositorio local (getAll / getById / find / subscribe),
 * así los hooks y componentes no cambian. Lo nuevo:
 *  - refresh(): vuelve a pedir la lista al backend (GET).
 *  - upsert / drop: actualizan la copia local después de un POST / PUT / DELETE exitoso.
 *  - status: 'idle' (sin cargar) | 'loading' | 'ready' | 'error'.
 *
 * El backend es la fuente de verdad: la copia solo evita pedir los mismos datos en cada pantalla.
 */
export function createRemoteRepository({ key, idField = 'id', fetchAll }) {
  let cache = []
  let status = 'idle'
  let error = null
  let generacion = 0 // sirve para descartar respuestas viejas (p. ej. si se cerró la sesión mientras cargaba)
  const listeners = new Set()

  const mismoId = (registro, id) => String(registro[idField]) === String(id)
  const notificar = () => listeners.forEach((listener) => listener())

  return {
    key,
    idField,

    /** READ: todos los registros (la copia en memoria). */
    getAll: () => cache,
    getById: (id) => cache.find((r) => mismoId(r, id)) ?? null,
    find: (condicion) => cache.filter(condicion),

    get status() {
      return status
    },
    get error() {
      return error
    },

    /** Pide la lista actualizada al backend. Si falla, deja status = 'error'. */
    async refresh() {
      const miGeneracion = ++generacion
      status = 'loading'
      error = null
      notificar()
      try {
        const datos = await fetchAll()
        if (miGeneracion !== generacion) return cache // llegó tarde: ya hubo clear() u otro refresh()
        cache = Array.isArray(datos) ? datos : []
        status = 'ready'
      } catch (e) {
        if (miGeneracion !== generacion) return cache
        status = 'error'
        error = e
      }
      notificar()
      return cache
    },

    /** Agrega o reemplaza un registro en la copia local (tras crear o editar en el backend). */
    upsert(registro) {
      const existe = cache.some((r) => mismoId(r, registro[idField]))
      cache = existe
        ? cache.map((r) => (mismoId(r, registro[idField]) ? registro : r))
        : [...cache, registro]
      notificar()
      return registro
    },

    /** Quita un registro de la copia local (tras eliminarlo en el backend). */
    drop(id) {
      if (!cache.some((r) => mismoId(r, id))) return false
      cache = cache.filter((r) => !mismoId(r, id))
      notificar()
      return true
    },

    /** Deja la copia vacía y sin cargar (p. ej. al cerrar sesión). */
    clear() {
      generacion++
      cache = []
      status = 'idle'
      error = null
      notificar()
    },

    /** Carga datos ya conocidos sin llamar al backend (lo usan las pruebas). */
    hydrate(registros) {
      generacion++
      cache = [...registros]
      status = 'ready'
      error = null
      notificar()
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
