// Contenedores: categorías del panel (lista y formulario).
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminCategoriesPage from '../components/pages/AdminCategoriesPage'
import AdminFormPage from '../components/pages/AdminFormPage'
import NotFoundPage from '../components/pages/NotFoundPage'
import CategoryForm from '../components/organisms/CategoryForm'
import { useToast } from '../context/ToastContext'
import { useForm } from '../hooks/useForm'
import { useCategories, useProducts } from '../hooks/useRepository'
import { categoryService } from '../services/categoryService'

export function AdminCategoriesContainer() {
  const categories = useCategories()
  const products = useProducts()
  const { notify } = useToast()
  const [pendingDelete, setPendingDelete] = useState(null)

  const counts = {}
  products.forEach((p) => {
    counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
  })

  return (
    <AdminCategoriesPage
      categories={categories}
      counts={counts}
      pendingDelete={pendingDelete}
      onAskDelete={setPendingDelete}
      onCancelDelete={() => setPendingDelete(null)}
      onConfirmDelete={() => {
        const resultado = categoryService.remove(pendingDelete.id)
        notify(resultado.ok ? `Categoría "${pendingDelete.name}" eliminada.` : resultado.message, resultado.ok ? 'info' : 'danger')
        setPendingDelete(null)
      }}
    />
  )
}

export function AdminCategoryFormContainer() {
  const { id } = useParams()
  const editing = Boolean(id)
  const categories = useCategories()
  const category = editing ? categories.find((c) => c.id === id) : null
  const form = useForm({
    name: category?.name ?? '',
    icon: category?.icon ?? '📦',
    description: category?.description ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()
  const navigate = useNavigate()

  if (editing && !category) return <NotFoundPage title="Categoría no encontrada" />

  const enviar = (evento) => {
    evento.preventDefault()
    setSubmitting(true)
    const resultado = editing ? categoryService.update(id, form.values) : categoryService.create(form.values)
    setSubmitting(false)
    if (!resultado.ok) {
      form.setErrors(resultado.errors)
      return
    }
    notify(editing ? 'Categoría actualizada.' : 'Categoría creada.')
    navigate('/admin/categorias')
  }

  return (
    <AdminFormPage title={editing ? `Editar ${category.name}` : 'Nueva categoría'}>
      <CategoryForm
        mode={editing ? 'edit' : 'create'}
        values={form.values}
        errors={form.errors}
        submitting={submitting}
        onChange={form.setValue}
        onSubmit={enviar}
        onCancel={() => navigate('/admin/categorias')}
      />
    </AdminFormPage>
  )
}
