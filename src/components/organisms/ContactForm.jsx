// Organismo: formulario de contacto con contador de caracteres.
import Form from 'react-bootstrap/Form'
import { MESSAGE_MAX_LENGTH } from '../../data/catalogs'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'

export default function ContactForm({ values, errors, onChange, onSubmit, submitting }) {
  return (
    <Form onSubmit={onSubmit} noValidate aria-label="Formulario de contacto">
      <FormField
        id="name"
        label="Nombre completo"
        required
        maxLength={100}
        value={values.name}
        error={errors.name}
        onChange={(e) => onChange('name', e.target.value)}
      />
      <FormField
        id="email"
        type="email"
        label="Correo electrónico"
        required
        value={values.email}
        error={errors.email}
        onChange={(e) => onChange('email', e.target.value)}
      />
      <FormField
        id="message"
        as="textarea"
        rows={5}
        label={`Comentario / Consulta (máx. ${MESSAGE_MAX_LENGTH} caracteres)`}
        required
        placeholder="Escribe tu mensaje..."
        value={values.message}
        error={errors.message}
        onChange={(e) => onChange('message', e.target.value)}
      />
      <div className="text-end small text-secondary mb-3" aria-live="polite" data-testid="contador">
        {values.message.length} / {MESSAGE_MAX_LENGTH}
      </div>
      <ActionButton type="submit" className="w-100" loading={submitting} loadingText="Enviando...">
        Enviar mensaje
      </ActionButton>
    </Form>
  )
}
