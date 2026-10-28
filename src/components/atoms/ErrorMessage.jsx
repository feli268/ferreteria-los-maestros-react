// Átomo: mensaje de error de un campo (se anuncia como alerta). No muestra nada si está vacío.
export default function ErrorMessage({ id, children }) {
  if (!children) return null
  return (
    <div id={id} className="invalid-feedback d-block" role="alert">
      {children}
    </div>
  )
}
