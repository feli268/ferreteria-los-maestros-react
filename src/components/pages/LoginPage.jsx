// Página: inicio de sesión (incluye las credenciales de demostración).
import Alert from 'react-bootstrap/Alert'
import Card from 'react-bootstrap/Card'
import LoginForm from '../organisms/LoginForm'

export default function LoginPage({ demoUsers = [], onUseDemo, ...formProps }) {
  return (
    <div className="mx-auto" style={{ maxWidth: 460 }}>
      <h1 className="h2 text-center mb-4">Iniciar sesión</h1>
      <Card body>
        <LoginForm {...formProps} />
      </Card>
      {demoUsers.length > 0 && (
        <Alert variant="info" className="mt-3 small">
          <strong>Cuentas de demostración</strong> (clic para completar):
          <ul className="mb-0 mt-1 list-unstyled">
            {demoUsers.map((u) => (
              <li key={u.email}>
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => onUseDemo(u)}>
                  {u.role}: {u.email}
                </button>
              </li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
