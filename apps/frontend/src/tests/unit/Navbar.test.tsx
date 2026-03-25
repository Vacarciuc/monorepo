import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import * as authService from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service');

// Mock cart api — getCart always returns empty cart to avoid network calls
vi.mock('../../api/cart.api', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [] }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      vi.spyOn(authService.authService, 'isAuthenticated').mockReturnValue(false);
      vi.spyOn(authService.authService, 'isAdmin').mockReturnValue(false);
      vi.spyOn(authService.authService, 'isSeller').mockReturnValue(false);
    });

    it('renders navbar with logo and product link', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByText(/GreenMarket/i)).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    it('displays login and register links when not authenticated', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Logout/i })).not.toBeInTheDocument();
    });

    it('does not display admin panel link', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.queryByText(/Admin Panel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/My Products/i)).not.toBeInTheDocument();
    });

    it('displays cart link even when unauthenticated', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
    });

    it('has correct link hrefs', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('link', { name: /GreenMarket/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Products/i })).toHaveAttribute('href', '/products');
      expect(screen.getByRole('link', { name: /Login/i })).toHaveAttribute('href', '/login');
      expect(screen.getByRole('link', { name: /Register/i })).toHaveAttribute('href', '/register');
      expect(screen.getByRole('link', { name: /Cart/i })).toHaveAttribute('href', '/cart');
    });
  });

  describe('Authenticated Customer', () => {
    beforeEach(() => {
      vi.spyOn(authService.authService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(authService.authService, 'isAdmin').mockReturnValue(false);
      vi.spyOn(authService.authService, 'isSeller').mockReturnValue(false);
    });

    it('displays logout button when authenticated', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Register/i })).not.toBeInTheDocument();
    });

    it('displays cart link for authenticated customer', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
    });

    it('does not display admin or seller links', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.queryByText(/Admin Panel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/My Products/i)).not.toBeInTheDocument();
    });

    it('calls logout and navigates to login on logout button click', () => {
      const mockLogout = vi.spyOn(authService.authService, 'logout');
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Authenticated Admin', () => {
    beforeEach(() => {
      vi.spyOn(authService.authService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(authService.authService, 'isAdmin').mockReturnValue(true);
      vi.spyOn(authService.authService, 'isSeller').mockReturnValue(false);
    });

    it('displays admin panel link', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      const adminLink = screen.getByRole('link', { name: /Admin Panel/i });
      expect(adminLink).toBeInTheDocument();
      expect(adminLink).toHaveAttribute('href', '/admin');
    });

    it('displays cart link for admin too', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
    });

    it('displays logout button', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    });
  });

  describe('Authenticated Seller', () => {
    beforeEach(() => {
      vi.spyOn(authService.authService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(authService.authService, 'isAdmin').mockReturnValue(false);
      vi.spyOn(authService.authService, 'isSeller').mockReturnValue(true);
    });

    it('displays my products link', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      const sellerLink = screen.getByRole('link', { name: /My Products/i });
      expect(sellerLink).toBeInTheDocument();
      expect(sellerLink).toHaveAttribute('href', '/admin');
    });

    it('displays cart link for seller too', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
    });

    it('displays logout button', () => {
      render(<BrowserRouter><Navbar /></BrowserRouter>);
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    });
  });
});
