import { describe, expect, it } from 'vitest'
import {
  calculateDv,
  cleanRun,
  collectErrors,
  validateCriticalStock,
  validateDiscount,
  validateEmail,
  validateNonNegativeInteger,
  validatePassword,
  validatePasswordConfirm,
  validatePrice,
  validateProductCode,
  validateRegionComuna,
  validateRequired,
  validateRun,
} from './validators'

describe('validators - RUN', () => {
  it('cleanRun quita puntos y guion y pasa a mayúscula', () => {
    expect(cleanRun('12.345.678-k')).toBe('12345678K')
    expect(cleanRun(null)).toBe('')
  })

  it('calculateDv usa módulo 11 (incluye K y 0)', () => {
    expect(calculateDv('12345678')).toBe('5')
    expect(calculateDv('11111111')).toBe('1')
    expect(calculateDv('6')).toBe('K')
    expect(calculateDv('14')).toBe('0')
  })

  it('acepta RUN válidos con o sin formato', () => {
    expect(validateRun('123456785').valid).toBe(true)
    expect(validateRun('12.345.678-5')).toEqual({ valid: true, cleanRun: '123456785' })
    expect(validateRun('111111111').valid).toBe(true)
  })

  it('rechaza RUN vacío, corto, largo, no numérico o con dígito verificador malo', () => {
    expect(validateRun('').valid).toBe(false)
    expect(validateRun('12345').message).toMatch(/entre 7 y 9/)
    expect(validateRun('1234567890').valid).toBe(false)
    expect(validateRun('12A45678K').message).toMatch(/solo dígitos/)
    expect(validateRun('123456789').message).toMatch(/verificador/)
  })
})

describe('validators - correo y contraseña', () => {
  it('solo permite los dominios autorizados', () => {
    expect(validateEmail('ana@duoc.cl').valid).toBe(true)
    expect(validateEmail('ana@profesor.duoc.cl').valid).toBe(true)
    expect(validateEmail('ANA@GMAIL.COM').valid).toBe(true)
    expect(validateEmail('ana@hotmail.com').message).toMatch(/Solo se permiten/)
  })

  it('rechaza correo vacío, mal formado o de más de 100 caracteres', () => {
    expect(validateEmail('').valid).toBe(false)
    expect(validateEmail('sin-arroba').message).toMatch(/Formato/)
    expect(validateEmail(`${'a'.repeat(95)}@gmail.com`).message).toMatch(/100/)
  })

  it('la contraseña debe tener entre 4 y 10 caracteres', () => {
    expect(validatePassword('abc').valid).toBe(false)
    expect(validatePassword('abcd').valid).toBe(true)
    expect(validatePassword('1234567890').valid).toBe(true)
    expect(validatePassword('12345678901').valid).toBe(false)
    expect(validatePassword('').valid).toBe(false)
  })

  it('la confirmación debe coincidir', () => {
    expect(validatePasswordConfirm('abcd', 'abcd').valid).toBe(true)
    expect(validatePasswordConfirm('abcd', 'abce').message).toMatch(/no coinciden/)
    expect(validatePasswordConfirm('abcd', '').valid).toBe(false)
  })
})

describe('validators - otros campos', () => {
  it('validateRequired exige texto y respeta el máximo', () => {
    expect(validateRequired('  ', 'El nombre').message).toBe('El nombre es obligatorio.')
    expect(validateRequired('a'.repeat(11), 'El nombre', 10).valid).toBe(false)
    expect(validateRequired('Ana', 'El nombre', 10).valid).toBe(true)
  })

  it('región y comuna deben ser coherentes', () => {
    expect(validateRegionComuna('', '').valid).toBe(false)
    expect(validateRegionComuna('Región de Coquimbo', '').message).toMatch(/comuna/)
    expect(validateRegionComuna('Región de Coquimbo', 'Santiago').valid).toBe(false)
    expect(validateRegionComuna('Región de Coquimbo', 'La Serena').valid).toBe(true)
    expect(validateRegionComuna('Atlántida', 'X').message).toMatch(/Región no válida/)
  })

  it('precio y stock: entero mayor o igual a 0', () => {
    expect(validatePrice('').valid).toBe(false)
    expect(validatePrice('abc').message).toMatch(/número/)
    expect(validatePrice('10.5').message).toMatch(/entero/)
    expect(validatePrice(-1).message).toMatch(/mayor o igual a 0/)
    expect(validatePrice(0).valid).toBe(true)
    expect(validateNonNegativeInteger(25, 'El valor').valid).toBe(true)
  })

  it('el stock crítico vacío se toma como 0', () => {
    expect(validateCriticalStock('').valid).toBe(true)
    expect(validateCriticalStock(-2).valid).toBe(false)
  })

  it('el descuento no puede superar el 90%', () => {
    expect(validateDiscount(90).valid).toBe(true)
    expect(validateDiscount(91).message).toMatch(/90%/)
    expect(validateDiscount('').valid).toBe(true)
  })

  it('el código de producto admite letras, números y guion (3 a 12)', () => {
    expect(validateProductCode('MC001').valid).toBe(true)
    expect(validateProductCode('ab').valid).toBe(false)
    expect(validateProductCode('a'.repeat(13)).valid).toBe(false)
    expect(validateProductCode('MC 001').valid).toBe(false)
  })

  it('collectErrors deja solo los campos inválidos', () => {
    const errores = collectErrors({
      a: { valid: true },
      b: { valid: false, message: 'Mal' },
    })
    expect(errores).toEqual({ b: 'Mal' })
  })
})
