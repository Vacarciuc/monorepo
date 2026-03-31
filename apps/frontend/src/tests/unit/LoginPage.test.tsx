import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import LoginPage from '../../pages/LoginPage';
import * as authApi from '../../api/auth.api';
import type { LoginResponse } from '../../types/user';

vi.mock('../../api/auth.api');
vi.mock('../../api/cart.api', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [] }),
}));

const renderLogin = (initialPath = '/login') =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /register here/i })).toHaveAttribute('href', '/register');
  });

  it('shows loading state while submitting', async () => {
    vi.spyOn(authApi, 'login').mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('navigates to /products on successful login', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'jwt-token',
      role: 'CUSTOMER',
    } as LoginResponse);

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText('Products Page')).toBeInTheDocument(),
    );
  });

  it('shows error message on 404 (user not found)', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue({
      response: { status: 404, data: {} },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/no account found with that email/i)).toBeInTheDocument();
  });

  it('shows error message on 401 (wrong password)', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue({
      response: { status: 401, data: {} },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/wrong password/i)).toBeInTheDocument();
  });

  it('redirects to /products if already authenticated', () => {
    localStorage.setItem('auth_token', 'existing-token');
    renderLogin();
    expect(screen.getByText('Products Page')).toBeInTheDocument();
  });
});

