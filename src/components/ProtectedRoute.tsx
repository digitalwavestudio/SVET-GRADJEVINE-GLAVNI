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

  // Email verification enforcement (admin bypass via server-side claims)
  const isSuperAdmin = user?.isAdmin;
  if (requireAuth && user && !user.emailVerified && !isSuperAdmin) {
    // If user is not verified, we might want to redirect them to a verification notice page
    // For now, let's just use the login page with a state or separate verification page if it exists
    return <Navigate to="/prijava" state={{ from: location, error: 'Molimo potvrdite vaš email pre nastavka.' }} replace />;
  }

  if (allowedRoles && user) {
    if (!isSuperAdmin && !allowedRoles.includes(user.role)) {
      return <Navigate to="/moj-profil/izbor-uloge" replace />;
    }
  }

  return <>{children}</>;
}
