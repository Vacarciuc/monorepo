import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import AdminPage from '../../pages/AdminPage';
import ProtectedRoute from '../../routes/ProtectedRoute';

vi.mock('../../api/user.api', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
  deleteUser: vi.fn(),
  updateUserRole: vi.fn(),
}));

const renderAdmin = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Pagina Login</div>} />
          <Route path="/" element={<div>Acasă</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('AdminPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('este accesibilă doar utilizatorilor cu rol ADMIN — neautentificatul este redirecționat la /login', () => {
    renderAdmin();
    expect(screen.getByText('Pagina Login')).toBeInTheDocument();
    expect(screen.queryByText(/panou administrare/i)).not.toBeInTheDocument();
  });
});



