// Contenedor: conecta las notificaciones del contexto con el organismo que las dibuja.
import { useToast } from '../context/ToastContext'
import ToastHost from '../components/organisms/ToastHost'

export default function ToastHostContainer() {
  const { toasts, dismiss } = useToast()
  return <ToastHost toasts={toasts} onDismiss={dismiss} />
}
