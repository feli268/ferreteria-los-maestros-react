// Contenedor: formulario de contacto.
import { useState } from 'react'
import ContactPage from '../components/pages/ContactPage'
import { useToast } from '../context/ToastContext'
import { useForm } from '../hooks/useForm'
import { messageService } from '../services/messageService'

const VACIO = { name: '', email: '', message: '' }

export default function ContactContainer() {
  const { values, errors, setValue, setErrors, reset } = useForm(VACIO)
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()

  const enviar = (evento) => {
    evento.preventDefault()
    setSubmitting(true)
    const resultado = messageService.send(values)
    setSubmitting(false)
    if (!resultado.ok) {
      setErrors(resultado.errors)
      return
    }
    notify('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo a la brevedad.')
    reset(VACIO)
  }

  return <ContactPage values={values} errors={errors} onChange={setValue} onSubmit={enviar} submitting={submitting} />
}
