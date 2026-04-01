import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Dacă este specificat, doar utilizatorii cu unul din aceste roluri pot accesa ruta */
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isSeller } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole: UserRole = isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'CUSTOMER';
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
