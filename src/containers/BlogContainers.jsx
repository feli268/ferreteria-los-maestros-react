// Contenedores: listado y detalle de blogs.
import { useParams } from 'react-router-dom'
import BlogDetailPage from '../components/pages/BlogDetailPage'
import BlogsPage from '../components/pages/BlogsPage'
import NotFoundPage from '../components/pages/NotFoundPage'
import { initialBlogs } from '../data/seed'

export function BlogsContainer() {
  return <BlogsPage blogs={initialBlogs} />
}

export function BlogDetailContainer() {
  const { slug } = useParams()
  const blog = initialBlogs.find((b) => b.slug === slug)
  if (!blog) return <NotFoundPage title="Artículo no encontrado" />
  return <BlogDetailPage blog={blog} />
}
