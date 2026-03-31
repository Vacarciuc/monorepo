import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
vi.mock('../../api/cart.api', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [] }),
}));
vi.mock('../../api/auth.api');
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
const renderNavbar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Navbar />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });
  describe('Unauthenticated User', () => {
    it('renders logo and Products link', () => {
      renderNavbar();
      expect(screen.getByText(/GreenMarket/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    });
    it('shows Login and Register links', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });
    it('does not show Admin or Seller links', () => {
      renderNavbar();
      expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/my products/i)).not.toBeInTheDocument();
    });
    it('shows Cart link', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument();
    });
    it('has correct hrefs', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /GreenMarket/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /products/i })).toHaveAttribute('href', '/products');
      expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
      expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
    });
  });
  describe('Authenticated Customer', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'tok');
      localStorage.setItem('user_role', 'CUSTOMER');
    });
    it('shows Logout and hides Login/Register', () => {
      renderNavbar();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
    });
    it('shows Cart link', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument();
    });
    it('navigates to /login on Logout click', () => {
      renderNavbar();
      fireEvent.click(screen.getByRole('button', { name: /logout/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    it('does not show Admin/Seller links', () => {
      renderNavbar();
      expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/my products/i)).not.toBeInTheDocument();
    });
  });
  describe('Authenticated Admin', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'tok');
      localStorage.setItem('user_role', 'ADMIN');
    });
    it('shows Admin Panel link', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /admin panel/i })).toHaveAttribute('href', '/admin');
    });
    it('shows Logout button', () => {
      renderNavbar();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
    it('hides Login/Register', () => {
      renderNavbar();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    });
  });
  describe('Authenticated Seller', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'tok');
      localStorage.setItem('user_role', 'SELLER');
    });
    it('shows My Products link', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /my products/i })).toHaveAttribute('href', '/admin');
    });
    it('shows Logout button', () => {
      renderNavbar();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
    it('hides Login/Register', () => {
      renderNavbar();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    });
  });
});
