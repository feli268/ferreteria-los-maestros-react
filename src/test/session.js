// Ayudas de las pruebas para dejar listo el estado del frontend sin pasar por la pantalla de login.
import { ROLES } from '../data/catalogs'
import { categoryRepository, orderRepository, productRepository, userRepository } from '../data/db'
import { storage } from '../data/storage'
import { fakeDb, tokenDe } from './fakeBackend'

const copia = (valor) => JSON.parse(JSON.stringify(valor))
const sinClave = ({ password, ...usuario }) => usuario

/** Catálogo público (categorías y productos) ya cargado, como si el backend hubiera respondido. */
export function cargarCatalogo() {
  categoryRepository.hydrate(copia(fakeDb().categories))
  productRepository.hydrate(copia(fakeDb().products))
}

/** Datos privados que carga cada rol: el Administrador, usuarios y órdenes; el Vendedor, solo órdenes. */
export function cargarDatosPrivados(rol) {
  if (rol === ROLES.ADMIN) {
    userRepository.hydrate(copia(fakeDb().users.map(sinClave)))
    orderRepository.hydrate(copia(fakeDb().orders))
  } else if (rol === ROLES.SELLER) {
    orderRepository.hydrate(copia(fakeDb().orders))
  }
}

/**
 * Deja una sesión iniciada (token + usuario guardados en localStorage) y los datos del rol ya cargados.
 * @param {string} correoORun correo o RUN de un usuario de la base de datos del backend falso
 */
export function iniciarSesion(correoORun) {
  const usuario = fakeDb().users.find((u) => u.email === correoORun || u.run === correoORun)
  if (!usuario) throw new Error(`No existe el usuario de prueba "${correoORun}".`)
  storage.set('session', { token: tokenDe(usuario), user: sinClave(usuario), expiresAt: Date.now() + 3_600_000 })
  cargarDatosPrivados(usuario.role)
  return sinClave(usuario)
}
