# Ferretería Los Maestros — Evaluación 3 (DSY1104 · Desarrollo Fullstack II)

Aplicación web de una ferretería construida con **React + Vite**. En la Evaluación 3 el frontend dejó de usar datos
simulados en el navegador y ahora consume la **API REST del backend (Spring Boot)**, con autenticación **JWT** y roles.
Incluye catálogo, carrito, compra con pago simulado (exitoso / fallido), boleta y un **panel de administración**
con control de acceso por rol.

* Backend (Spring Boot, MySQL, Spring Security + JWT, Swagger): https://github.com/feli268/ferreteria-los-maestros-backend

## Cómo ejecutarla

Requisitos: Node.js 20 o superior y el **backend en ejecución** (ver el README del repositorio del backend;
por defecto escucha en `http://localhost:8080`).

```bash
# 1) Backend (otra terminal, carpeta del backend). Necesita Java 17 y MySQL, o el perfil h2 para probar sin MySQL:
mvn spring-boot:run                              # MySQL (ver README del backend)
mvn spring-boot:run -Dspring-boot.run.profiles=h2   # base de datos en memoria

# 2) Frontend (esta carpeta)
npm install
npm run dev          # → http://localhost:5173
```

Si el backend corre en otra dirección, copia `.env.example` como `.env` y cambia `VITE_API_URL`.
Swagger del backend: `http://localhost:8080/swagger-ui.html`.

```bash
npm run build        # compila para producción en dist/
npm run preview      # sirve la versión compilada

npm test             # pruebas unitarias (Vitest) en modo observación
npm run test:run     # pruebas una sola vez
npm run coverage     # pruebas + informe de cobertura (carpeta coverage/, abrir coverage/index.html)
```

### Cuentas de demostración

Son los usuarios que el backend crea al iniciar con la base de datos vacía.

| Rol            | Correo                       | Contraseña | Acceso                                                    |
|----------------|------------------------------|------------|-----------------------------------------------------------|
| Administrador  | `admin@duoc.cl`              | `admin123` | Todo el panel y todas las operaciones                     |
| Vendedor       | `vendedor@profesor.duoc.cl`  | `vende123` | **Solo** lista y detalle de productos y de órdenes (solo lectura) |
| Cliente        | `contratista@gmail.com`      | `cliente1` | Solo la tienda (el panel muestra “Acceso restringido”)    |
| Cliente        | `maria.rojas@gmail.com`      | `maria123` | Solo la tienda                                            |

Cupones de descuento (10 %): `CONTRATISTA10` y `MAESTRO10`. Despacho gratis desde $50.000.
En el checkout, el método **“Tarjeta de prueba RECHAZADA”** simula un pago fallido para mostrar esa vista.

## Tecnologías

React 19 · Vite · React Router 7 · React Bootstrap / Bootstrap 5 (diseño responsive *mobile-first*) · `fetch` para
consumir la API · Vitest + React Testing Library + user-event (pruebas) · `@vitest/coverage-v8` (cobertura).

## Conexión con el backend (Evaluación 3)

* **Cliente HTTP** (`src/api/http.js`): usa `fetch`, antepone la versión de la API (`/api/v1`), envía el token JWT en
  `Authorization: Bearer …` y convierte los errores del backend en un `ApiError` (código, mensaje y errores por campo).
  Si no hay respuesta del servidor muestra “No fue posible comunicarse con el servidor…”. Si el backend responde 401
  con un token guardado, se cierra la sesión.
* **Un módulo por recurso** (`src/api/index.js`): `authApi`, `categoriasApi`, `productosApi`, `usuariosApi`, `boletasApi`.

| Pantalla / acción                  | Endpoint                                           | Quién puede                    |
|------------------------------------|----------------------------------------------------|--------------------------------|
| Iniciar sesión / registrarse       | `POST /auth/login`, `POST /auth/registro`          | Público                        |
| Mi perfil                          | `GET` y `PUT /auth/me`                             | Administrador                  |
| Catálogo y detalle                 | `GET /categorias`, `GET /productos[/{id}]`         | Público                        |
| Crear / editar / borrar productos y categorías | `POST`, `PUT`, `DELETE /productos`, `/categorias` | Administrador        |
| Usuarios (CRUD)                    | `/usuarios`                                        | Administrador                  |
| Comprar (checkout)                 | `POST /boletas`                                    | Público (con token se asocia al usuario) |
| Lista y detalle de órdenes         | `GET /boletas`, `GET /boletas/{numero}`            | Administrador y Vendedor       |

