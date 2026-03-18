import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Temporarily disabled authentication check for testing
  // const isAuthenticated = authService.isAuthenticated();
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;

