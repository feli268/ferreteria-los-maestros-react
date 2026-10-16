// Conecta un repositorio (base de datos simulada) con React: el componente se
// vuelve a renderizar cada vez que alguien hace create/update/remove sobre la tabla.
import { useEffect, useState } from 'react'
import {
  categoryRepository,
  messageRepository,
  orderRepository,
  productRepository,
  userRepository,
} from '../data/db'

export function useRepository(repository) {
  const [data, setData] = useState(() => repository.getAll())

  useEffect(() => {
    // Por si hubo cambios entre el primer render y la suscripción.
    setData(repository.getAll())
    return repository.subscribe(() => setData(repository.getAll()))
  }, [repository])

  return data
}

export const useProducts = () => useRepository(productRepository)
export const useCategories = () => useRepository(categoryRepository)
export const useUsers = () => useRepository(userRepository)
export const useOrders = () => useRepository(orderRepository)
export const useMessages = () => useRepository(messageRepository)
