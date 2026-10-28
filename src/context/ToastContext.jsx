// Notificaciones breves (toasts) para confirmar acciones: "Producto agregado", etc.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let siguienteId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id))
  }, [])

  /** variant: success | danger | warning | info */
  const notify = useCallback((message, variant = 'success') => {
    const id = siguienteId++
    setToasts((actuales) => [...actuales, { id, message, variant }])
    return id
  }, [])

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>.')
  return contexto
}
