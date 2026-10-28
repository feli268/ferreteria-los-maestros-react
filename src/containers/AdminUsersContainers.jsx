// Contenedores: usuarios del panel (lista, formulario y ficha con historial).
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminFormPage from '../components/pages/AdminFormPage'
import AdminUserDetailPage from '../components/pages/AdminUserDetailPage'
import AdminUsersPage from '../components/pages/AdminUsersPage'
import NotFoundPage from '../components/pages/NotFoundPage'
import UserForm from '../components/organisms/UserForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EMPTY_USER } from '../data/content'
import { useForm } from '../hooks/useForm'
import { useOrders, useUsers } from '../hooks/useRepository'
import { userService } from '../services/userService'
import { cleanRun } from '../utils/validators'

const FILTROS_VACIOS = { query: '', role: '' }

export function AdminUsersContainer() {
  const users = useUsers()
  const { user: sesion } = useAuth()
  const { notify } = useToast()
  const [filters, setFilters] = useState(FILTROS_VACIOS)
  const [pendingDelete, setPendingDelete] = useState(null)

  const texto = filters.query.trim().toLowerCase()
  const coincideTexto = (u) =>
    `${u.name} ${u.lastname} ${u.email}`.toLowerCase().includes(texto) || u.run.includes(cleanRun(texto))
  const visibles = users.filter((u) => (!filters.role || u.role === filters.role) && (!texto || coincideTexto(u)))

  return (
    <AdminUsersPage
      users={visibles}
      filters={filters}
      onFilterChange={(cambio) => setFilters((f) => ({ ...f, ...cambio }))}
      pendingDelete={pendingDelete}
      onAskDelete={setPendingDelete}
      onCancelDelete={() => setPendingDelete(null)}
      onConfirmDelete={() => {
        const resultado = userService.remove(pendingDelete.run, sesion?.run)
        notify(resultado.ok ? 'Usuario eliminado.' : resultado.message, resultado.ok ? 'info' : 'danger')
        setPendingDelete(null)
      }}
    />
  )
}

export function AdminUserFormContainer() {
  const { run } = useParams()
  const editing = Boolean(run)
  const users = useUsers()
  const usuario = editing ? users.find((u) => u.run === cleanRun(run)) : null
  const form = useForm(
    usuario ? { ...EMPTY_USER, ...usuario, password: '', passwordConfirm: '' } : { ...EMPTY_USER, role: '' },
  )
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()
  const navigate = useNavigate()

  if (editing && !usuario) return <NotFoundPage title="Usuario no encontrado" />

  const enviar = (evento) => {
    evento.preventDefault()
    setSubmitting(true)
    const resultado = editing ? userService.update(usuario.run, form.values) : userService.create(form.values)
    setSubmitting(false)
    if (!resultado.ok) {
      form.setErrors(resultado.errors)
      form.setFormError('Revisa los campos marcados en rojo.')
      return
    }
    notify(editing ? 'Usuario actualizado.' : 'Usuario creado.')
    navigate('/admin/usuarios')
  }

  return (
    <AdminFormPage title={editing ? `Editar a ${usuario.name} ${usuario.lastname}` : 'Nuevo usuario'}>
      <UserForm
        mode={editing ? 'edit' : 'create'}
        showRole
        values={form.values}
        errors={form.errors}
        formError={form.formError}
        submitting={submitting}
        onChange={form.setValue}
        onSubmit={enviar}
        onCancel={() => navigate('/admin/usuarios')}
      />
    </AdminFormPage>
  )
}

export function AdminUserDetailContainer() {
  const { run } = useParams()
  const users = useUsers()
  useOrders() // se actualiza si llegan compras nuevas
  const usuario = users.find((u) => u.run === cleanRun(run))
  if (!usuario) return <NotFoundPage title="Usuario no encontrado" />
  return <AdminUserDetailPage user={usuario} history={userService.getPurchaseHistory(usuario.run)} />
}
