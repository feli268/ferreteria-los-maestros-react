// Organismo: tabla genérica y responsive.
// columns = [{ key, header, render?(row), className?, align? }]
import Table from 'react-bootstrap/Table'
import EmptyState from '../molecules/EmptyState'

export default function DataTable({ columns, rows, rowKey = 'id', caption, emptyMessage = 'No hay registros para mostrar.' }) {
  if (rows.length === 0) {
    return <EmptyState icon="📭" title={emptyMessage} />
  }
  return (
    <Table responsive hover striped className="align-middle lm-data-table">
      {caption && <caption className="visually-hidden">{caption}</caption>}
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col" className={c.align === 'end' ? 'text-end' : undefined}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((fila) => (
          <tr key={fila[rowKey]}>
            {columns.map((c) => (
              <td key={c.key} className={[c.className, c.align === 'end' ? 'text-end' : ''].filter(Boolean).join(' ') || undefined}>
                {c.render ? c.render(fila) : fila[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
