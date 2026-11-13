// Contenedores: inventario de productos (lista, formulario y reporte).
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminFormPage from '../components/pages/AdminFormPage'
import AdminInventoryReportPage from '../components/pages/AdminInventoryReportPage'
import AdminProductDetailPage from '../components/pages/AdminProductDetailPage'
import AdminProductsPage from '../components/pages/AdminProductsPage'
import NotFoundPage from '../components/pages/NotFoundPage'
import ProductForm from '../components/organisms/ProductForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useForm } from '../hooks/useForm'
import { useCategories, useProducts } from '../hooks/useRepository'
import { productService } from '../services/productService'
import { inventoryReport } from '../services/reportService'

const coincide = (p, texto) =>
  `${p.id} ${p.name} ${p.brand}`.toLowerCase().includes(texto.trim().toLowerCase())

/** mode: 'all' (todos) | 'critical' (solo stock crítico) */
export function AdminProductsContainer({ mode = 'all' }) {
  const products = useProducts()
  const categories = useCategories()
  const { notify } = useToast()
  const { can } = useAuth()
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  const base = mode === 'critical' ? productService.getCritical() : products
  const visibles = base.filter((p) => coincide(p, query))

  return (
    <AdminProductsPage
      title={mode === 'critical' ? 'Productos con stock crítico' : 'Productos'}
      subtitle={
        mode === 'critical'
          ? 'Su stock es igual o menor al nivel crítico definido. Conviene reponerlos.'
          : 'Inventario de la tienda: crea, edita o elimina productos.'
      }
      products={visibles}
      categories={categories}
      canManage={can('products-manage')}
      query={query}
      onQueryChange={setQuery}
      pendingDelete={pendingDelete}
      onAskDelete={setPendingDelete}
      onCancelDelete={() => setPendingDelete(null)}
      onConfirmDelete={async () => {
        const resultado = await productService.remove(pendingDelete.id)
        notify(resultado.ok ? `Producto "${pendingDelete.name}" eliminado.` : resultado.message, resultado.ok ? 'info' : 'danger')
        setPendingDelete(null)
      }}
    />
  )
}

const valoresDe = (p) => ({
  id: p?.id ?? '',
  name: p?.name ?? '',
  categoryId: p?.categoryId ?? '',
  subcategory: p?.subcategory ?? '',
  brand: p?.brand ?? '',
  price: p ? String(p.price) : '',
  discountPercent: p ? String(p.discountPercent) : '0',
  stock: p ? String(p.stock) : '',
  criticalStock: p ? String(p.criticalStock) : '',
  icon: p?.icon ?? '📦',
  description: p?.description ?? '',
})

export function AdminProductFormContainer() {
  const { id } = useParams()
  const editing = Boolean(id)
  const products = useProducts()
  const categories = useCategories()
  const product = editing ? products.find((p) => p.id === id) : null
  const form = useForm(valoresDe(product))
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useToast()
  const navigate = useNavigate()

  if (editing && !product) {
    return <NotFoundPage title="Producto no encontrado" message="No existe un producto con ese código." />
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setSubmitting(true)
    const resultado = await (editing ? productService.update(id, form.values) : productService.create(form.values))
    setSubmitting(false)
    if (!resultado.ok) {
      form.setErrors(resultado.errors)
      form.setFormError(resultado.errors.general ?? 'Revisa los campos marcados en rojo.')
      return
    }
    notify(editing ? 'Producto actualizado.' : 'Producto creado.')
    navigate('/admin/productos')
  }

  return (
    <AdminFormPage title={editing ? `Editar ${product.name}` : 'Nuevo producto'}>
      <ProductForm
        mode={editing ? 'edit' : 'create'}
        values={form.values}
        errors={form.errors}
        formError={form.formError}
        categories={categories}
        submitting={submitting}
        onChange={form.setValue}
        onSubmit={enviar}
        onCancel={() => navigate('/admin/productos')}
      />
    </AdminFormPage>
  )
}

/** Detalle de solo lectura: lo ven Administrador y Vendedor. */
export function AdminProductDetailContainer() {
  const { id } = useParams()
  const products = useProducts()
  const categories = useCategories()
  const { can } = useAuth()
  const product = products.find((p) => p.id === id)
  if (!product) return <NotFoundPage title="Producto no encontrado" message="No existe un producto con ese código." />
  const categoryName = categories.find((c) => c.id === product.categoryId)?.name ?? '—'
  return <AdminProductDetailPage product={product} categoryName={categoryName} canManage={can('products-manage')} />
}

export function AdminInventoryReportContainer() {
  const products = useProducts()
  const categories = useCategories()
  return <AdminInventoryReportPage report={inventoryReport(products, categories)} />
}
