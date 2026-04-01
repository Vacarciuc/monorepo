import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import CartPage from '../../pages/CartPage';
import ProtectedRoute from '../../routes/ProtectedRoute';

vi.mock('../../api/cart.api', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [] }),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock('../../api/product.api', () => ({
  getImageUrl: vi.fn((p) => p ?? ''),
}));

const renderCart = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/login" element={<div>Pagina Login</div>} />
          <Route path="/" element={<div>Acasă</div>} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CartPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('este accesibilă doar utilizatorilor cu rol CUSTOMER — neautentificatul este redirecționat la /login', () => {
    renderCart();
    expect(screen.getByText('Pagina Login')).toBeInTheDocument();
    expect(screen.queryByText(/coșul meu/i)).not.toBeInTheDocument();
  });
});


