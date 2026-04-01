import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import RegisterPage from '../../pages/RegisterPage';

vi.mock('../../api/auth.api');
vi.mock('../../api/cart.api', () => ({ getCart: vi.fn().mockResolvedValue({ items: [] }) }));

const renderRegister = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<div>Pagina Produse</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirecționează utilizatorul autentificat — pagina este disponibilă doar utilizatorilor neautentificați', () => {
    // Simulăm un utilizator deja autentificat (orice rol)
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'SELLER');

    renderRegister();

    // Nu trebuie să vadă formularul de înregistrare
    expect(screen.getByText('Pagina Produse')).toBeInTheDocument();
    expect(screen.queryByLabelText(/nume utilizator/i)).not.toBeInTheDocument();
  });
});
