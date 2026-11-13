import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { productRepository, userRepository } from '../data/db'
import { fakeDb } from '../test/fakeBackend'
import { iniciarSesion } from '../test/session'
import { AuthProvider, useAuth } from './AuthContext'
import { CartProvider, useCart } from './CartContext'
import { DataProvider, useData } from './DataContext'
import { ToastProvider, useToast } from './ToastContext'

const wrapper = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      <DataProvider>
        <CartProvider>{children}</CartProvider>
      </DataProvider>
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
    productRepository.upsert({ ...productRepository.getById('MC001'), stock: 0 })
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
      productRepository.upsert({ ...productRepository.getById('MC001'), price: 7000 })
    })
    expect(result.current.totals.total).toBe(7000)
  })

  it('si baja el stock, la cantidad del carrito se ajusta; si el producto se elimina, desaparece', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem('MC001', 5))
    act(() => {
      productRepository.upsert({ ...productRepository.getById('MC001'), stock: 2 })
    })
    expect(result.current.items[0].qty).toBe(2)
    act(() => {
      productRepository.drop('MC001')
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
  it('login correcto guarda al usuario y expone permisos', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoggedIn).toBe(false)
    await act(async () => {
      await result.current.login('admin@duoc.cl', 'admin123')
    })
    expect(result.current.user.name).toBe('Eduardo')
    expect(result.current.isStaff).toBe(true)
    expect(result.current.can('users')).toBe(true)
  })

  it('login incorrecto no cambia la sesión', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    let r
    await act(async () => {
      r = await result.current.login('admin@duoc.cl', 'mala')
    })
    expect(r.ok).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('logout cierra la sesión', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await result.current.login('contratista@gmail.com', 'cliente1')
    })
    expect(result.current.isStaff).toBe(false)
    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
  })

  it('recupera la sesión guardada al montar', async () => {
    const primero = renderHook(() => useAuth(), { wrapper })
    await act(async () => {
      await primero.result.current.login('vendedor@profesor.duoc.cl', 'vende123')
    })
    primero.unmount()
    const segundo = renderHook(() => useAuth(), { wrapper })
    expect(segundo.result.current.user.role).toBe('Vendedor')
    expect(segundo.result.current.can('users')).toBe(false)
    await act(async () => {}) // deja terminar la confirmación con GET /auth/me
  })

  it('al abrir la app confirma el token con el backend y actualiza los datos del usuario', async () => {
    iniciarSesion('maria.rojas@gmail.com')
    fakeDb().users.find((u) => u.run === '123456785').name = 'María José' // cambió en el backend
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user.name).toBe('María') // al inicio muestra lo guardado
    await waitFor(() => expect(result.current.user.name).toBe('María José'))
  })

  it('si el backend rechaza el token (usuario eliminado) la sesión se cierra sola', async () => {
    iniciarSesion('maria.rojas@gmail.com')
    fakeDb().users = fakeDb().users.filter((u) => u.run !== '123456785')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toBeNull())
    expect(localStorage.getItem('lm_session')).toBeNull()
  })

  it('updateUser actualiza la sesión con los datos nuevos', async () => {
    iniciarSesion('maria.rojas@gmail.com')
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.updateUser({ ...result.current.user, address: 'Otra calle 1' }))
    expect(result.current.user.address).toBe('Otra calle 1')
    expect(JSON.parse(localStorage.getItem('lm_session')).user.address).toBe('Otra calle 1')
    await act(async () => {})
  })

  it('al cerrar sesión se borran de memoria los usuarios y órdenes cargados', () => {
    iniciarSesion('admin@duoc.cl')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(userRepository.getAll().length).toBeGreaterThan(0)
    act(() => result.current.logout())
    expect(userRepository.getAll()).toHaveLength(0)
  })
})

describe('DataContext (carga de datos desde el backend)', () => {
  it('con el catálogo ya cargado el estado es "ready" y no hace llamadas', () => {
    const { result } = renderHook(() => useData(), { wrapper })
    expect(result.current.status).toBe('ready')
    expect(fakeDb().calls).toHaveLength(0)
  })

  it('al iniciar sesión como Administrador carga usuarios y órdenes y pasa por "loading"', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), data: useData() }), { wrapper })
    await act(async () => {
      await result.current.auth.login('admin@duoc.cl', 'admin123')
    })
    await waitFor(() => expect(result.current.data.status).toBe('ready'))
    const rutas = fakeDb().calls.map((c) => `${c.method} ${c.path}`)
    expect(rutas).toEqual(expect.arrayContaining(['GET /usuarios', 'GET /boletas']))
    expect(userRepository.getAll()).toHaveLength(4)
  })

  it('el Vendedor carga las órdenes pero NO la lista de usuarios', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), data: useData() }), { wrapper })
    await act(async () => {
      await result.current.auth.login('vendedor@profesor.duoc.cl', 'vende123')
    })
    await waitFor(() => expect(result.current.data.status).toBe('ready'))
    const rutas = fakeDb().calls.map((c) => `${c.method} ${c.path}`)
    expect(rutas).toContain('GET /boletas')
    expect(rutas).not.toContain('GET /usuarios')
  })

  it('un Cliente no pide datos privados', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), data: useData() }), { wrapper })
    await act(async () => {
      await result.current.auth.login('contratista@gmail.com', 'cliente1')
    })
    const rutas = fakeDb().calls.map((c) => c.path)
    expect(rutas).not.toContain('/usuarios')
    expect(rutas).not.toContain('/boletas')
  })

  it('si el servidor no responde queda en "error" y reintentar vuelve a pedir los datos', async () => {
    const { categoryRepository } = await import('../data/db')
    categoryRepository.clear()
    productRepository.clear()
    fakeDb().offline = true
    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.message).toMatch(/comunicarse con el servidor/)
    fakeDb().offline = false
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })

  it('useData fuera del proveedor lanza un error claro', () => {
    expect(() => renderHook(() => useData())).toThrow(/DataProvider/)
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
