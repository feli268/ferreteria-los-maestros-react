// Organismo: formulario de pago (datos del cliente, dirección, entrega y método de pago).
import Alert from 'react-bootstrap/Alert'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from '../../data/catalogs'
import { formatCLP } from '../../utils/format'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'
import RadioGroup from '../molecules/RadioGroup'
import RegionComunaSelect from '../molecules/RegionComunaSelect'

export default function CheckoutForm({ values, errors, formError, total, onChange, onSubmit, submitting }) {
  return (
    <Form onSubmit={onSubmit} noValidate aria-label="Finalizar compra">
      {formError && (
        <Alert variant="danger" role="alert">
          {formError}
        </Alert>
      )}

      <h2 className="h5 mb-3">Datos del cliente</h2>
      <Row>
        <Col xs={12} md={6}>
          <FormField id="name" label="Nombre" required maxLength={50} value={values.name} error={errors.name}
            onChange={(e) => onChange('name', e.target.value)} />
        </Col>
        <Col xs={12} md={6}>
          <FormField id="lastname" label="Apellidos" required maxLength={100} value={values.lastname} error={errors.lastname}
            onChange={(e) => onChange('lastname', e.target.value)} />
        </Col>
      </Row>
      <FormField id="email" type="email" label="Correo electrónico" required maxLength={100}
        hint="Aquí enviaremos la boleta de tu compra." value={values.email} error={errors.email}
        onChange={(e) => onChange('email', e.target.value)} />

      <h2 className="h5 mt-4 mb-3">Dirección de entrega</h2>
      <Row>
        <Col xs={12} md={8}>
          <FormField id="street" label="Calle y número" required maxLength={300} value={values.street} error={errors.street}
            onChange={(e) => onChange('street', e.target.value)} />
        </Col>
        <Col xs={12} md={4}>
          <FormField id="apartment" label="Departamento / Casa" maxLength={50} placeholder="Opcional" value={values.apartment}
            error={errors.apartment} onChange={(e) => onChange('apartment', e.target.value)} />
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
      <FormField id="notes" as="textarea" rows={2} label="Indicaciones para la entrega" maxLength={500}
        placeholder="Opcional: punto de referencia, horario, quién recibe..." value={values.notes} error={errors.notes}
        onChange={(e) => onChange('notes', e.target.value)} />

      <h2 className="h5 mt-4 mb-3">Forma de entrega</h2>
      <RadioGroup
        name="deliveryId"
        legend="¿Cómo quieres recibir tu pedido?"
        required
        options={DELIVERY_OPTIONS.map((o) => ({ value: o.id, label: o.label, description: o.description }))}
        value={values.deliveryId}
        error={errors.deliveryId}
        onChange={(valor) => onChange('deliveryId', valor)}
      />

      <h2 className="h5 mt-4 mb-3">Método de pago</h2>
      <RadioGroup
        name="paymentMethod"
        legend="Elige cómo pagar"
        required
        options={PAYMENT_METHODS.map((m) => ({ value: m.id, label: m.label }))}
        value={values.paymentMethod}
        error={errors.paymentMethod}
        onChange={(valor) => onChange('paymentMethod', valor)}
      />

      <ActionButton type="submit" size="lg" className="w-100 mt-3" loading={submitting} loadingText="Procesando pago...">
        Pagar ahora {formatCLP(total)}
      </ActionButton>
    </Form>
  )
}
