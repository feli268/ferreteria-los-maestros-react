import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { productRepository, userRepository } from '../data/db'
import { AuthProvider, useAuth } from './AuthContext'
import { CartProvider, useCart } from './CartContext'
import { ToastProvider, useToast } from './ToastContext'

const wrapper = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  </ToastProvider>
)

describe('CartContext', () => {
  it('agrega productos y calcula cantidad y total', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addItem('MC001', 2)
      result.current.addItem('MC003', 1)
    })
    expect(result.current.count).toBe(3)
    expect(result.current.totals.total).toBe(2 * 5990 + 5200)
    expect(result.current.lines).toHaveLength(2)
  })

  it('al agregar el mismo producto suma la cantidad (varias acciones seguidas)', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addItem('MC001')
      result.current.addItem('MC001')
      result.current.addItem('MC001')
    })
    expect(result.current.items).toEqual([{ id: 'MC001', qty: 3 }])
  })

  it('nunca supera el stock disponible y avisa que fue limitado', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    let respuesta
    act(() => {
      respuesta = result.current.addItem('HE004', 10) // stock 3
    })
    expect(respuesta.limited).toBe(true)
    expect(result.current.items[0].qty).toBe(3)
  })

  it('no permite agregar un producto agotado (error de la entrega 1)', () => {
    productRepository.update('MC001', { stock: 0 })
    const { result } = renderHook(() => useCart(), { wrapper })
    let respuesta
    act(() => {
      respuesta = result.current.addItem('MC001')
    })
    expect(respuesta.ok).toBe(false)
    expect(respuesta.message).toMatch(/agotado/)
    expect(result.current.count).toBe(0)
  })

  it('addItem falla si el producto no existe', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    let respuesta
    act(() => {
      respuesta = result.current.addItem('NOEXISTE')
    })
    expect(respuesta.ok).toBe(false)
  })

  it('setQuantity respeta el stock y 0 elimina el ítem', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem('HE002', 1)) // stock 8
    act(() => result.current.setQuantity('HE002', 50))
    expect(result.current.items[0].qty).toBe(8)
    act(() => result.current.setQuantity('HE002', 0))
    expect(result.current.items).toHaveLength(0)
  })

  it('removeItem y clear vacían el carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addItem('MC001')
      result.current.addItem('MC003')
    })
    act(() => result.current.removeItem('MC001'))
    expect(result.current.items.map((i) => i.id)).toEqual(['MC003'])
    act(() => result.current.clear())
    expect(result.current.count).toBe(0)
  })

  it('cupón válido aplica 10% y uno inválido se rechaza', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem('MC001', 1))
    let r
    act(() => {
      r = result.current.applyCoupon('xyz')
    })
    expect(r.ok).toBe(false)
    expect(result.current.couponPercent).toBe(0)
    act(() => {
      r = result.current.applyCoupon(' contratista10 ')
    })
    expect(r.ok).toBe(true)
    expect(result.current.couponCode).toBe('CONTRATISTA10')
    expect(result.current.totals.discount).toBe(599)
    act(() => result.current.removeCoupon())
    expect(result.current.couponCode).toBe('')
  })

  it('se guarda en localStorage y se recupera al volver a montar', () => {
    const primero = renderHook(() => useCart(), { wrapper })
    act(() => primero.result.current.addItem('MC001', 2))
    primero.unmount()
    expect(JSON.parse(localStorage.getItem('lm_cart')).items).toEqual([{ id: 'MC001', qty: 2 }])
    const segundo = renderHook(() => useCart(), { wrapper })
    expect(segundo.result.current.count).toBe(2)
  })

  it('el carrito se actualiza en tiempo real si el administrador cambia un precio', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem('MC001', 1))
    expect(result.current.totals.total).toBe(5990)
    act(() => {
      productRepository.update('MC001', { price: 7000 })
    })
    expect(result.current.totals.total).toBe(7000)
  })

  it('si baja el stock, la cantidad del carrito se ajusta; si el producto se elimina, desaparece', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem('MC001', 5))
    act(() => {
      productRepository.update('MC001', { stock: 2 })
    })
    expect(result.current.items[0].qty).toBe(2)
    act(() => {
      productRepository.remove('MC001')
    })
    expect(result.current.items).toHaveLength(0)
  })

  it('ignora datos dañados en localStorage', () => {
    localStorage.setItem('lm_cart', '{"items": "no es lista"}')
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.count).toBe(0)
  })

  it('useCart fuera del proveedor lanza un error claro', () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/)
  })
})

describe('AuthContext', () => {
  it('login correcto guarda al usuario y expone permisos', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoggedIn).toBe(false)
    act(() => {
      result.current.login('admin@duoc.cl', 'admin123')
    })
    expect(result.current.user.name).toBe('Eduardo')
    expect(result.current.isStaff).toBe(true)
    expect(result.current.can('users')).toBe(true)
  })

  it('login incorrecto no cambia la sesión', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    let r
    act(() => {
      r = result.current.login('admin@duoc.cl', 'mala')
    })
    expect(r.ok).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('logout cierra la sesión', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.login('contratista@gmail.com', 'cliente1')
    })
    expect(result.current.isStaff).toBe(false)
    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
  })

  it('recupera la sesión guardada al montar', () => {
    const primero = renderHook(() => useAuth(), { wrapper })
    act(() => {
      primero.result.current.login('vendedor@profesor.duoc.cl', 'vende123')
    })
    primero.unmount()
    const segundo = renderHook(() => useAuth(), { wrapper })
    expect(segundo.result.current.user.role).toBe('Vendedor')
    expect(segundo.result.current.can('users')).toBe(false)
  })

  it('se actualiza si el usuario cambia o es eliminado en la base de datos', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.login('maria.rojas@gmail.com', 'maria123')
    })
    act(() => {
      userRepository.update('123456785', { name: 'María José' })
    })
    expect(result.current.user.name).toBe('María José')
    act(() => {
      userRepository.remove('123456785')
    })
    expect(result.current.user).toBeNull()
  })
})

describe('ToastContext', () => {
  function Demo() {
    const { toasts, notify, dismiss } = useToast()
    return (
      <div>
        <button onClick={() => notify('Hola', 'info')}>avisar</button>
        {toasts.map((t) => (
          <p key={t.id}>
            {t.message}-{t.variant}
            <button onClick={() => dismiss(t.id)}>cerrar {t.id}</button>
          </p>
        ))}
      </div>
    )
  }

  it('agrega y descarta notificaciones', async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByText('avisar'))
    expect(screen.getByText(/Hola-info/)).toBeInTheDocument()
    await userEvent.click(screen.getByText(/cerrar/))
    expect(screen.queryByText(/Hola-info/)).toBeNull()
  })

  it('useToast fuera del proveedor lanza un error claro', () => {
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/)
  })
})
