import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

vi.mock('../../api/cart.api', () => ({ getCart: vi.fn().mockResolvedValue({ items: [] }) }));
vi.mock('../../api/auth.api');

const renderNavbar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AuthProvider>,
  );

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('afișează linkuri corecte în funcție de rol', () => {
    // ─── NEAUTENTIFICAT ───────────────────────────────────────────────
    const { unmount: unmount1 } = renderNavbar();
    expect(screen.queryByText(/deconectare/i)).not.toBeInTheDocument();
    unmount1();

    // ─── CUSTOMER ────────────────────────────────────────────────────
    localStorage.setItem('auth_token', 'tok');
    localStorage.setItem('user_role', 'CUSTOMER');
    const { unmount: unmount2 } = renderNavbar();
    expect(screen.getByRole('link', { name: /coș/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /comenzile mele/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /produsele mele/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /utilizatori/i })).not.toBeInTheDocument();
    unmount2();
    localStorage.clear();

    // ─── SELLER ──────────────────────────────────────────────────────
    localStorage.setItem('auth_token', 'tok');
    localStorage.setItem('user_role', 'SELLER');
    const { unmount: unmount3 } = renderNavbar();
    expect(screen.getByRole('link', { name: /produsele mele/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /utilizatori/i })).not.toBeInTheDocument();
    unmount3();
    localStorage.clear();

    // ─── ADMIN ───────────────────────────────────────────────────────
    localStorage.setItem('auth_token', 'tok');
    localStorage.setItem('user_role', 'ADMIN');
    renderNavbar();
    // Admin vede linkul /admin (Utilizatori) și linkul /seller (Produse)
    expect(screen.getByRole('link', { name: /utilizatori/i })).toBeInTheDocument();
    expect(document.querySelector('a[href="/seller"]')).not.toBeNull();
  });
});
