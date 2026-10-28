// Organismo: formulario de inicio de sesión.
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'
import { Link } from 'react-router-dom'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'

export default function LoginForm({ values, errors, formError, onChange, onSubmit, submitting }) {
  return (
    <Form onSubmit={onSubmit} noValidate aria-label="Iniciar sesión">
      {formError && (
        <Alert variant="danger" role="alert">
          {formError}
        </Alert>
      )}
      <FormField
        id="email"
        type="email"
        label="Correo electrónico"
        required
        autoComplete="email"
        placeholder="usuario@gmail.com"
        value={values.email}
        error={errors.email}
        onChange={(e) => onChange('email', e.target.value)}
      />
      <FormField
        id="password"
        type="password"
        label="Contraseña"
        required
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        onChange={(e) => onChange('password', e.target.value)}
      />
      <ActionButton type="submit" className="w-100" loading={submitting} loadingText="Ingresando...">
        Iniciar sesión
      </ActionButton>
      <p className="text-center small mt-3 mb-0">
        ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
      </p>
    </Form>
  )
}
