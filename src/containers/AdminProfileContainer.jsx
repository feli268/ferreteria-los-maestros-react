// Contenedor: el usuario con sesión edita sus propios datos (sin cambiar su rol).
import { useState } from 'react'
import AdminFormPage from '../components/pages/AdminFormPage'
import UserForm from '../components/organisms/UserForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EMPTY_USER } from '../data/content'
import { useForm } from '../hooks/useForm'
import { userService } from '../services/userService'

export default function AdminProfileContainer() {
  const { user } = useAuth()
  const form = useForm({ ...EMPTY_USER, ...user, password: '', passwordConfirm: '' })
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()

  const enviar = (evento) => {
    evento.preventDefault()
    setSubmitting(true)
    const resultado = userService.updateProfile(user.run, form.values)
    setSubmitting(false)
    if (!resultado.ok) {
      form.setErrors(resultado.errors)
      form.setFormError('Revisa los campos marcados en rojo.')
      return
    }
    form.setFormError('')
    notify('Tus datos fueron actualizados.')
  }

  return (
    <AdminFormPage title="Mi perfil" subtitle={`${user.role} · tu rol solo puede cambiarlo un Administrador.`}>
      <UserForm
        mode="edit"
        values={form.values}
        errors={form.errors}
        formError={form.formError}
        submitting={submitting}
        submitLabel="Guardar mis datos"
        onChange={form.setValue}
        onSubmit={enviar}
      />
    </AdminFormPage>
  )
}
