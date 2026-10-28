// Átomo: ícono (emoji). Si tiene `label` se anuncia a lectores de pantalla; si no, es decorativo.
export default function Icon({ symbol, label, size = '1.25rem', className = '' }) {
  return (
    <span
      className={`lm-icon ${className}`.trim()}
      style={{ fontSize: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {symbol}
    </span>
  )
}
