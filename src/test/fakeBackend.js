// Backend FALSO para las pruebas del frontend (Vitest).
// Reemplaza a fetch y responde como el backend Spring Boot real (mismas rutas /api/v1, mismos JSON,
// mismos códigos HTTP y las mismas reglas de seguridad por rol). Así se prueba que el frontend
// arma bien las peticiones (método, ruta, token) y que muestra correctamente las respuestas y los errores,
// sin necesitar MySQL ni el servidor levantado.
//
// El backend real se prueba por separado con JUnit (proyecto ferreteria-los-maestros-backend).
import { API_PREFIX, API_URL } from '../api/http'
import { DELIVERY_OPTIONS } from '../data/catalogs'
import { initialCategories, initialOrders, initialProducts, initialUsers } from '../data/seed'
import { slugify } from '../utils/format'
import { calculateTotals, findCouponPercent, getEffectivePrice, getShippingCost } from '../utils/pricing'

const clonar = (valor) => JSON.parse(JSON.stringify(valor))
const sinClave = ({ password, ...usuario }) => usuario // el backend nunca devuelve contraseñas
const pad = (n, largo) => String(n).padStart(largo, '0')

let db
/** Estado actual de la "base de datos" del backend falso (las pruebas lo consultan). */
export const fakeDb = () => db
/** Historial de llamadas recibidas: { method, path, auth, body }. */
export const fakeCalls = () => db.calls

export function resetFakeBackend() {
  db = {
    categories: clonar(initialCategories),
    products: clonar(initialProducts),
    users: clonar(initialUsers),
    orders: clonar(initialOrders),
    calls: [],
    offline: false, // true = simula que el servidor no responde
    latenciaMs: 0, // > 0 = cada respuesta tarda ese tiempo (sirve para probar estados de carga)
  }
}
resetFakeBackend()

/** Token que "emite" el backend falso para un usuario. */
export const tokenDe = (usuario) => `fake-jwt.${usuario.run}`

