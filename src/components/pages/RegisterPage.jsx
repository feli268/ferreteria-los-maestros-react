// Página: registro de nuevos clientes.
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'
import UserForm from '../organisms/UserForm'

export default function RegisterPage(props) {
  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h1 className="h2 text-center mb-4">Crear cuenta</h1>
      <Card body>
        <UserForm mode="register" {...props} />
      </Card>
      <p className="text-center small mt-3">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}
