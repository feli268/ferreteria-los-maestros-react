// Página: listado de artículos del blog.
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon'
import PageHeader from '../molecules/PageHeader'

export default function BlogsPage({ blogs }) {
  return (
    <>
      <PageHeader title="Blog del maestro" subtitle="Consejos técnicos para tu obra." />
      <Row className="g-3">
        {blogs.map((blog) => (
          <Col key={blog.slug} xs={12} md={6}>
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Icon symbol={blog.icon} size="2.5rem" />
                <Card.Title as="h2" className="h5 mt-2">{blog.title}</Card.Title>
                <Card.Text className="text-secondary">{blog.summary}</Card.Text>
                <Link to={`/blogs/${blog.slug}`} className="btn btn-outline-primary mt-auto align-self-start">
                  Leer artículo
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
