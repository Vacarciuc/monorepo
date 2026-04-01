import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import LoginPage from '../../pages/LoginPage';

vi.mock('../../api/auth.api');
vi.mock('../../api/cart.api', () => ({ getCart: vi.fn().mockResolvedValue({ items: [] }) }));

const renderLogin = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={<div>Pagina Produse</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirecționează utilizatorul autentificat — pagina este disponibilă doar utilizatorilor neautentificați', () => {
    // Simulăm un utilizator deja autentificat (orice rol)
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'CUSTOMER');

    renderLogin();

    // Nu trebuie să vadă formularul de login, ci să fie redirecționat
    expect(screen.getByText('Pagina Produse')).toBeInTheDocument();
    expect(screen.queryByLabelText(/parolă/i)).not.toBeInTheDocument();
  });
});
