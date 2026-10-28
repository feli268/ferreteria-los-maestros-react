import { describe, expect, it } from 'vitest'
import { formatCLP, formatDate, formatRun, slugify } from './format'

describe('format', () => {
  it('formatCLP agrega separador de miles y signo $', () => {
    expect(formatCLP(5990)).toBe('$5.990')
    expect(formatCLP(1234567)).toBe('$1.234.567')
    expect(formatCLP(0)).toBe('$0')
  })

  it('formatCLP redondea, acepta texto y maneja negativos y valores inválidos', () => {
    expect(formatCLP('4990')).toBe('$4.990')
    expect(formatCLP(1499.6)).toBe('$1.500')
    expect(formatCLP(-2500)).toBe('-$2.500')
    expect(formatCLP(undefined)).toBe('$0')
  })

  it('formatDate entrega dd-mm-aaaa y vacío si la fecha es inválida', () => {
    expect(formatDate('2026-10-15T15:00:00')).toBe('15-10-2026')
    expect(formatDate('no-es-fecha')).toBe('')
  })

  it('slugify quita tildes, símbolos y espacios', () => {
    expect(slugify('Mat. Construcción')).toBe('mat-construccion')
    expect(slugify('  Gasfitería & Agua  ')).toBe('gasfiteria-agua')
  })

  it('formatRun separa miles y guion', () => {
    expect(formatRun('123456785')).toBe('12.345.678-5')
    expect(formatRun('12.345.678-k')).toBe('12.345.678-K')
    expect(formatRun('5')).toBe('5')
  })
})
