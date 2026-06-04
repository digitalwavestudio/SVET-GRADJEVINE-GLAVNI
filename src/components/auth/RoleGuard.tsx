import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { AccessRestricted } from '@/src/modules/ads/components/post-ad/AccessRestricted';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  const { user, loading, isInitializing } = useAuth();

  if (loading || isInitializing) {
    return <div className="min-h-screen bg-[#0B1219] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
    </div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (fallback as React.ReactElement) || <AccessRestricted userRole={user?.role || 'gost'} />;
  }

  return <>{children}</>;
};

export function withRole(Component: React.ComponentType<any>, allowedRoles: string[]) {
  return function ProtectedComponent(props: any) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
