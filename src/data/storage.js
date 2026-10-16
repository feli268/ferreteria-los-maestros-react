// Acceso a localStorage con prefijo "lm_" (mismas claves que la entrega 1).
// Es un objeto (no funciones sueltas) para poder "espiarlo" en las pruebas.
const PREFIX = 'lm_'

export const storage = {
  prefix: PREFIX,

  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback // JSON dañado o localStorage no disponible
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      /* sin almacenamiento: no hay nada que borrar */
    }
  },

  clearAll() {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => window.localStorage.removeItem(k))
    } catch {
      /* sin almacenamiento */
    }
  },
}
