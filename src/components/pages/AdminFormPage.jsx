// Página genérica de formulario del panel (nuevo/editar): título + tarjeta con el formulario.
import Card from 'react-bootstrap/Card'
import PageHeader from '../molecules/PageHeader'

export default function AdminFormPage({ title, subtitle, children }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card body style={{ maxWidth: 860 }}>
        {children}
      </Card>
    </>
  )
}
