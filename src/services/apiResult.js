// Convierte los errores del backend (ApiError) en el resultado que ya usaban los formularios:
//   { ok:false, errors:{ campo: mensaje }, message }
// Si el backend no indica el campo, el mensaje va en errors.general.
import { ApiError } from '../api/http'

export function falla(error) {
  if (!(error instanceof ApiError)) throw error // un error de programación no se disfraza de error de formulario
  const errors = Object.keys(error.errors ?? {}).length > 0 ? error.errors : { general: error.message }
  return { ok: false, errors, message: error.message, status: error.status }
}
