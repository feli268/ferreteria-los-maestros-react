// Mensajes del formulario de contacto (se guardan en la base de datos simulada).
import { MESSAGE_MAX_LENGTH } from '../data/catalogs'
import { messageRepository } from '../data/db'
import { collectErrors, validateEmail, validateRequired } from '../utils/validators'

export function validateContactForm(data) {
  return collectErrors({
    name: validateRequired(data.name, 'El nombre', 100),
    email: validateEmail(data.email),
    message: validateRequired(data.message, 'El comentario', MESSAGE_MAX_LENGTH),
  })
}

export const messageService = {
  send(data) {
    const errors = validateContactForm(data)
    if (Object.keys(errors).length > 0) return { ok: false, errors }
    const message = messageRepository.create({
      id: `MSG-${Date.now()}-${messageRepository.getAll().length + 1}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      message: data.message.trim(),
      createdAt: new Date().toISOString(),
    })
    return { ok: true, message }
  },
}
