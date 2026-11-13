import { describe, expect, it, vi } from 'vitest'
import { createRemoteRepository } from './createRemoteRepository'

const filas = [
  { id: 'A', nombre: 'Alfa' },
  { id: 'B', nombre: 'Beta' },
]
const crear = (fetchAll = vi.fn().mockResolvedValue(filas)) => ({
  repo: createRemoteRepository({ key: 'prueba', fetchAll }),
  fetchAll,
})

describe('createRemoteRepository (copia en memoria de la base de datos del backend)', () => {
  it('parte vacío y sin cargar', () => {
    const { repo } = crear()
    expect(repo.getAll()).toEqual([])
    expect(repo.status).toBe('idle')
  })

  it('refresh pide la lista al backend, la guarda y deja status "ready"', async () => {
    const { repo, fetchAll } = crear()
    await repo.refresh()
    expect(fetchAll).toHaveBeenCalledTimes(1)
    expect(repo.status).toBe('ready')
    expect(repo.getAll()).toEqual(filas)
    expect(repo.getById('B').nombre).toBe('Beta')
    expect(repo.getById('Z')).toBeNull()
    expect(repo.find((r) => r.nombre.startsWith('A'))).toHaveLength(1)
  })

  it('pasa por "loading" mientras espera y avisa a los suscritos', async () => {
    const { repo } = crear()
    const estados = []
    repo.subscribe(() => estados.push(repo.status))
    await repo.refresh()
    expect(estados).toEqual(['loading', 'ready'])
  })

  it('si el backend falla queda en "error" con el motivo y conserva lo que tenía', async () => {
    const fetchAll = vi.fn().mockResolvedValueOnce(filas).mockRejectedValueOnce(new Error('sin conexión'))
    const { repo } = crear(fetchAll)
    await repo.refresh()
    await repo.refresh()
    expect(repo.status).toBe('error')
    expect(repo.error.message).toBe('sin conexión')
    expect(repo.getAll()).toEqual(filas)
  })

  it('upsert agrega o reemplaza un registro y getAll cambia de referencia', async () => {
    const { repo } = crear()
    await repo.refresh()
    const antes = repo.getAll()
    repo.upsert({ id: 'C', nombre: 'Gamma' })
    repo.upsert({ id: 'A', nombre: 'Alfa 2' })
    expect(repo.getAll()).toHaveLength(3)
    expect(repo.getById('A').nombre).toBe('Alfa 2')
    expect(repo.getAll()).not.toBe(antes)
  })

  it('drop quita un registro y devuelve si existía', async () => {
    const { repo } = crear()
    await repo.refresh()
    expect(repo.drop('A')).toBe(true)
    expect(repo.drop('A')).toBe(false)
    expect(repo.getAll()).toHaveLength(1)
  })

  it('clear vacía la lista y vuelve a "idle"', async () => {
    const { repo } = crear()
    await repo.refresh()
    repo.clear()
    expect(repo.getAll()).toEqual([])
    expect(repo.status).toBe('idle')
  })

  it('una respuesta que llega después de clear() se descarta (p. ej. se cerró la sesión mientras cargaba)', async () => {
    let responder
    const { repo } = crear(vi.fn(() => new Promise((resolve) => (responder = resolve))))
    const carga = repo.refresh()
    repo.clear()
    responder(filas)
    await carga
    expect(repo.getAll()).toEqual([])
    expect(repo.status).toBe('idle')
  })

  it('hydrate carga datos conocidos sin llamar al backend', () => {
    const { repo, fetchAll } = crear()
    repo.hydrate(filas)
    expect(repo.status).toBe('ready')
    expect(repo.getAll()).toHaveLength(2)
    expect(fetchAll).not.toHaveBeenCalled()
  })

  it('usa el campo idField indicado como identificador', () => {
    const repo = createRemoteRepository({ key: 'usuarios', idField: 'run', fetchAll: async () => [] })
    repo.upsert({ run: '1', nombre: 'Ana' })
    expect(repo.getById('1').nombre).toBe('Ana')
  })
})
