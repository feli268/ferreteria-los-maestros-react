import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GATEWAY_DELAY_MS, paymentGateway } from './paymentGateway'

describe('paymentGateway (simulada)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const cobrar = async (pago) => {
    const promesa = paymentGateway.charge(pago)
    await vi.advanceTimersByTimeAsync(GATEWAY_DELAY_MS)
    return promesa
  }

  it('aprueba una tarjeta normal y entrega un identificador de transacción', async () => {
    const r = await cobrar({ amount: 10000, method: 'tarjeta' })
    expect(r.approved).toBe(true)
    expect(r.transactionId).toMatch(/^TX-/)
  })

  it('rechaza la tarjeta de prueba rechazada', async () => {
    const r = await cobrar({ amount: 10000, method: 'tarjeta-rechazada' })
    expect(r.approved).toBe(false)
    expect(r.reason).toMatch(/rechazado/)
  })

  it('rechaza montos inválidos', async () => {
    expect((await cobrar({ amount: 0, method: 'tarjeta' })).approved).toBe(false)
  })

  it('espera antes de responder (simula la demora del banco)', async () => {
    let respondio = false
    paymentGateway.charge({ amount: 5000, method: 'transferencia' }).then(() => (respondio = true))
    await vi.advanceTimersByTimeAsync(GATEWAY_DELAY_MS - 1)
    expect(respondio).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(respondio).toBe(true)
  })
})
