// Contenedor: inicio de sesión.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginPage from '../components/pages/LoginPage'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { initialUsers } from '../data/seed'
import { useForm } from '../hooks/useForm'
import { canAccessAdmin } from '../services/authService'
import { collectErrors, validateEmail, validatePassword } from '../utils/validators'

const VACIO = { email: '', password: '' }
// Cuentas de demostración que se muestran bajo el formulario.
const demoUsers = initialUsers.slice(0, 3).map(({ role, email, password }) => ({ role, email, password }))

export default function LoginContainer() {
  const { values, errors, formError, setValue, setValues, setErrors, setFormError } = useForm(VACIO)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const enviar = (evento) => {
    evento.preventDefault()
    setFormError('')
    const errores = collectErrors({
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    })
    if (Object.keys(errores).length > 0) {
      setErrors(errores)
      return
    }
    setSubmitting(true)
    const resultado = login(values.email, values.password)
    setSubmitting(false)
    if (!resultado.ok) {
      setFormError(resultado.message)
      return
    }
    notify(`¡Bienvenido/a, ${resultado.user.name}!`)
    navigate(location.state?.from ?? (canAccessAdmin(resultado.user) ? '/admin' : '/'), { replace: true })
  }

  return (
    <LoginPage
      values={values}
      errors={errors}
      formError={formError}
      submitting={submitting}
      onChange={setValue}
      onSubmit={enviar}
      demoUsers={demoUsers}
      onUseDemo={(u) => {
        setValues({ email: u.email, password: u.password })
        setErrors({})
        setFormError('')
      }}
    />
  )
}
