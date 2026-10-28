// Raíz de la aplicación: proveedores globales (sesión, carrito, avisos) y mapa de rutas.
import { Route, Routes } from 'react-router-dom'
import NotFoundPage from './components/pages/NotFoundPage'
import AboutPage from './components/pages/AboutPage'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { AdminCategoriesContainer, AdminCategoryFormContainer } from './containers/AdminCategoriesContainers'
import AdminDashboardContainer from './containers/AdminDashboardContainer'
import AdminLayoutContainer from './containers/AdminLayoutContainer'
import { AdminOrderDetailContainer, AdminOrdersContainer } from './containers/AdminOrdersContainers'
import {
  AdminInventoryReportContainer,
  AdminProductFormContainer,
  AdminProductsContainer,
} from './containers/AdminProductsContainers'
import AdminProfileContainer from './containers/AdminProfileContainer'
import AdminReportsContainer from './containers/AdminReportsContainer'
import { AdminUserDetailContainer, AdminUserFormContainer, AdminUsersContainer } from './containers/AdminUsersContainers'
import { BlogDetailContainer, BlogsContainer } from './containers/BlogContainers'
import CartContainer from './containers/CartContainer'
import CategoriesContainer from './containers/CategoriesContainer'
import CheckoutContainer from './containers/CheckoutContainer'
import ContactContainer from './containers/ContactContainer'
import HomeContainer from './containers/HomeContainer'
import LoginContainer from './containers/LoginContainer'
import ProductDetailContainer from './containers/ProductDetailContainer'
import ProductsContainer from './containers/ProductsContainer'
import PurchaseResultContainer from './containers/PurchaseResultContainer'
import RegisterContainer from './containers/RegisterContainer'
import RequireArea from './containers/RequireArea'
import StoreLayoutContainer from './containers/StoreLayoutContainer'
import ToastHostContainer from './containers/ToastHostContainer'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Tienda */}
            <Route element={<StoreLayoutContainer />}>
              <Route index element={<HomeContainer />} />
              <Route path="productos" element={<ProductsContainer mode="all" />} />
              <Route path="productos/:id" element={<ProductDetailContainer />} />
              <Route path="categorias" element={<CategoriesContainer />} />
              <Route path="categorias/:slug" element={<ProductsContainer mode="category" />} />
              <Route path="ofertas" element={<ProductsContainer mode="offers" />} />
              <Route path="nosotros" element={<AboutPage />} />
              <Route path="blogs" element={<BlogsContainer />} />
              <Route path="blogs/:slug" element={<BlogDetailContainer />} />
              <Route path="contacto" element={<ContactContainer />} />
              <Route path="login" element={<LoginContainer />} />
              <Route path="registro" element={<RegisterContainer />} />
              <Route path="carrito" element={<CartContainer />} />
              <Route path="checkout" element={<CheckoutContainer />} />
              <Route path="compra-exitosa/:orderNumber" element={<PurchaseResultContainer expected="success" />} />
              <Route path="compra-fallida/:orderNumber" element={<PurchaseResultContainer expected="failed" />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Panel de administración (Administrador y Vendedor) */}
            <Route path="admin" element={<AdminLayoutContainer />}>
              <Route index element={<AdminDashboardContainer />} />
              <Route path="perfil" element={<AdminProfileContainer />} />

              <Route element={<RequireArea area="orders" />}>
                <Route path="ordenes" element={<AdminOrdersContainer />} />
                <Route path="ordenes/:number" element={<AdminOrderDetailContainer />} />
              </Route>

              <Route element={<RequireArea area="products" />}>
                <Route path="productos" element={<AdminProductsContainer mode="all" />} />
                <Route path="productos/nuevo" element={<AdminProductFormContainer />} />
                <Route path="productos/criticos" element={<AdminProductsContainer mode="critical" />} />
                <Route path="productos/reportes" element={<AdminInventoryReportContainer />} />
                <Route path="productos/:id/editar" element={<AdminProductFormContainer />} />
              </Route>

              <Route element={<RequireArea area="categories" />}>
                <Route path="categorias" element={<AdminCategoriesContainer />} />
                <Route path="categorias/nueva" element={<AdminCategoryFormContainer />} />
                <Route path="categorias/:id/editar" element={<AdminCategoryFormContainer />} />
              </Route>

              <Route element={<RequireArea area="users" />}>
                <Route path="usuarios" element={<AdminUsersContainer />} />
                <Route path="usuarios/nuevo" element={<AdminUserFormContainer />} />
                <Route path="usuarios/:run" element={<AdminUserDetailContainer />} />
                <Route path="usuarios/:run/editar" element={<AdminUserFormContainer />} />
              </Route>

              <Route element={<RequireArea area="reports" />}>
                <Route path="reportes" element={<AdminReportsContainer />} />
              </Route>

              <Route path="*" element={<NotFoundPage title="Sección no encontrada" />} />
            </Route>
          </Routes>
          <ToastHostContainer />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
