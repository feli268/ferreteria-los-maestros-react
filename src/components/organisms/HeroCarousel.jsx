// Organismo: carrusel de portada. `slides` = [{ id, icon, title, text, ctaLabel, to }].
import Carousel from 'react-bootstrap/Carousel'
import { Link } from 'react-router-dom'
import Icon from '../atoms/Icon'

export default function HeroCarousel({ slides }) {
  return (
    <Carousel className="lm-hero rounded overflow-hidden" aria-label="Destacados" interval={6000} pause="hover">
      {slides.map((slide) => (
        <Carousel.Item key={slide.id}>
          <div className="lm-hero-slide d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 text-center text-md-start">
            <div className="lm-hero-text">
              <h2 className="fw-bold lm-hero-title">{slide.title}</h2>
              <p className="lead">{slide.text}</p>
              <Link to={slide.to} className="btn btn-primary btn-lg">
                {slide.ctaLabel}
              </Link>
            </div>
            <Icon symbol={slide.icon} size="5rem" />
          </div>
        </Carousel.Item>
      ))}
    </Carousel>
  )
}
