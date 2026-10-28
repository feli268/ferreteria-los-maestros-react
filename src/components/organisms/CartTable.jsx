// Organismo: detalle del carrito. `lines` viene de buildOrderLines; `stockById` limita la cantidad.
import Table from 'react-bootstrap/Table'
import { Link } from 'react-router-dom'
import { formatCLP } from '../../utils/format'
import ActionButton from '../atoms/ActionButton'
import Icon from '../atoms/Icon'
import QuantityControl from '../molecules/QuantityControl'

export default function CartTable({ lines, stockById = {}, onQuantityChange, onRemove }) {
  return (
    <Table responsive hover className="align-middle lm-cart-table">
      <caption className="visually-hidden">Productos en tu carrito</caption>
      <thead>
        <tr>
          <th scope="col">Producto</th>
          <th scope="col" className="text-end">Precio</th>
          <th scope="col">Cantidad</th>
          <th scope="col" className="text-end">Subtotal</th>
          <th scope="col">
            <span className="visually-hidden">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((linea) => (
          <tr key={linea.productId}>
            <td>
              <Icon symbol={linea.icon} size="1.75rem" />{' '}
              <Link to={`/productos/${linea.productId}`} className="fw-semibold text-decoration-none">
                {linea.name}
              </Link>
            </td>
            <td className="text-end">{formatCLP(linea.unitPrice)}</td>
            <td>
              <QuantityControl
                size="sm"
                label={`Cantidad de ${linea.name}`}
                value={linea.quantity}
                max={stockById[linea.productId] ?? linea.quantity}
                onChange={(cantidad) => onQuantityChange(linea.productId, cantidad)}
              />
            </td>
            <td className="text-end fw-semibold">{formatCLP(linea.subtotal)}</td>
            <td className="text-end">
              <ActionButton
                variant="outline-danger"
                size="sm"
                aria-label={`Quitar ${linea.name} del carrito`}
                onClick={() => onRemove(linea.productId)}
              >
                Quitar
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
