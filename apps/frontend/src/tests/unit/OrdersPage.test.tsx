import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import OrdersPage from '../../pages/OrdersPage';
import ProtectedRoute from '../../routes/ProtectedRoute';

vi.mock('../../api/order.api', () => ({
  getOrders: vi.fn().mockResolvedValue([]),
  getOrder: vi.fn(),
  createOrder: vi.fn(),
}));

const renderOrders = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/login" element={<div>Pagina Login</div>} />
          <Route
            path="/orders"
            element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('OrdersPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('este accesibilă doar utilizatorilor autentificați — neautentificatul este redirecționat la /login', () => {
    // Niciun token → redirecționare
    renderOrders();
    expect(screen.getByText('Pagina Login')).toBeInTheDocument();
    expect(screen.queryByText(/comenzile mele/i)).not.toBeInTheDocument();
  });
});

