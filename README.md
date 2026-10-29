# Ferretería Los Maestros — Evaluación Parcial 2 (DSY1104 · Desarrollo Fullstack II)

Aplicación web de una ferretería construida con **React + Vite**, migrada desde la Entrega 1 (HTML/CSS/JS estático).
Incluye catálogo, carrito, compra con pago simulado (exitoso / fallido), boleta y un **panel de administración**
(órdenes, productos, categorías, usuarios, reportes y perfil) con control de acceso por rol.

## Cómo ejecutarla

Requisitos: Node.js 20 o superior.

```bash
npm install          # instala dependencias
npm run dev          # servidor de desarrollo  → http://localhost:5173
npm run build        # compila para producción en dist/
npm run preview      # sirve la versión compilada

npm test             # pruebas unitarias (Vitest) en modo observación
npm run test:run     # pruebas una sola vez
npm run coverage     # pruebas + informe de cobertura (carpeta coverage/, abrir coverage/index.html)
```

### Cuentas de demostración

| Rol            | Correo                       | Contraseña | Acceso                                                    |
|----------------|------------------------------|------------|-----------------------------------------------------------|
| Administrador  | `admin@duoc.cl`              | `admin123` | Todo el panel                                             |
| Vendedor       | `vendedor@profesor.duoc.cl`  | `vende123` | Dashboard, órdenes, productos y perfil                    |
| Cliente        | `contratista@gmail.com`      | `cliente1` | Solo la tienda (el panel muestra “Acceso restringido”)    |
| Cliente        | `maria.rojas@gmail.com`      | `maria123` | Solo la tienda                                            |

Cupones de descuento (10 %): `CONTRATISTA10` y `MAESTRO10`. Despacho gratis desde $50.000.
En el checkout, el método **“Tarjeta de prueba RECHAZADA”** simula un pago fallido para mostrar esa vista.

## Tecnologías

React 19 · Vite · React Router 7 · React Bootstrap / Bootstrap 5 (diseño responsive *mobile-first*) ·
Vitest + React Testing Library + user-event (pruebas) · `@vitest/coverage-v8` (cobertura).

## Arquitectura

### Atomic Design (`src/components/`)

| Nivel         | Qué contiene                                                              | Ejemplos                                                  |
|---------------|---------------------------------------------------------------------------|-----------------------------------------------------------|
| `atoms/`      | Elementos mínimos, sin estado de negocio                                  | `ActionButton`, `TextInput`, `PriceTag`, `StockBadge`     |
| `molecules/`  | Combinación de átomos con una sola responsabilidad                        | `FormField`, `QuantityControl`, `ProductCard`, `StatCard` |
| `organisms/`  | Secciones completas, reciben datos y *callbacks* por props                | `Header`, `ProductGrid`, `CheckoutForm`, `DataTable`      |
| `templates/`  | Estructura de página con “huecos” (`StoreLayout`, `AdminLayout`)          |                                                           |
| `pages/`      | Pantallas completas, solo presentación                                    | `ProductsPage`, `CartPage`, `AdminProductsPage`           |

### Contenedor / Presentacional

* **Presentacionales** (`components/**`): reciben todo por *props*, no leen la base de datos ni cambian la URL.
* **Contenedores** (`src/containers/`): tienen el **estado**, los **efectos** y hablan con los servicios
  (`ProductsContainer`, `CheckoutContainer`, `AdminProductsContainers`, …). Cada uno entrega los datos a una página.

### Datos (base de datos simulada)

* `src/data/seed.js`: datos iniciales (5 categorías, 17 productos, 4 usuarios, 4 órdenes, blogs).
* `src/data/createRepository.js`: mini-repositorio con **CRUD** (`getAll`, `getById`, `create`, `update`, `remove`),
  persistencia en `localStorage` y **suscripciones**. Cuando algo cambia, avisa a los componentes suscritos.
* `src/hooks/useRepository.js`: hooks (`useProducts`, `useOrders`, …) que mantienen la pantalla **actualizada en tiempo real**.
  Ejemplo: si el administrador cambia un precio, el total del carrito y el catálogo se actualizan sin recargar.
* `src/services/`: reglas de negocio y validación (productos, usuarios, categorías, órdenes, reportes) y la
  **pasarela de pago simulada** (`paymentGateway.js`), aislada para poder *mockearla* en las pruebas.
* `src/context/`: sesión (`AuthContext`), carrito (`CartContext`) y avisos (`ToastContext`).

### Estructura de carpetas

```
src/
├─ components/ atoms · molecules · organisms · templates · pages   (+ pruebas *.test.jsx)
├─ containers/   estado y lógica de cada pantalla
├─ context/      Auth, Cart, Toast
├─ hooks/        useRepository, useForm, useAddToCart
├─ services/     reglas de negocio, validaciones, pasarela de pago
├─ data/         seed, repositorios (CRUD simulado), catálogos, menú del panel
├─ utils/        formato, precios/IVA, validadores (RUN módulo 11), filtros
├─ styles/       tema propio sobre Bootstrap
└─ test/         utilidades de prueba (renderWithProviders, renderWithRouter)
```

## Reglas de negocio implementadas

* RUN válido (módulo 11); correos solo `@duoc.cl`, `@profesor.duoc.cl` o `@gmail.com`; contraseña de 4 a 10 caracteres.
* Región → comuna encadenadas. Roles: Administrador, Vendedor, Cliente.
* Precios con IVA 19 % incluido (neto = total / 1,19). Ofertas por porcentaje. Stock crítico = stock ≤ nivel crítico.
* El carrito nunca supera el stock; un producto agotado no se puede comprar.
* El stock **solo se descuenta cuando el pago es aprobado**; los pagos rechazados quedan registrados con su motivo.
* Número de orden con formato `AAAAMMDD-NNN`.

## Pruebas unitarias y cobertura

* **331 pruebas** en 23 archivos (Vitest + React Testing Library), cobertura global ≈ **99,2 % sentencias / 96,7 % ramas /
  98,7 % funciones / 99,6 % líneas**. El detalle (por tipo de prueba y por capa) está en el
  *Documento de cobertura de pruebas*.
* Tipos de prueba: renderizado, renderizado condicional, props, estado, eventos, integración de flujos completos y
  reglas de negocio. Se usan **mocks** (`vi.fn`, `vi.spyOn`, `mockResolvedValue`, temporizadores falsos) para la
  pasarela de pago, `window.print`, `localStorage` y los *callbacks* de los componentes.
* Cada prueba parte con la base de datos y el `localStorage` reiniciados (`src/setupTests.js`), por lo que son independientes.

## Flujo de trabajo con Git (equipo de hasta 3 personas)

* Rama `main` estable; **una rama por funcionalidad** (`feature/carrito`, `feature/checkout`, `feature/panel-productos`,
  `feature/pruebas-unitarias`, …) creada desde `main`.
* **Commits individuales y pequeños** de cada integrante, con mensajes en imperativo (`feat:`, `fix:`, `test:`, `docs:`).
* Cada funcionalidad se une a `main` mediante **Pull Request** con al menos una revisión de otro integrante.
* El repositorio de GitHub debe ser **público** y entregarse junto con el `.zip` del frontend.

```bash
git init && git branch -M main
git remote add origin <URL-del-repositorio>
git checkout -b feature/mi-funcionalidad
git add . && git commit -m "feat: descripción corta"
git push -u origin feature/mi-funcionalidad    
```

## Integrantes

* Felipe Cortés
* Darío Sagredo
* Eduardo Contreras
