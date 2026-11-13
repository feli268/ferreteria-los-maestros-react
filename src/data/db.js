// Acceso a los datos de la aplicación.
// Categorías, productos, usuarios y órdenes (boletas) viven en la base de datos del backend:
// cada "repositorio remoto" es una copia en memoria que se llena con la API REST.
// Los mensajes del formulario de contacto no forman parte del modelo del backend y siguen en localStorage.
import { boletasApi, categoriasApi, productosApi, usuariosApi } from '../api'
import { createRemoteRepository } from './createRemoteRepository'
import { createRepository } from './createRepository'
import { storage } from './storage'

export const categoryRepository = createRemoteRepository({ key: 'categories', fetchAll: categoriasApi.listar })
export const productRepository = createRemoteRepository({ key: 'products', fetchAll: productosApi.listar })
export const userRepository = createRemoteRepository({ key: 'users', idField: 'run', fetchAll: usuariosApi.listar })
export const orderRepository = createRemoteRepository({ key: 'orders', idField: 'number', fetchAll: boletasApi.listar })
export const messageRepository = createRepository({ key: 'messages', seed: [], idField: 'id' })

/** Datos que puede ver cualquier visitante de la tienda. */
export const publicRepositories = [categoryRepository, productRepository]
/** Datos que solo cargan Administrador (usuarios y órdenes) y Vendedor (órdenes). */
export const staffRepositories = [userRepository, orderRepository]

/** Olvida los datos privados (usuarios y órdenes): se usa al cerrar sesión. */
export function clearPrivateData() {
  staffRepositories.forEach((repo) => repo.clear())
  storage.remove('last_order')
}

/** Vacía todas las copias locales, la sesión y el carrito. */
export function resetDatabase() {
  storage.remove('session')
  storage.remove('cart')
  storage.remove('last_order')
  ;[...publicRepositories, ...staffRepositories].forEach((repo) => repo.clear())
  messageRepository.reset()
}
