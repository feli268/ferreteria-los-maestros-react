import { describe, expect, it, vi } from 'vitest'
import { createRepository } from './createRepository'

const crearRepo = () =>
  createRepository({
    key: 'prueba',
    seed: [
      { id: 'A', nombre: 'Alfa', cantidad: 1 },
      { id: 'B', nombre: 'Beta', cantidad: 2 },
    ],
  })

describe('createRepository (CRUD sobre localStorage)', () => {
  it('READ: carga los datos iniciales la primera vez y los persiste', () => {
    const repo = crearRepo()
    expect(repo.getAll()).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem('lm_prueba'))).toHaveLength(2)
  })

  it('READ: getById devuelve el registro o null; find filtra', () => {
    const repo = crearRepo()
    expect(repo.getById('B').nombre).toBe('Beta')
    expect(repo.getById('Z')).toBeNull()
    expect(repo.find((r) => r.cantidad > 1)).toHaveLength(1)
  })

  it('CREATE: agrega un registro nuevo', () => {
    const repo = crearRepo()
    repo.create({ id: 'C', nombre: 'Gamma', cantidad: 3 })
    expect(repo.getAll()).toHaveLength(3)
    expect(repo.getById('C').nombre).toBe('Gamma')
  })

  it('CREATE: rechaza un id repetido o faltante', () => {
    const repo = crearRepo()
    expect(() => repo.create({ id: 'A', nombre: 'Otra' })).toThrow(/Ya existe/)
    expect(() => repo.create({ nombre: 'Sin id' })).toThrow(/Falta/)
  })

  it('UPDATE: modifica campos y no permite cambiar el id', () => {
    const repo = crearRepo()
    const actualizado = repo.update('A', { nombre: 'Alfa 2', id: 'X' })
    expect(actualizado.nombre).toBe('Alfa 2')
    expect(actualizado.id).toBe('A')
    expect(repo.getById('X')).toBeNull()
  })

  it('UPDATE: falla si el registro no existe', () => {
    expect(() => crearRepo().update('Z', { nombre: 'x' })).toThrow(/No existe/)
  })

  it('DELETE: elimina y avisa si el registro existía', () => {
    const repo = crearRepo()
    expect(repo.remove('A')).toBe(true)
    expect(repo.remove('A')).toBe(false)
    expect(repo.getAll()).toHaveLength(1)
  })

  it('es inmutable: getAll devuelve el mismo arreglo hasta que algo cambia', () => {
    const repo = crearRepo()
    const antes = repo.getAll()
    expect(repo.getAll()).toBe(antes)
    repo.update('A', { cantidad: 10 })
    expect(repo.getAll()).not.toBe(antes)
    expect(antes[0].cantidad).toBe(1)
  })

  it('subscribe: avisa en cada escritura y permite cancelar', () => {
    const repo = crearRepo()
    const oyente = vi.fn()
    const cancelar = repo.subscribe(oyente)
    repo.create({ id: 'C' })
    repo.update('C', { nombre: 'c' })
    repo.remove('C')
    expect(oyente).toHaveBeenCalledTimes(3)
    cancelar()
    repo.create({ id: 'D' })
    expect(oyente).toHaveBeenCalledTimes(3)
  })

  it('reset: vuelve a los datos iniciales', () => {
    const repo = crearRepo()
    repo.remove('A')
    repo.reset()
    expect(repo.getAll()).toHaveLength(2)
  })

  it('sincroniza con otra pestaña cuando cambia localStorage (evento storage)', () => {
    const repo = crearRepo()
    repo.getAll()
    const oyente = vi.fn()
    repo.subscribe(oyente)
    localStorage.setItem('lm_prueba', JSON.stringify([{ id: 'Q', nombre: 'Externo' }]))
    window.dispatchEvent(new StorageEvent('storage', { key: 'lm_prueba' }))
    expect(oyente).toHaveBeenCalled()
    expect(repo.getAll()).toEqual([{ id: 'Q', nombre: 'Externo' }])
  })

  it('usa los datos iniciales si el JSON guardado está dañado', () => {
    localStorage.setItem('lm_prueba', '{no es json')
    expect(crearRepo().getAll()).toHaveLength(2)
  })
})
