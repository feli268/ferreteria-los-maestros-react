// Un módulo por recurso del backend. Cada función corresponde a un endpoint REST (/api/v1/...).
// Los permisos por rol los valida el backend (Spring Security); aquí solo se hacen las llamadas.
import { request } from './http'

const enc = encodeURIComponent

/** Autenticación: POST /auth/login, POST /auth/registro, GET|PUT /auth/me */
export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  registro: (datos) => request('/auth/registro', { method: 'POST', body: datos }),
  yo: () => request('/auth/me'),
  actualizarPerfil: (datos) => request('/auth/me', { method: 'PUT', body: datos }),
}

/** Categorías: lectura pública; crear, editar y borrar solo Administrador. */
export const categoriasApi = {
  listar: () => request('/categorias'),
  obtener: (id) => request(`/categorias/${enc(id)}`),
  crear: (datos) => request('/categorias', { method: 'POST', body: datos }),
  actualizar: (id, datos) => request(`/categorias/${enc(id)}`, { method: 'PUT', body: datos }),
  eliminar: (id) => request(`/categorias/${enc(id)}`, { method: 'DELETE' }),
}

/** Productos: lectura pública; crear, editar y borrar solo Administrador. */
export const productosApi = {
  listar: () => request('/productos'),
  obtener: (id) => request(`/productos/${enc(id)}`),
  crear: (datos) => request('/productos', { method: 'POST', body: datos }),
  actualizar: (id, datos) => request(`/productos/${enc(id)}`, { method: 'PUT', body: datos }),
  eliminar: (id) => request(`/productos/${enc(id)}`, { method: 'DELETE' }),
}

/** Usuarios: todo el CRUD es solo para Administrador. */
export const usuariosApi = {
  listar: () => request('/usuarios'),
  obtener: (run) => request(`/usuarios/${enc(run)}`),
  crear: (datos) => request('/usuarios', { method: 'POST', body: datos }),
  actualizar: (run, datos) => request(`/usuarios/${enc(run)}`, { method: 'PUT', body: datos }),
  eliminar: (run) => request(`/usuarios/${enc(run)}`, { method: 'DELETE' }),
}

/** Boletas (órdenes): comprar es público; listar y ver detalle, Administrador y Vendedor. */
export const boletasApi = {
  listar: () => request('/boletas'),
  obtener: (numero) => request(`/boletas/${enc(numero)}`),
  crear: (compra) => request('/boletas', { method: 'POST', body: compra }),
}
