// Datos iniciales de la tienda (la "base de datos" parte con esto la primera vez).
import { calculateTotals, findCouponPercent, getEffectivePrice, getShippingCost } from '../utils/pricing'
import { DELIVERY_OPTIONS } from './catalogs'

export const initialCategories = [
  {
    id: 'mat-construccion',
    name: 'Mat. Construcción',
    icon: '🧱',
    description: 'Cementos, morteros, áridos y fierros para la obra gruesa.',
  },
  {
    id: 'herramientas',
    name: 'Herramientas',
    icon: '🛠️',
    description: 'Herramientas eléctricas y manuales para maestros y contratistas.',
  },
  {
    id: 'gasfiteria',
    name: 'Gasfitería',
    icon: '🔧',
    description: 'Tuberías, griferías y accesorios para agua y desagües.',
  },
  {
    id: 'electricidad',
    name: 'Electricidad',
    icon: '⚡',
    description: 'Conductores, iluminación y accesorios eléctricos certificados.',
  },
  {
    id: 'pinturas',
    name: 'Pinturas',
    icon: '🎨',
    description: 'Látex, esmaltes y accesorios para terminaciones.',
  },
]

export const initialProducts = [
  { id: 'MC001', name: 'Cemento Polpaico gris 25 kg', categoryId: 'mat-construccion', subcategory: 'Cementos', brand: 'Polpaico', price: 5990, discountPercent: 0, stock: 80, criticalStock: 20, icon: '🧱', description: 'Cemento de alta resistencia para estructuras generales y radieres.' },
  { id: 'MC002', name: 'Cemento Melón blanco 25 kg', categoryId: 'mat-construccion', subcategory: 'Cementos', brand: 'Melón', price: 7490, discountPercent: 15, stock: 10, criticalStock: 10, icon: '🏗️', description: 'Cemento blanco ideal para terminaciones arquitectónicas y prefabricados.' },
  { id: 'MC003', name: 'Mortero cola cerámica 25 kg', categoryId: 'mat-construccion', subcategory: 'Morteros', brand: 'Volcán', price: 5200, discountPercent: 0, stock: 50, criticalStock: 15, icon: '📦', description: 'Adhesivo en polvo base cementicia para pegado de cerámicos en piso y muro.' },
  { id: 'MC004', name: 'Fierro estriado 8 mm x 12 m', categoryId: 'mat-construccion', subcategory: 'Aceros', brand: 'Cintac', price: 4990, discountPercent: 0, stock: 120, criticalStock: 30, icon: '📏', description: 'Barra de acero estriado para armaduras de hormigón, calidad A630-420H.' },
  { id: 'MC005', name: 'Arena fina construcción 25 kg', categoryId: 'mat-construccion', subcategory: 'Áridos', brand: 'Granel', price: 1800, discountPercent: 0, stock: 60, criticalStock: 20, icon: '⏳', description: 'Árido seleccionado limpio para estucos, revoques y pegado fino.' },
  { id: 'HE001', name: 'Taladro Percutor 650W', categoryId: 'herramientas', subcategory: 'Eléctricas', brand: 'Bosch', price: 42990, discountPercent: 10, stock: 15, criticalStock: 4, icon: '⚙️', description: 'Taladro percutor reversible con mandril de 13 mm para trabajo en concreto y metal.' },
  { id: 'HE002', name: 'Sierra Circular 7-1/4 1400W', categoryId: 'herramientas', subcategory: 'Eléctricas', brand: 'Makita', price: 68900, discountPercent: 0, stock: 8, criticalStock: 3, icon: '🪚', description: 'Corte preciso y potente en maderas duras con guía de profundidad ajustable.' },
  { id: 'HE003', name: 'Martillo carpintero 16 oz', categoryId: 'herramientas', subcategory: 'Manuales', brand: 'Stanley', price: 8990, discountPercent: 0, stock: 40, criticalStock: 10, icon: '🔨', description: 'Martillo de acero forjado con mango ergonómico antideslizante.' },
  { id: 'HE004', name: 'Set destornilladores 6 piezas', categoryId: 'herramientas', subcategory: 'Manuales', brand: 'Truper', price: 6990, discountPercent: 0, stock: 3, criticalStock: 5, icon: '🪛', description: 'Juego de destornilladores planos y phillips con punta magnética.' },
  { id: 'GA001', name: 'Tubo PVC Sanitario 110 mm 3 m', categoryId: 'gasfiteria', subcategory: 'Tuberías', brand: 'Tigre', price: 12500, discountPercent: 0, stock: 35, criticalStock: 10, icon: '🔧', description: 'Tubería de PVC para desagües domiciliarios con acople hermético.' },
  { id: 'GA002', name: 'Llave de paso 1/2 pulgada', categoryId: 'gasfiteria', subcategory: 'Griferías', brand: 'Nibsa', price: 3990, discountPercent: 0, stock: 4, criticalStock: 5, icon: '🚰', description: 'Llave de paso de bronce con cierre de 1/4 de vuelta.' },
  { id: 'EL001', name: 'Cable Unipolar THHN 2.5 mm Rojo 100 m', categoryId: 'electricidad', subcategory: 'Conductores', brand: 'Nexans', price: 38900, discountPercent: 0, stock: 22, criticalStock: 5, icon: '⚡', description: 'Cable de cobre de alta seguridad para instalaciones eléctricas interiores y comerciales.' },
  { id: 'EL002', name: 'Ampolleta LED 12W luz fría', categoryId: 'electricidad', subcategory: 'Iluminación', brand: 'Philips', price: 2490, discountPercent: 25, stock: 150, criticalStock: 40, icon: '💡', description: 'Ampolleta LED de bajo consumo, equivalente a 100W, vida útil de 15.000 horas.' },
  { id: 'EL003', name: 'Enchufe doble con tierra', categoryId: 'electricidad', subcategory: 'Accesorios', brand: 'Bticino', price: 3490, discountPercent: 0, stock: 70, criticalStock: 20, icon: '🔌', description: 'Enchufe doble 10A con conexión a tierra para embutir.' },
  { id: 'PI001', name: 'Látex interior blanco 1 galón', categoryId: 'pinturas', subcategory: 'Muros', brand: 'Ceresita', price: 18990, discountPercent: 20, stock: 30, criticalStock: 8, icon: '🎨', description: 'Pintura látex lavable de alto poder cubriente para muros y cielos interiores.' },
  { id: 'PI002', name: 'Esmalte al agua negro 1 galón', categoryId: 'pinturas', subcategory: 'Esmaltes', brand: 'Sherwin', price: 21990, discountPercent: 0, stock: 18, criticalStock: 6, icon: '🖌️', description: 'Esmalte al agua satinado para madera y metal, secado rápido y sin olor fuerte.' },
  { id: 'PI003', name: 'Rodillo profesional 23 cm', categoryId: 'pinturas', subcategory: 'Accesorios', brand: 'Tricolor', price: 4590, discountPercent: 0, stock: 45, criticalStock: 12, icon: '🧽', description: 'Rodillo de felpa media para aplicar látex y esmaltes en superficies lisas.' },
]

