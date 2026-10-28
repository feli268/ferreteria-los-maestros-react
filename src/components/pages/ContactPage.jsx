// Página: contacto.
import Card from 'react-bootstrap/Card'
import PageHeader from '../molecules/PageHeader'
import ContactForm from '../organisms/ContactForm'

export default function ContactPage(props) {
  return (
    <div className="mx-auto" style={{ maxWidth: 640 }}>
      <PageHeader title="Contacto" subtitle="Escríbenos y te responderemos a la brevedad." />
      <Card body>
        <ContactForm {...props} />
      </Card>
    </div>
  )
}
