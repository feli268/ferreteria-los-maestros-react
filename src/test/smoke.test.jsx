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

  it('la base de datos simulada parte limpia en cada prueba', async () => {
    const { productRepository } = await import('../data/db')
    productRepository.update('MC001', { stock: 1 })
    expect(productRepository.getById('MC001').stock).toBe(1)
  })

  it('...y la modificación anterior no se arrastra a esta prueba', async () => {
    const { productRepository } = await import('../data/db')
    expect(productRepository.getById('MC001').stock).toBe(80)
  })
})
