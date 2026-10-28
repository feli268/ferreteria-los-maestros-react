// Organismo: muestra las notificaciones (toasts) apiladas arriba a la derecha.
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'

export default function ToastHost({ toasts, onDismiss }) {
  return (
    <ToastContainer position="top-end" className="p-3 position-fixed" style={{ zIndex: 2000 }}>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          bg={t.variant}
          autohide
          delay={3500}
          onClose={() => onDismiss(t.id)}
          role="status"
          aria-live="polite"
        >
          <Toast.Body className={t.variant === 'warning' || t.variant === 'info' ? 'text-dark' : 'text-white'}>
            <div className="d-flex justify-content-between align-items-start gap-2">
              <span>{t.message}</span>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar aviso" onClick={() => onDismiss(t.id)} />
            </div>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  )
}
