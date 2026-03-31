import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import RegisterPage from '../../pages/RegisterPage';
import * as authApi from '../../api/auth.api';
import type { LoginResponse } from '../../types/user';

vi.mock('../../api/auth.api');
vi.mock('../../api/cart.api', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [] }),
}));

const renderRegister = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('renders all form fields', () => {
    renderRegister();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /login here/i })).toHaveAttribute('href', '/login');
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different!' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    renderRegister();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('registers, auto-logs in, and navigates to /products on success', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValue(undefined);
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'jwt-token',
      role: 'CUSTOMER',
    } as LoginResponse);

    renderRegister();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@user.com' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() =>
      expect(screen.getByText('Products Page')).toBeInTheDocument(),
    );
    expect(authApi.register).toHaveBeenCalledWith({
      email: 'new@user.com',
      username: 'newuser',
      password: 'password123',
    });
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'new@user.com',
      password: 'password123',
    });
  });

  it('shows error on 409 (email already exists)', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue({
      response: { status: 409, data: {} },
    });

    renderRegister();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'exists@b.com' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });

  it('shows validation error messages from API', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue({
      response: { status: 400, data: { message: ['email must be an email', 'password is too short'] } },
    });

    renderRegister();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@b.com' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'u' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/email must be an email, password is too short/i)).toBeInTheDocument();
  });

  it('redirects to /products if already authenticated', () => {
    localStorage.setItem('auth_token', 'existing-token');
    renderRegister();
    expect(screen.getByText('Products Page')).toBeInTheDocument();
  });
});

