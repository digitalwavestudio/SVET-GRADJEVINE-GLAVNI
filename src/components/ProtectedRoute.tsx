import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/src/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, isInitializing } = useAuth();
  const location = useLocation();

  if (loading || isInitializing) {
    return (
      <div className="bg-[#070B0F] min-h-screen"></div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/prijava" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    if (!user?.isAdmin && !allowedRoles.includes(user.role)) {
      return <Navigate to="/moj-profil/izbor-uloge" replace />;
    }
  }

  return <>{children}</>;
}
