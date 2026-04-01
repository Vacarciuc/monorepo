import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import CartPage from '../../pages/CartPage';
import ProtectedRoute from '../../routes/ProtectedRoute';

// ── Mocks ──────────────────────────────────────────────────────────────────

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
          <Route
            path="/cart"
            element={<ProtectedRoute><CartPage /></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

// ── Tests ─────────────────────────────────────────────────────────────────

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirecționează la /login utilizatorii neautentificați — pagina este disponibilă doar utilizatorilor autentificați', () => {
    // Niciun token → neautentificat
    renderCart();

    expect(screen.getByText('Pagina Login')).toBeInTheDocument();
    expect(screen.queryByText(/coșul meu/i)).not.toBeInTheDocument();
  });
});
