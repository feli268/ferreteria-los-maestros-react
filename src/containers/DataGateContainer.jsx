// Contenedor: muestra el contenido solo cuando los datos del backend ya llegaron.
// Así ninguna pantalla se dibuja con listas vacías (ni muestra un "no encontrado" falso) mientras carga.
import ConnectionState from '../components/molecules/ConnectionState'
import { useData } from '../context/DataContext'

export default function DataGateContainer({ children }) {
  const { status, message, retry } = useData()
  if (status !== 'ready') return <ConnectionState status={status} message={message} onRetry={retry} />
  return children
}
