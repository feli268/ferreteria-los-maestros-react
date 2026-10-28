// Página: artículo del blog.
import Alert from 'react-bootstrap/Alert'
import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon'

export default function BlogDetailPage({ blog }) {
  return (
    <article className="mx-auto" style={{ maxWidth: 780 }}>
      <nav aria-label="Ruta de navegación" className="small mb-3">
        <Link to="/blogs">← Volver a los blogs</Link>
      </nav>
      <Icon symbol={blog.icon} size="3rem" />
      <h1 className="h2 mt-2 mb-4">{blog.title}</h1>
      {blog.paragraphs.map((parrafo, i) => (
        <p key={i} className="fs-5">{parrafo}</p>
      ))}
      <Alert variant="warning">
        <strong>Tip del maestro:</strong> {blog.tip}
      </Alert>
    </article>
  )
}
