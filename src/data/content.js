// Contenido editorial de la tienda (textos de portada).
export const heroSlides = [
  {
    id: 'trayectoria',
    icon: '🏗️',
    title: '22 años construyendo junto a ti',
    text: 'Materiales de construcción, herramientas de calidad y cotizaciones al instante para maestros, contratistas y familias de la región.',
    ctaLabel: 'Ver catálogo completo',
    to: '/productos',
  },
  {
    id: 'ofertas',
    icon: '🏷️',
    title: 'Ofertas para tu obra',
    text: 'Aprovecha descuentos en cementos, herramientas, iluminación y pinturas. Stock limitado.',
    ctaLabel: 'Ver ofertas',
    to: '/ofertas',
  },
  {
    id: 'cupones',
    icon: '🎟️',
    title: '10% extra para contratistas',
    text: 'Usa el cupón CONTRATISTA10 o MAESTRO10 en tu carrito y ahorra en toda tu compra.',
    ctaLabel: 'Ir al carrito',
    to: '/carrito',
  },
]

// Valores iniciales de los formularios de usuario (registro, alta/edición y perfil).
export const EMPTY_USER = {
  run: '',
  name: '',
  lastname: '',
  email: '',
  password: '',
  passwordConfirm: '',
  region: '',
  comuna: '',
  address: '',
  role: 'Cliente',
}
