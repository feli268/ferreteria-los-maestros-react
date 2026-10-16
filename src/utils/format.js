// Funciones de formato (puras, sin dependencias).

/** 5990 -> "$5.990" (pesos chilenos, sin decimales). */
export function formatCLP(valor) {
  const numero = Math.round(Number(valor) || 0)
  // Separador de miles con puntos, sin depender de los datos regionales del navegador.
  const texto = String(Math.abs(numero)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (numero < 0 ? '-$' : '$') + texto
}

/** "2026-10-15T12:00:00Z" -> "15-10-2026" */
export function formatDate(iso) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${fecha.getFullYear()}`
}

/** "Mat. Construcción" -> "mat-construccion" */
export function slugify(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "123456785" -> "12.345.678-5" */
export function formatRun(run) {
  const limpio = String(run ?? '').replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1)}`
}
