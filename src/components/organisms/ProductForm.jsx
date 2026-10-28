// Organismo: formulario de producto (alta y edición del inventario).
import Alert from 'react-bootstrap/Alert'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import ActionButton from '../atoms/ActionButton'
import FormField from '../molecules/FormField'

export default function ProductForm({ mode = 'create', values, errors, formError, categories, onChange, onSubmit, onCancel, submitting }) {
  const edicion = mode === 'edit'
  return (
    <Form onSubmit={onSubmit} noValidate aria-label="Formulario de producto">
      {formError && (
        <Alert variant="danger" role="alert">
          {formError}
        </Alert>
      )}
      <Row>
        <Col xs={12} md={4}>
          <FormField id="id" label="Código" required disabled={edicion} maxLength={12}
            hint="Letras, números y guion (3 a 12)" value={values.id} error={errors.id}
            onChange={(e) => onChange('id', e.target.value)} />
        </Col>
        <Col xs={12} md={8}>
          <FormField id="name" label="Nombre" required maxLength={100} value={values.name} error={errors.name}
            onChange={(e) => onChange('name', e.target.value)} />
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={4}>
          <FormField id="categoryId" as="select" label="Categoría" required placeholder="Selecciona una categoría"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={values.categoryId} error={errors.categoryId}
            onChange={(e) => onChange('categoryId', e.target.value)} />
        </Col>
        <Col xs={6} md={4}>
          <FormField id="subcategory" label="Subcategoría" maxLength={60} value={values.subcategory} error={errors.subcategory}
            onChange={(e) => onChange('subcategory', e.target.value)} />
        </Col>
        <Col xs={6} md={4}>
          <FormField id="brand" label="Marca" maxLength={60} value={values.brand} error={errors.brand}
            onChange={(e) => onChange('brand', e.target.value)} />
        </Col>
      </Row>
      <Row>
        <Col xs={6} md={3}>
          <FormField id="price" type="number" min="0" label="Precio (CLP, IVA incl.)" required value={values.price}
            error={errors.price} onChange={(e) => onChange('price', e.target.value)} />
        </Col>
        <Col xs={6} md={3}>
          <FormField id="discountPercent" type="number" min="0" max="90" label="Descuento oferta (%)"
            hint="0 = sin oferta" value={values.discountPercent} error={errors.discountPercent}
            onChange={(e) => onChange('discountPercent', e.target.value)} />
        </Col>
        <Col xs={6} md={3}>
          <FormField id="stock" type="number" min="0" label="Stock" required value={values.stock} error={errors.stock}
            onChange={(e) => onChange('stock', e.target.value)} />
        </Col>
        <Col xs={6} md={3}>
          <FormField id="criticalStock" type="number" min="0" label="Stock crítico" hint="Alerta bajo este nivel"
            value={values.criticalStock} error={errors.criticalStock}
            onChange={(e) => onChange('criticalStock', e.target.value)} />
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={3}>
          <FormField id="icon" label="Ícono (emoji)" maxLength={4} value={values.icon}
            onChange={(e) => onChange('icon', e.target.value)} />
        </Col>
        <Col xs={12} md={9}>
          <FormField id="description" as="textarea" rows={3} label="Descripción" maxLength={500}
            value={values.description} error={errors.description}
            onChange={(e) => onChange('description', e.target.value)} />
        </Col>
      </Row>
      <div className="d-flex gap-2">
        <ActionButton type="submit" loading={submitting} loadingText="Guardando...">
          {edicion ? 'Guardar cambios' : 'Crear producto'}
        </ActionButton>
        <ActionButton variant="outline-secondary" onClick={onCancel}>
          Cancelar
        </ActionButton>
      </div>
    </Form>
  )
}
