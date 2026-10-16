// Opciones del panel de administración y el área de permisos que requiere cada una.
export const ADMIN_MENU = [
  { to: '/admin', end: true, label: 'Dashboard', icon: '📊', area: 'dashboard', description: 'Resumen general del negocio.' },
  { to: '/admin/ordenes', label: 'Órdenes', icon: '🧾', area: 'orders', description: 'Pedidos recibidos y su estado de pago.' },
  { to: '/admin/productos', label: 'Productos', icon: '📦', area: 'products', description: 'Inventario, precios, ofertas y stock crítico.' },
  { to: '/admin/categorias', label: 'Categorías', icon: '🗂️', area: 'categories', description: 'Agrupa los productos de la tienda.' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥', area: 'users', description: 'Cuentas, roles e historial de compras.' },
  { to: '/admin/reportes', label: 'Reportes', icon: '📈', area: 'reports', description: 'Ventas por producto y por categoría.' },
  { to: '/admin/perfil', label: 'Mi perfil', icon: '👤', area: 'profile', description: 'Actualiza tus datos de contacto.' },
]