// RUN válidos (verificados con el módulo 11). Contraseñas de DEMOSTRACIÓN:
// al ser una base de datos simulada en el navegador se guardan tal cual; con
// el backend real deberán almacenarse con hash (bcrypt/argon2).
export const initialUsers = [
  { run: '111111111', name: 'Eduardo', lastname: 'Contreras', email: 'admin@duoc.cl', password: 'admin123', role: 'Administrador', region: 'Región de Coquimbo', comuna: 'La Serena', address: 'Av. Balmaceda 1020' },
  { run: '222222222', name: 'Dario', lastname: 'Sagredo', email: 'vendedor@profesor.duoc.cl', password: 'vende123', role: 'Vendedor', region: 'Región de Coquimbo', comuna: 'Coquimbo', address: 'Calle Videla 505' },
  { run: '189998880', name: 'Felipe', lastname: 'Cortés', email: 'contratista@gmail.com', password: 'cliente1', role: 'Cliente', region: 'Región de Coquimbo', comuna: 'La Serena', address: 'Calle Las Lilas 450' },
  { run: '123456785', name: 'María', lastname: 'Rojas', email: 'maria.rojas@gmail.com', password: 'maria123', role: 'Cliente', region: 'Región de Valparaíso', comuna: 'Viña del Mar', address: 'Av. Libertad 1234' },
]

// Pedidos de ejemplo para que el dashboard y los reportes tengan datos.
function sampleOrder({ number, createdAt, userRun, customer, address, deliveryId, paymentMethod, items, couponCode, status, failureReason }) {
  const lines = items.map(([productId, quantity]) => {
    const product = initialProducts.find((p) => p.id === productId)
    const unitPrice = getEffectivePrice(product)
    return { productId, name: product.name, icon: product.icon, categoryId: product.categoryId, quantity, unitPrice, subtotal: unitPrice * quantity }
  })
  const couponPercent = couponCode ? findCouponPercent(couponCode) : 0
  const afterDiscount = lines.reduce((s, l) => s + l.subtotal, 0) * (1 - couponPercent / 100)
  const shipping = getShippingCost(deliveryId, afterDiscount)
  const delivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryId)
  return {
    number,
    createdAt,
    status,
    failureReason: failureReason ?? null,
    userRun,
    customer,
    address,
    delivery: { id: delivery.id, label: delivery.label, cost: shipping },
    paymentMethod,
    coupon: couponCode ? { code: couponCode, percent: couponPercent } : null,
    items: lines,
    totals: calculateTotals(lines, { couponPercent, shipping }),
  }
}

