import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string | string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // If user is authenticated but specific roles are required
  if (roles && isAuthenticated && user && !hasRole(roles)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, requiredRoles: roles }}
        replace
      />
    );
  }

  // If user is authenticated but account is inactive
  if (isAuthenticated && user && !user.isActive) {
    return (
      <Navigate
        to="/account-disabled"
        state={{ from: location }}
        replace
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Higher-order component for route protection
export const withProtection = (roles?: string | string[]) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    return (props: P) => (
      <ProtectedRoute roles={roles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Role-based route components
export const NurseRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute roles={['nurse', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const DoctorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute roles={['doctor', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute roles={['admin']}>
    {children}
  </ProtectedRoute>
);

// Public route (redirects to dashboard if already authenticated)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;