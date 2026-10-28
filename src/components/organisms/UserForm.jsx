// Organismo: formulario de usuario. Se reutiliza en tres lugares:
//  - mode="register": registro público (sin selector de rol)
//  - mode="create":   alta desde el panel de administración (con rol)
//  - mode="edit":     edición (RUN bloqueado, contraseña opcional)
import Alert from 'react-bootstrap/Alert'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { roleOptions } from '../../data/catalogs'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'
import RegionComunaSelect from '../molecules/RegionComunaSelect'

export default function UserForm({
  mode = 'register',
  values,
  errors,
  formError,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
  showRole = false,
}) {
  const edicion = mode === 'edit'
  const etiquetaBoton = submitLabel ?? (mode === 'register' ? 'Crear cuenta' : 'Guardar usuario')

  return (
    <Form onSubmit={onSubmit} noValidate aria-label="Formulario de usuario">
      {formError && (
        <Alert variant="danger" role="alert">
          {formError}
        </Alert>
      )}
      <Row>
        <Col xs={12} md={6}>
          <FormField
            id="run"
            label="RUN"
            required
            hint="Sin puntos ni guion. Ej: 123456785"
            maxLength={12}
            disabled={edicion}
            value={values.run}
            error={errors.run}
            onChange={(e) => onChange('run', e.target.value)}
          />
        </Col>
        {showRole && (
          <Col xs={12} md={6}>
            <FormField
              id="role"
              as="select"
              label="Rol"
              required
              placeholder="Selecciona un rol"
              options={roleOptions.map((r) => ({ value: r.value, label: r.label }))}
              value={values.role}
              error={errors.role}
              onChange={(e) => onChange('role', e.target.value)}
            />
          </Col>
        )}
      </Row>
      <Row>
        <Col xs={12} md={6}>
          <FormField
            id="name"
            label="Nombre"
            required
            maxLength={50}
            value={values.name}
            error={errors.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </Col>
        <Col xs={12} md={6}>
          <FormField
            id="lastname"
            label="Apellidos"
            required
            maxLength={100}
            value={values.lastname}
            error={errors.lastname}
            onChange={(e) => onChange('lastname', e.target.value)}
          />
        </Col>
      </Row>
      <FormField
        id="email"
        type="email"
        label="Correo electrónico"
        required
        hint="Solo @duoc.cl, @profesor.duoc.cl o @gmail.com"
        maxLength={100}
        value={values.email}
        error={errors.email}
        onChange={(e) => onChange('email', e.target.value)}
      />
      <Row>
        <Col xs={12} md={6}>
          <FormField
            id="password"
            type="password"
            label="Contraseña"
            required={!edicion}
            hint={edicion ? 'Déjala en blanco para conservar la actual' : 'Entre 4 y 10 caracteres'}
            maxLength={10}
            autoComplete="new-password"
            value={values.password}
            error={errors.password}
            onChange={(e) => onChange('password', e.target.value)}
          />
        </Col>
        <Col xs={12} md={6}>
          <FormField
            id="passwordConfirm"
            type="password"
            label="Confirmar contraseña"
            required={!edicion}
            maxLength={10}
            autoComplete="new-password"
            value={values.passwordConfirm}
            error={errors.passwordConfirm}
            onChange={(e) => onChange('passwordConfirm', e.target.value)}
          />
        </Col>
      </Row>
      <RegionComunaSelect
        region={values.region}
        comuna={values.comuna}
        errors={errors}
        onChange={({ region, comuna }) => {
          onChange('region', region)
          onChange('comuna', comuna)
        }}
      />
      <FormField
        id="address"
        label="Dirección"
        required
        maxLength={300}
        value={values.address}
        error={errors.address}
        onChange={(e) => onChange('address', e.target.value)}
      />
      <div className="d-flex gap-2">
        <ActionButton type="submit" loading={submitting} loadingText="Guardando...">
          {etiquetaBoton}
        </ActionButton>
        {onCancel && (
          <ActionButton variant="outline-secondary" onClick={onCancel}>
            Cancelar
          </ActionButton>
        )}
      </div>
    </Form>
  )
}
