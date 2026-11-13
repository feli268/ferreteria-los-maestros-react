import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

function Contador({ onCambio }) {
  const [n, setN] = useState(0)
  return (
    <div>
      <p>Valor: {n}</p>
      <button
        onClick={() => {
          setN(n + 1)
          onCambio(n + 1)
        }}
      >
        Sumar
      </button>
    </div>
  )
}

describe('Entorno de pruebas (humo)', () => {
  it('renderiza un componente y simula un clic con un mock de Vitest', async () => {
    const onCambio = vi.fn()
    const usuario = userEvent.setup()
    render(<Contador onCambio={onCambio} />)

    await usuario.click(screen.getByRole('button', { name: 'Sumar' }))

    expect(screen.getByText('Valor: 1')).toBeInTheDocument()
    expect(onCambio).toHaveBeenCalledWith(1)
    expect(onCambio).toHaveBeenCalledTimes(1)
  })

  it('vi.spyOn reemplaza un método y se restaura al terminar', () => {
    const calculadora = { doble: (x) => x * 2 }
    vi.spyOn(calculadora, 'doble').mockReturnValue(99)
    expect(calculadora.doble(2)).toBe(99)
  })

  it('el backend falso parte limpio en cada prueba', async () => {
    const { fakeDb } = await import('./fakeBackend')
    fakeDb().products.find((p) => p.id === 'MC001').stock = 1
    expect(fakeDb().products.find((p) => p.id === 'MC001').stock).toBe(1)
  })

  it('...y la modificación anterior no se arrastra a esta prueba', async () => {
    const { fakeDb } = await import('./fakeBackend')
    const { productRepository } = await import('../data/db')
    expect(fakeDb().products.find((p) => p.id === 'MC001').stock).toBe(80)
    expect(productRepository.getById('MC001').stock).toBe(80) // el catálogo ya viene cargado
  })

  it('fetch está reemplazado por el backend falso: las pruebas no salen a internet', async () => {
    const respuesta = await fetch('http://localhost:8080/api/v1/categorias')
    expect(respuesta.ok).toBe(true)
    expect(await respuesta.json()).toHaveLength(5)
  })
})
