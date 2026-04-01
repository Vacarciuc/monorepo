import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

vi.mock('../../api/cart.api', () => ({ getCart: vi.fn().mockResolvedValue({ items: [] }) }));
vi.mock('../../api/order.api', () => ({ getOrders: vi.fn().mockResolvedValue([]) }));
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
    const { unmount: u1 } = renderNavbar();
    // Nu există niciun link de navigare sau avatar
    expect(screen.queryByTitle(/coșul meu/i)).not.toBeInTheDocument();
    u1();

    // ─── CUSTOMER ─────────────────────────────────────────────────────
    localStorage.setItem('auth_token', 'tok');
    localStorage.setItem('user_role', 'CUSTOMER');
    const { unmount: u2 } = renderNavbar();
    expect(screen.getByTitle(/coșul meu/i)).toBeInTheDocument();
    expect(screen.getByTitle(/comenzile mele/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/produsele mele/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/administrare utilizatori/i)).not.toBeInTheDocument();
    u2();
    localStorage.clear();

    // ─── SELLER ───────────────────────────────────────────────────────
    localStorage.setItem('auth_token', 'tok');
    localStorage.setItem('user_role', 'SELLER');
    const { unmount: u3 } = renderNavbar();
    expect(screen.getByTitle(/produsele mele/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/administrare utilizatori/i)).not.toBeInTheDocument();
    u3();
    localStorage.clear();

    // ─── ADMIN ────────────────────────────────────────────────────────
    localStorage.setItem('auth_token', 'tok');
    localStorage.setItem('user_role', 'ADMIN');
    renderNavbar();
    expect(screen.getByTitle(/administrare utilizatori/i)).toBeInTheDocument();
    expect(document.querySelector('a[href="/seller"]')).not.toBeNull();
  });
});
