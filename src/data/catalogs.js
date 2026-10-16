// Catálogos fijos del negocio: regiones, roles, formas de entrega y de pago.

export const regionesYComunas = [
  {
    region: 'Región de Coquimbo',
    comunas: ['La Serena', 'Coquimbo', 'Ovalle', 'Vicuña', 'Illapel'],
  },
  {
    region: 'Región Metropolitana de Santiago',
    comunas: ['Santiago', 'Providencia', 'Las Condes', 'Maipú', 'Puente Alto', 'Ñuñoa'],
  },
  {
    region: 'Región de Valparaíso',
    comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Quillota'],
  },
  {
    region: 'Región del Biobío',
    comunas: ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Chiguayante', 'Los Ángeles'],
  },
]

export const ROLES = {
  ADMIN: 'Administrador',
  SELLER: 'Vendedor',
  CLIENT: 'Cliente',
}

export const roleOptions = [
  { value: ROLES.ADMIN, label: 'Administrador (acceso total)' },
  { value: ROLES.SELLER, label: 'Vendedor (inventario y pedidos)' },
  { value: ROLES.CLIENT, label: 'Cliente / Contratista (solo tienda)' },
]

// Despacho gratis sobre este monto (CLP, ya con descuentos aplicados).
export const FREE_SHIPPING_FROM = 50000

export const DELIVERY_OPTIONS = [
  {
    id: 'retiro',
    label: 'Retiro en tienda',
    description: 'Casa matriz La Serena, lunes a sábado. Sin costo.',
    cost: 0,
    freeFrom: null,
  },
  {
    id: 'despacho',
    label: 'Despacho a domicilio / obra',
    description: 'Entrega en 24 a 48 horas hábiles. Gratis sobre $50.000.',
    cost: 4990,
    freeFrom: FREE_SHIPPING_FROM,
  },
]

export const PAYMENT_METHODS = [
  { id: 'tarjeta', label: 'Tarjeta de crédito / débito' },
  { id: 'transferencia', label: 'Transferencia bancaria' },
  // Solo para demostración: permite ver la vista "No se pudo realizar el pago".
  { id: 'tarjeta-rechazada', label: 'Tarjeta de prueba RECHAZADA (simulación)' },
]

// Largo máximo del comentario del formulario de contacto.
export const MESSAGE_MAX_LENGTH = 500