class Http extends Error {
  constructor(status, message, errors = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}
const noEncontrado = (texto) => new Http(404, texto)
const conflicto = (texto, errors) => new Http(409, texto, errors)
const invalido = (errors, texto = 'Hay datos inválidos.') => new Http(400, texto, errors)

function respuesta(status, cuerpo, ruta = '') {
  const datos =
    status >= 400
      ? {
          status,
          error: String(status),
          message: cuerpo.message,
          errors: cuerpo.errors ?? {},
          path: ruta,
          timestamp: new Date().toISOString(),
        }
      : cuerpo
  const texto = datos === null || datos === undefined ? '' : JSON.stringify(datos)
  return { ok: status < 400, status, text: async () => texto, json: async () => JSON.parse(texto) }
}

// ---------- Seguridad (equivale a SecurityConfig del backend) ----------
function usuarioDelToken(headers) {
  const auth = headers.Authorization ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const run = auth.slice(7).replace('fake-jwt.', '')
  return db.users.find((u) => u.run === run) ?? null
}

function exigir(usuario, ...roles) {
  if (!usuario) throw new Http(401, 'Debes iniciar sesión para realizar esta acción.')
  if (roles.length > 0 && !roles.includes(usuario.role)) {
    throw new Http(403, 'No tienes permiso para realizar esta acción.')
  }
}

// ---------- Reglas de negocio (versión reducida de los servicios Java) ----------
function validarUsuario(datos, { crear, run }) {
  const errores = {}
  if (!datos.name) errores.name = 'El nombre es obligatorio.'
  if (!datos.lastname) errores.lastname = 'Los apellidos son obligatorios.'
  if (!datos.email) errores.email = 'El correo es obligatorio.'
  if (crear && !datos.password) errores.password = 'La contraseña es obligatoria.'
  if (datos.password && datos.password !== datos.passwordConfirm) {
    errores.passwordConfirm = 'Las contraseñas no coinciden.'
  }
  const correo = String(datos.email ?? '').trim().toLowerCase()
  if (correo && db.users.some((u) => u.email.toLowerCase() === correo && u.run !== run)) {
    errores.email = 'Este correo ya está registrado.'
  }
  if (crear && db.users.some((u) => u.run === datos.run)) {
    errores.run = 'Ya existe un usuario registrado con este RUN.'
  }
  if (Object.keys(errores).length > 0) throw invalido(errores)
}

const aUsuario = (datos, rol) => ({
  run: datos.run,
  name: datos.name.trim(),
  lastname: datos.lastname.trim(),
  email: datos.email.trim().toLowerCase(),
  password: datos.password,
  role: rol,
  region: datos.region,
  comuna: datos.comuna,
  address: datos.address.trim(),
})

function generarNumero() {
  const hoy = new Date()
  const prefijo = `${hoy.getFullYear()}${pad(hoy.getMonth() + 1, 2)}${pad(hoy.getDate(), 2)}`
  const mayor = db.orders
    .filter((o) => o.number.startsWith(`${prefijo}-`))
    .reduce((max, o) => Math.max(max, parseInt(o.number.split('-')[1], 10) || 0), 0)
  return `${prefijo}-${pad(mayor + 1, 3)}`
}

function crearBoleta(req, usuario) {
  const { form, items = [], couponCode = '' } = req
  if (!form) throw invalido({ form: 'Faltan los datos del cliente y de la entrega.' })
  if (items.length === 0) throw invalido({ cart: 'Tu carrito está vacío.' })

  const lineas = items.map(({ id, qty }) => {
    const producto = db.products.find((p) => p.id === id)
    if (!producto) throw invalido({ cart: `El producto "${id}" ya no existe.` })
    if (qty > producto.stock) {
      throw invalido({ cart: `No hay stock suficiente de "${producto.name}". Ajusta la cantidad en el carrito.` })
    }
    const unitPrice = getEffectivePrice(producto)
    return {
      productId: producto.id, name: producto.name, icon: producto.icon, categoryId: producto.categoryId,
      quantity: qty, unitPrice, subtotal: unitPrice * qty,
    }
  })
  const couponPercent = findCouponPercent(couponCode)
  const bruto = lineas.reduce((s, l) => s + l.subtotal, 0)
  const shipping = getShippingCost(form.deliveryId, bruto - Math.round(bruto * (couponPercent / 100)))
  const totals = calculateTotals(lineas, { couponPercent, shipping })
  const entrega = DELIVERY_OPTIONS.find((d) => d.id === form.deliveryId)
  const aprobado = form.paymentMethod !== 'tarjeta-rechazada'

  const boleta = {
    number: generarNumero(),
    createdAt: new Date().toISOString(),
    status: aprobado ? 'Pagada' : 'Rechazada',
    failureReason: aprobado ? null : 'Pago rechazado por el emisor de la tarjeta (simulación).',
    userRun: usuario?.run ?? null,
    customer: { name: form.name, lastname: form.lastname, email: form.email },
    address: {
      street: form.street, apartment: form.apartment ?? '', region: form.region, comuna: form.comuna, notes: form.notes ?? '',
    },
    delivery: { id: entrega.id, label: entrega.label, cost: totals.shipping },
    paymentMethod: form.paymentMethod,
    coupon: couponPercent > 0 ? { code: String(couponCode).trim().toUpperCase(), percent: couponPercent } : null,
    items: lineas,
    totals,
  }
  if (aprobado) {
    lineas.forEach((l) => {
      const p = db.products.find((x) => x.id === l.productId)
      p.stock = Math.max(0, p.stock - l.quantity)
    })
  }
  db.orders.push(boleta)
  return boleta
}

// ---------- Rutas (equivalen a los controladores REST) ----------
function atender(method, ruta, body, usuario) {
  const partes = ruta.split('/').filter(Boolean)
  const [recurso, id] = partes
  const esLectura = method === 'GET'

  // Autenticación
  if (recurso === 'auth') {
    if (partes[1] === 'login' && method === 'POST') {
      const correo = String(body.email ?? '').trim().toLowerCase()
      const u = db.users.find((x) => x.email.toLowerCase() === correo)
      if (!u || u.password !== body.password) throw new Http(401, 'Correo o contraseña incorrectos.')
      return [200, { token: tokenDe(u), tokenType: 'Bearer', expiresIn: 28800, user: sinClave(u) }]
    }
    if (partes[1] === 'registro' && method === 'POST') {
      validarUsuario(body, { crear: true })
      const nuevo = aUsuario(body, 'Cliente')
      db.users.push(nuevo)
      return [201, sinClave(nuevo)]
    }
    if (partes[1] === 'me') {
      exigir(usuario)
      if (method === 'GET') return [200, sinClave(usuario)]
      if (method === 'PUT') {
        validarUsuario({ ...body, run: usuario.run }, { crear: false, run: usuario.run })
        Object.assign(usuario, aUsuario({ ...body, password: body.password || usuario.password, run: usuario.run }, usuario.role))
        return [200, sinClave(usuario)]
      }
    }
  }

  // Categorías
  if (recurso === 'categorias') {
    if (esLectura && !id) return [200, db.categories]
    if (esLectura) {
      const c = db.categories.find((x) => x.id === id)
      if (!c) throw noEncontrado(`La categoría "${id}" no existe.`)
      return [200, c]
    }
    exigir(usuario, 'Administrador')
    if (method === 'POST') {
      const nueva = { id: slugify(body.name), name: body.name, icon: body.icon, description: body.description }
      if (db.categories.some((c) => c.id === nueva.id || c.name.toLowerCase() === body.name.toLowerCase())) {
        throw conflicto('Ya existe una categoría con ese nombre.', { name: 'Ya existe una categoría con ese nombre.' })
      }
      db.categories.push(nueva)
      return [201, nueva]
    }
    const c = db.categories.find((x) => x.id === id)
    if (!c) throw noEncontrado(`La categoría "${id}" no existe.`)
    if (method === 'PUT') {
      Object.assign(c, { name: body.name, icon: body.icon, description: body.description })
      return [200, c]
    }
    if (method === 'DELETE') {
      if (db.products.some((p) => p.categoryId === id)) throw conflicto('No se puede eliminar: la categoría tiene productos.')
      db.categories = db.categories.filter((x) => x.id !== id)
      return [204, null]
    }
  }

  // Productos
  if (recurso === 'productos') {
    if (esLectura && !id) return [200, db.products]
    if (esLectura) {
      const p = db.products.find((x) => x.id === id)
      if (!p) throw noEncontrado(`El producto "${id}" no existe.`)
      return [200, p]
    }
    exigir(usuario, 'Administrador')
    if (method === 'POST') {
      if (db.products.some((p) => p.id === body.id)) {
        throw conflicto('Ya existe un producto con este código.', { id: 'Ya existe un producto con este código.' })
      }
      db.products.push({ ...body })
      return [201, body]
    }
    const p = db.products.find((x) => x.id === id)
    if (!p) throw noEncontrado(`El producto "${id}" no existe.`)
    if (method === 'PUT') {
      Object.assign(p, body, { id })
      return [200, p]
    }
    if (method === 'DELETE') {
      if (db.orders.some((o) => o.items.some((i) => i.productId === id))) {
        throw conflicto('No se puede eliminar: el producto tiene ventas registradas.')
      }
      db.products = db.products.filter((x) => x.id !== id)
      return [204, null]
    }
  }

  // Usuarios (solo Administrador)
  if (recurso === 'usuarios') {
    exigir(usuario, 'Administrador')
    if (esLectura && !id) return [200, db.users.map(sinClave)]
    if (method === 'POST') {
      validarUsuario(body, { crear: true })
      const nuevo = aUsuario(body, body.role)
      db.users.push(nuevo)
      return [201, sinClave(nuevo)]
    }
    const u = db.users.find((x) => x.run === id)
    if (!u) throw noEncontrado(`El usuario "${id}" no existe.`)
    if (esLectura) return [200, sinClave(u)]
    const admins = db.users.filter((x) => x.role === 'Administrador')
    if (method === 'PUT') {
      validarUsuario({ ...body, run: id }, { crear: false, run: id })
      const rol = body.role ?? u.role
      if (u.role === 'Administrador' && rol !== 'Administrador' && admins.length <= 1) {
        throw conflicto('Debe existir al menos un administrador.', { role: 'Debe existir al menos un administrador.' })
      }
      Object.assign(u, aUsuario({ ...body, password: body.password || u.password, run: id }, rol))
      return [200, sinClave(u)]
    }
    if (method === 'DELETE') {
      if (u.role === 'Administrador' && admins.length <= 1) throw conflicto('Debe existir al menos un administrador.')
      db.users = db.users.filter((x) => x.run !== id)
      db.orders.forEach((o) => {
        if (o.userRun === id) o.userRun = null
      })
      return [204, null]
    }
  }

  // Boletas (órdenes)
  if (recurso === 'boletas') {
    if (method === 'POST') return [201, crearBoleta(body, usuario)]
    exigir(usuario, 'Administrador', 'Vendedor')
    if (esLectura && !id) return [200, [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))]
    if (esLectura) {
      const o = db.orders.find((x) => x.number === id)
      if (!o) throw noEncontrado(`La boleta "${id}" no existe.`)
      return [200, o]
    }
  }

  throw noEncontrado('Recurso no encontrado.')
}

/** Reemplazo de fetch: se instala en setupTests.js. */
export async function fakeFetch(url, opciones = {}) {
  const { method = 'GET', headers = {}, body } = opciones
  if (db.offline) throw new TypeError('Failed to fetch')
  if (db.latenciaMs > 0) await new Promise((resolver) => setTimeout(resolver, db.latenciaMs))
  const prefijo = `${API_URL}${API_PREFIX}`
  const ruta = String(url).startsWith(prefijo) ? String(url).slice(prefijo.length) : null
  if (ruta === null) throw new Error(`Petición inesperada fuera del backend: ${url}`)

  const datos = body ? JSON.parse(body) : undefined
  db.calls.push({ method, path: ruta, auth: headers.Authorization ?? null, body: datos })
  const usuario = usuarioDelToken(headers)
  try {
    const [status, cuerpo] = atender(method, ruta, datos ?? {}, usuario)
    return respuesta(status, clonar(cuerpo), ruta)
  } catch (error) {
    if (!(error instanceof Http)) throw error
    return respuesta(error.status, { message: error.message, errors: error.errors }, ruta)
  }
}