* **Roles** (`authService.PERMISSIONS`): el Administrador ve todo; el **Vendedor solo ve** la lista y el detalle de
  productos y de órdenes (no ve dashboard, categorías, usuarios, reportes ni perfil, y esas URLs quedan bloqueadas);
  el Cliente solo usa la tienda. El backend valida los mismos permisos con Spring Security, por lo que el frontend
  no es la única barrera.
* **Sesión**: se guarda `{ token, user, expiresAt }` en `localStorage` (`lm_session`). Al abrir la aplicación se
  confirma con `GET /auth/me`; si el token venció o el usuario ya no existe, se vuelve al login.
* **Carga de datos** (`DataProvider`): carga el catálogo público y, según el rol, las órdenes y los usuarios.
  Mientras tanto se muestra “Cargando datos…”; si el servidor no responde, aparece un aviso con el botón **Reintentar**.

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

### Datos (API REST + caché en memoria)

* `src/api/`: cliente HTTP y módulos por recurso (ver arriba). **Los datos viven en la base de datos del backend.**
* `src/data/createRemoteRepository.js`: caché en memoria de cada recurso (`getAll`, `getById`, `refresh`, `upsert`,
  `drop`) con **suscripciones**: cuando algo cambia, avisa a los componentes suscritos. Se llena con las respuestas
  de la API, así la pantalla se mantiene **actualizada sin recargar** (por ejemplo, tras comprar baja el stock).
* `src/data/createRepository.js`: repositorio local en `localStorage`, usado solo para los mensajes de contacto
  (que la API no tiene).
* `src/hooks/useRepository.js`: hooks (`useProducts`, `useOrders`, …) que leen esas cachés.
* `src/services/`: reglas de negocio y validación (productos, usuarios, categorías, órdenes, reportes). Las
  validaciones se repiten en el cliente para responder al instante, pero **el backend es quien decide**: el precio
  final, el stock, el descuento y el resultado del pago los calcula Spring Boot al registrar la boleta.
* `src/context/`: sesión (`AuthContext`), datos (`DataContext`), carrito (`CartContext`) y avisos (`ToastContext`).

### Estructura de carpetas

```
src/
├─ components/ atoms · molecules · organisms · templates · pages   (+ pruebas *.test.jsx)
├─ containers/   estado y lógica de cada pantalla
├─ api/          cliente HTTP (fetch + JWT) y un módulo por recurso del backend
├─ context/      Auth, Data, Cart, Toast
├─ hooks/        useRepository, useForm, useAddToCart
├─ services/     reglas de negocio y validaciones; llaman a la API
├─ data/         cachés de la API (createRemoteRepository), catálogos, menú del panel
├─ utils/        formato, precios/IVA, validadores (RUN módulo 11), filtros
├─ styles/       tema propio sobre Bootstrap
└─ test/         utilidades de prueba (renderWithProviders, backend falso con fetch)
```

## Reglas de negocio implementadas

* RUN válido (módulo 11); correos solo `@duoc.cl`, `@profesor.duoc.cl` o `@gmail.com`; contraseña de 4 a 10 caracteres.
* Región → comuna encadenadas. Roles: Administrador, Vendedor, Cliente.
* Precios con IVA 19 % incluido (neto = total / 1,19). Ofertas por porcentaje. Stock crítico = stock ≤ nivel crítico.
* El carrito nunca supera el stock; un producto agotado no se puede comprar.
* El stock **solo se descuenta cuando el pago es aprobado**; los pagos rechazados quedan registrados con su motivo.
* Número de orden con formato `AAAAMMDD-NNN` (lo asigna el backend).
* Un producto con ventas registradas, una categoría con productos o el último administrador no se pueden eliminar (el backend responde 409).

## Pruebas unitarias y cobertura

* **379 pruebas** en 24 archivos (Vitest + React Testing Library), cobertura global ≈ **98,6 % sentencias / 95,6 % ramas /
  98,5 % funciones / 99,1 % líneas** (`npm run coverage`).
* Tipos de prueba: renderizado, renderizado condicional, props, estado, eventos, integración de flujos completos y
  reglas de negocio. Las pruebas **no necesitan el backend**: `src/test/fakeBackend.js` reemplaza `fetch` y responde
  como la API (tokens, permisos por rol, stock, totales, pago rechazado, errores 400/401/403/409 y servidor caído).
  Las pruebas del backend (75, con JUnit y MockMvc) están en su propio repositorio.
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