export const initialOrders = [
  sampleOrder({
    number: '20260928-001', createdAt: '2026-09-28T14:20:00.000Z', userRun: '189998880', status: 'Pagada',
    customer: { name: 'Felipe', lastname: 'Cortés', email: 'contratista@gmail.com' },
    address: { street: 'Calle Las Lilas 450', apartment: '', region: 'Región de Coquimbo', comuna: 'La Serena', notes: 'Entregar en la obra, preguntar por Felipe.' },
    deliveryId: 'despacho', paymentMethod: 'tarjeta', items: [['MC001', 10], ['MC003', 4]],
  }),
  sampleOrder({
    number: '20261002-001', createdAt: '2026-10-02T16:05:00.000Z', userRun: '123456785', status: 'Pagada',
    customer: { name: 'María', lastname: 'Rojas', email: 'maria.rojas@gmail.com' },
    address: { street: 'Av. Libertad 1234', apartment: 'Depto 302', region: 'Región de Valparaíso', comuna: 'Viña del Mar', notes: '' },
    deliveryId: 'retiro', paymentMethod: 'transferencia', items: [['HE001', 1], ['EL002', 6]],
  }),
  sampleOrder({
    number: '20261008-001', createdAt: '2026-10-08T11:40:00.000Z', userRun: '189998880', status: 'Pagada',
    customer: { name: 'Felipe', lastname: 'Cortés', email: 'contratista@gmail.com' },
    address: { street: 'Calle Las Lilas 450', apartment: '', region: 'Región de Coquimbo', comuna: 'La Serena', notes: '' },
    deliveryId: 'despacho', paymentMethod: 'tarjeta', couponCode: 'CONTRATISTA10', items: [['PI001', 3], ['PI003', 3]],
  }),
  sampleOrder({
    number: '20261012-001', createdAt: '2026-10-12T09:15:00.000Z', userRun: null, status: 'Rechazada',
    failureReason: 'Pago rechazado por el emisor (simulación).',
    customer: { name: 'Pedro', lastname: 'Soto', email: 'pedro.soto@gmail.com' },
    address: { street: 'Av. Providencia 2020, Edificio Norte', apartment: 'Depto 603', region: 'Región Metropolitana de Santiago', comuna: 'Providencia', notes: 'Si no hay nadie, dejar con el conserje.' },
    deliveryId: 'despacho', paymentMethod: 'tarjeta-rechazada', items: [['GA001', 5]],
  }),
]

export const initialBlogs = [
  {
    slug: 'curado-del-hormigon',
    number: 1,
    icon: '🧱',
    title: 'El mito del curado del hormigón: ¿por qué regar el radier?',
    summary:
      'Muchos creen que el cemento se seca con el sol, cuando en realidad fragua por una reacción química que requiere agua constante para evitar fisuras tempranas en climas secos como La Serena.',
    paragraphs: [
      'Uno de los errores más comunes cometidos por maestros primerizos y dueños de casa es suponer que el radier de concreto debe "secarse" rápido con el sol. La realidad técnica es exactamente la contraria: el cemento hidráulico no se seca, fragua e hidrata.',
      'En zonas costeras y semiáridas como La Serena y Coquimbo, la radiación y los vientos aceleran la evaporación del agua superficial. Si no se irriga adecuadamente durante los primeros 7 días (o no se utilizan películas plásticas o membranas de curado), la pasta de cemento pierde resistencia compresiva hasta en un 40%, provocando agrietamientos por contracción plástica.',
    ],
    tip: 'Usa aditivos retenedores de humedad o mantén mantas de arpillera húmedas sobre el hormigón fresco durante las horas de mayor calor.',
  },
  {
    slug: 'cables-libres-de-halogeno',
    number: 2,
    icon: '⚡',
    title: 'Cables libres de halógeno: la seguridad que salva vidas',
    summary:
      'Conoce la diferencia técnica y normativa entre los conductores estándar y los conductores modernos EVA/H07Z1 para locales de reunión pública en Chile.',
    paragraphs: [
      'Con la actualización del pliego técnico RIC N°10 de la Superintendencia de Electricidad y Combustibles (SEC), los requerimientos para instalaciones residenciales y comerciales han elevado considerablemente el estándar en conductores eléctricos.',
      'A diferencia del aislante tradicional de PVC (que al arder desprende ácido clorhídrico altamente tóxico y corrosivo), los cables de polietileno reticulado o copolímero termoestable no emiten gases tóxicos ni humos densos que impidan la evacuación de personas en recintos cerrados.',
    ],
    tip: 'Disponemos de rollos certificados en marcas líderes como Nexans y Cocesa con entrega directa en obra.',
  },
]
