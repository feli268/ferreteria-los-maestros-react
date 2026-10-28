// Molécula: mensaje cuando no hay datos que mostrar (carrito vacío, sin resultados...).
import Icon from '../atoms/Icon'

export default function EmptyState({ icon = '🔍', title, message, action }) {
  return (
    <div className="text-center py-5 lm-empty-state" role="status">
      <Icon symbol={icon} size="3rem" />
      <h2 className="h4 mt-3">{title}</h2>
      {message && <p className="text-secondary">{message}</p>}
      {action}
    </div>
  )
}
