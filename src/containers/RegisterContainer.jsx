// Contenedor: registro de nuevos clientes.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RegisterPage from '../components/pages/RegisterPage'
import { useToast } from '../context/ToastContext'
import { EMPTY_USER } from '../data/content'
import { useForm } from '../hooks/useForm'
import { userService } from '../services/userService'

export default function RegisterContainer() {
  const { values, errors, formError, setValue, setErrors, setFormError } = useForm(EMPTY_USER)
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()
  const navigate = useNavigate()

  const enviar = (evento) => {
    evento.preventDefault()
    setSubmitting(true)
    const resultado = userService.register(values)
    setSubmitting(false)
    if (!resultado.ok) {
      setErrors(resultado.errors)
      setFormError('Revisa los campos marcados en rojo.')
      return
    }
    notify('¡Cuenta creada! Ahora puedes iniciar sesión.')
    navigate('/login')
  }

  return (
    <RegisterPage
      values={values}
      errors={errors}
      formError={formError}
      submitting={submitting}
      onChange={setValue}
      onSubmit={enviar}
    />
  )
}
