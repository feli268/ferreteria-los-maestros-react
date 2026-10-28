import { describe, expect, it } from 'vitest'
import { messageRepository } from '../data/db'
import { messageService, validateContactForm } from './messageService'

describe('messageService (formulario de contacto)', () => {
  it('guarda un mensaje válido con fecha e identificador', () => {
    const r = messageService.send({ name: 'Ana', email: 'ANA@gmail.com', message: ' Hola, quiero cotizar. ' })
    expect(r.ok).toBe(true)
    expect(r.message.email).toBe('ana@gmail.com')
    expect(r.message.message).toBe('Hola, quiero cotizar.')
    expect(messageRepository.getAll()).toHaveLength(1)
  })

  it('valida nombre, correo y comentario', () => {
    const errores = validateContactForm({ name: '', email: 'x@yahoo.com', message: '' })
    expect(Object.keys(errores).sort()).toEqual(['email', 'message', 'name'])
  })

  it('el comentario admite como máximo 500 caracteres', () => {
    expect(validateContactForm({ name: 'A', email: 'a@gmail.com', message: 'x'.repeat(500) })).toEqual({})
    expect(validateContactForm({ name: 'A', email: 'a@gmail.com', message: 'x'.repeat(501) }).message).toMatch(/500/)
  })

  it('no guarda nada si hay errores', () => {
    const r = messageService.send({ name: '', email: '', message: '' })
    expect(r.ok).toBe(false)
    expect(messageRepository.getAll()).toHaveLength(0)
  })
})
