// Validaciones de formularios (reglas de la entrega 1, ahora como módulo reutilizable).
// Todas devuelven { valid: boolean, message?: string } y no tocan el DOM.
import { regionesYComunas } from '../data/catalogs'

const ok = () => ({ valid: true })
const fail = (message) => ({ valid: false, message })

export const ALLOWED_EMAIL_DOMAINS = ['duoc.cl', 'profesor.duoc.cl', 'gmail.com']

/** Quita puntos y guion y pasa a mayúscula: "12.345.678-k" -> "12345678K" */
export function cleanRun(run) {
  return String(run ?? '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/-/g, '')
}

/** Dígito verificador (módulo 11) de la parte numérica de un RUN. */
export function calculateDv(body) {
  let suma = 0
  let multiplo = 2
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body.charAt(i), 10) * multiplo
    multiplo = multiplo < 7 ? multiplo + 1 : 2
  }
  const dv = 11 - (suma % 11)
  if (dv === 11) return '0'
  if (dv === 10) return 'K'
  return String(dv)
}

export function validateRun(run) {
  if (!run || String(run).trim() === '') return fail('El RUN es obligatorio.')
  const limpio = cleanRun(run)
  if (limpio.length < 7 || limpio.length > 9) {
    return fail('El RUN debe tener entre 7 y 9 caracteres (sin puntos ni guion).')
  }
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return fail('El cuerpo del RUN debe contener solo dígitos.')
  const esperado = calculateDv(cuerpo)
  if (dv !== esperado) {
    return fail(`Dígito verificador inválido para el RUN ${cuerpo}. Esperado: ${esperado}.`)
  }
  return { valid: true, cleanRun: limpio }
}

export function validateEmail(email) {
  if (!email || String(email).trim() === '') return fail('El correo es obligatorio.')
  const valor = String(email).trim()
  if (valor.length > 100) return fail('Máximo 100 caracteres permitidos.')
  if (!/^[^\s@]+@([^\s@]+\.[^\s@]+)$/.test(valor)) {
    return fail('Formato de correo electrónico inválido.')
  }
  const dominio = valor.toLowerCase().split('@')[1]
  if (!ALLOWED_EMAIL_DOMAINS.includes(dominio)) {
    return fail('Solo se permiten correos @duoc.cl, @profesor.duoc.cl o @gmail.com.')
  }
  return ok()
}

export function validatePassword(password) {
  if (!password) return fail('La contraseña es obligatoria.')
  if (password.length < 4 || password.length > 10) {
    return fail('La contraseña debe tener entre 4 y 10 caracteres.')
  }
  return ok()
}

export function validatePasswordConfirm(password, confirm) {
  if (!confirm) return fail('Debes confirmar la contraseña.')
  if (password !== confirm) return fail('Las contraseñas no coinciden.')
  return ok()
}

/** Texto obligatorio con largo máximo. */
export function validateRequired(value, label, max = 100) {
  const texto = String(value ?? '').trim()
  if (texto === '') return fail(`${label} es obligatorio.`)
  if (texto.length > max) return fail(`${label}: máximo ${max} caracteres.`)
  return ok()
}

/** Texto opcional con largo máximo. */
export function validateOptional(value, label, max = 300) {
  const texto = String(value ?? '').trim()
  if (texto.length > max) return fail(`${label}: máximo ${max} caracteres.`)
  return ok()
}

export function validateRegionComuna(region, comuna) {
  if (!region) return fail('Selecciona una región.')
  const encontrada = regionesYComunas.find((r) => r.region === region)
  if (!encontrada) return fail('Región no válida.')
  if (!comuna) return fail('Selecciona una comuna.')
  if (!encontrada.comunas.includes(comuna)) return fail('La comuna no pertenece a la región.')
  return ok()
}

/** Entero >= 0 (el peso chileno no tiene decimales). */
export function validateNonNegativeInteger(value, label) {
  if (value === '' || value === null || value === undefined) return fail(`${label} es obligatorio.`)
  const numero = Number(value)
  if (Number.isNaN(numero)) return fail(`${label} debe ser un número.`)
  if (!Number.isInteger(numero)) return fail(`${label} debe ser un número entero.`)
  if (numero < 0) return fail(`${label} debe ser mayor o igual a 0.`)
  return ok()
}

export const validatePrice = (value) => validateNonNegativeInteger(value, 'El precio')
export const validateStock = (value) => validateNonNegativeInteger(value, 'El stock')
export const validateCriticalStock = (value) =>
  validateNonNegativeInteger(value === '' ? 0 : value, 'El stock crítico')

export function validateDiscount(value) {
  const base = validateNonNegativeInteger(value === '' ? 0 : value, 'El descuento')
  if (!base.valid) return base
  if (Number(value) > 90) return fail('El descuento no puede superar el 90%.')
  return ok()
}

export function validateProductCode(code) {
  const texto = String(code ?? '').trim()
  if (texto.length < 3) return fail('El código es obligatorio (mínimo 3 caracteres).')
  if (texto.length > 12) return fail('El código admite como máximo 12 caracteres.')
  if (!/^[A-Za-z0-9-]+$/.test(texto)) return fail('El código solo admite letras, números y guion.')
  return ok()
}

/**
 * Recibe un objeto { campo: resultadoDeValidacion } y devuelve solo los mensajes
 * de los campos inválidos: { campo: 'mensaje' }.
 */
export function collectErrors(results) {
  const errors = {}
  Object.entries(results).forEach(([campo, resultado]) => {
    if (!resultado.valid) errors[campo] = resultado.message
  })
  return errors
}
