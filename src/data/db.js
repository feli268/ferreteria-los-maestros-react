// "Base de datos" simulada del proyecto: una colección (tabla) por entidad.
// Cada repositorio ofrece las operaciones CRUD: create, getAll/getById/find, update y remove.
import { createRepository } from './createRepository'
import { initialCategories, initialOrders, initialProducts, initialUsers } from './seed'
import { storage } from './storage'

export const categoryRepository = createRepository({ key: 'categories', seed: initialCategories })
export const productRepository = createRepository({ key: 'products', seed: initialProducts })
export const userRepository = createRepository({ key: 'users', seed: initialUsers, idField: 'run' })
export const orderRepository = createRepository({ key: 'orders', seed: initialOrders, idField: 'number' })
export const messageRepository = createRepository({ key: 'messages', seed: [], idField: 'id' })

export const repositories = [
  categoryRepository,
  productRepository,
  userRepository,
  orderRepository,
  messageRepository,
]

/** Restaura todas las tablas a sus datos iniciales y borra sesión y carrito. */
export function resetDatabase() {
  storage.remove('session')
  storage.remove('cart')
  repositories.forEach((repo) => repo.reset())
}
