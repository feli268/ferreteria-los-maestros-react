// Cliente HTTP del frontend: todas las llamadas al backend (Spring Boot) pasan por aquí.
// - Usa fetch y agrega el token JWT de la sesión en "Authorization: Bearer <token>".
// - Si el backend responde con error, lanza un ApiError con el mensaje y los errores por campo.
import { storage } from '../data/storage'

/** URL del backend. Se puede cambiar con la variable VITE_API_URL (ver .env.example). */
export const API_URL = String(import.meta.env?.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

/** Todas las rutas del backend llevan la versión de la API en el prefijo. */
export const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  /**
   * @param {number} status código HTTP (0 = no hubo respuesta del servidor)
   * @param {string} message mensaje para mostrar a la persona
   * @param {Record<string,string>} errors errores por campo ({ campo: mensaje })
   */
  constructor(status, message, errors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

// Función que se ejecuta cuando el backend rechaza el token (401): cierra la sesión.
let alNoAutorizado = null
export function onUnauthorized(manejador) {
  alNoAutorizado = manejador
}

const MENSAJES = {
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'Tu rol no tiene permiso para realizar esta acción.',
  404: 'No se encontró lo que buscabas.',
  409: 'La operación entra en conflicto con los datos existentes.',
}

/**
 * Llama a un endpoint del backend.
 * @param {string} ruta ejemplo: "/productos" (se le antepone /api/v1)
 * @param {{method?:string, body?:unknown}} opciones
 * @returns {Promise<any>} el JSON de la respuesta (o null si no trae contenido)
 */
export async function request(ruta, { method = 'GET', body } = {}) {
  const token = storage.get('session')?.token
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${API_PREFIX}${ruta}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No fue posible comunicarse con el servidor. Revisa que el backend esté en ejecución.')
  }

  let datos = null
  try {
    const texto = await respuesta.text()
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = null // respuesta sin JSON válido
  }

  if (!respuesta.ok) {
    // 401 con token guardado = el token venció o ya no sirve: se cierra la sesión.
    if (respuesta.status === 401 && token && alNoAutorizado) alNoAutorizado()
    const errores = datos && typeof datos.errors === 'object' && datos.errors ? datos.errors : {}
    throw new ApiError(respuesta.status, datos?.message || MENSAJES[respuesta.status] || 'Ocurrió un error inesperado.', errores)
  }
  return datos
}
