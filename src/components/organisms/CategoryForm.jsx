// Organismo: formulario de categoría.
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'

export default function CategoryForm({ mode = 'create', values, errors, formError, onChange, onSubmit, onCancel, submitting }) {
  return (
    <Form onSubmit={onSubmit} noValidate aria-label="Formulario de categoría">
      {formError && (
        <Alert variant="danger" role="alert">
          {formError}
        </Alert>
      )}
      <FormField id="name" label="Nombre" required maxLength={40} value={values.name} error={errors.name}
        onChange={(e) => onChange('name', e.target.value)} />
      <FormField id="icon" label="Ícono (emoji)" maxLength={4} value={values.icon}
        onChange={(e) => onChange('icon', e.target.value)} />
      <FormField id="description" as="textarea" rows={3} label="Descripción" maxLength={200} value={values.description}
        error={errors.description} onChange={(e) => onChange('description', e.target.value)} />
      <div className="d-flex gap-2">
        <ActionButton type="submit" loading={submitting} loadingText="Guardando...">
          {mode === 'edit' ? 'Guardar cambios' : 'Crear categoría'}
        </ActionButton>
        <ActionButton variant="outline-secondary" onClick={onCancel}>
          Cancelar
        </ActionButton>
      </div>
    </Form>
  )
}
