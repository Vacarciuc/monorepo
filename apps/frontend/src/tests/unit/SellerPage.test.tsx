import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import SellerPage from '../../pages/SellerPage';
import ProtectedRoute from '../../routes/ProtectedRoute';

vi.mock('../../api/product.api', () => ({
  getProducts: vi.fn().mockResolvedValue([]),
  getImageUrl: vi.fn((p) => p ?? ''),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

const renderSeller = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/seller']}>
        <Routes>
          <Route path="/login" element={<div>Pagina Login</div>} />
          <Route
            path="/seller"
            element={<ProtectedRoute><SellerPage /></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('SellerPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('este accesibilă doar pentru utilizatori cu rol SELLER sau ADMIN — neautentificatul este redirecționat', () => {
    // Neautentificat → redirecționare la /login
    renderSeller();
    expect(screen.getByText('Pagina Login')).toBeInTheDocument();
    expect(screen.queryByText(/gestionare produse/i)).not.toBeInTheDocument();
  });
});

