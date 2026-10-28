// Pruebas del acceso a localStorage: funciona con datos válidos y no se cae si el
// almacenamiento está lleno, bloqueado o tiene datos dañados.
import { describe, expect, it, vi } from 'vitest'
import { storage } from './storage'

describe('storage', () => {
  it('guarda y recupera valores con el prefijo lm_', () => {
    expect(storage.set('prueba', { a: 1 })).toBe(true)
    expect(localStorage.getItem('lm_prueba')).toBe('{"a":1}')
    expect(storage.get('prueba')).toEqual({ a: 1 })
  })

  it('devuelve el valor por defecto si la clave no existe', () => {
    expect(storage.get('nada')).toBeNull()
    expect(storage.get('nada', [])).toEqual([])
  })

  it('devuelve el valor por defecto si el JSON está dañado', () => {
    localStorage.setItem('lm_roto', '{no es json')
    expect(storage.get('roto', 'respaldo')).toBe('respaldo')
  })

  it('remove y clearAll solo tocan las claves de la aplicación', () => {
    storage.set('a', 1)
    storage.set('b', 2)
    localStorage.setItem('otra-app', 'x')
    storage.remove('a')
    expect(storage.get('a')).toBeNull()
    storage.clearAll()
    expect(storage.get('b')).toBeNull()
    expect(localStorage.getItem('otra-app')).toBe('x')
  })

  it('set devuelve false si el almacenamiento está lleno', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Cuota excedida', 'QuotaExceededError')
    })
    expect(storage.set('x', 1)).toBe(false)
  })

  it('get, remove y clearAll no lanzan errores si localStorage no está disponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(storage.get('x', 'por defecto')).toBe('por defecto')
    expect(() => storage.remove('x')).not.toThrow()
    expect(() => storage.clearAll()).not.toThrow()
  })
})
