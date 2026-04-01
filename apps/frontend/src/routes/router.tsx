import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProductsPage from '../pages/ProductsPage';
import AdminPage from '../pages/AdminPage';
import SellerPage from '../pages/SellerPage';
import CartPage from '../pages/CartPage';
import OrdersPage from '../pages/OrdersPage';
import ProtectedRoute from './ProtectedRoute';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — any authenticated user */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />

        {/* Cart and orders — CUSTOMER only */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Product management — SELLER and ADMIN */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
              <SellerPage />
            </ProtectedRoute>
          }
        />

        {/* User management — ADMIN only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
