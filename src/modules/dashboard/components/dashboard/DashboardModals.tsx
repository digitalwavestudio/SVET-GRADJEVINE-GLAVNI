import React, { lazy, Suspense } from 'react';
import { APP_CONFIG } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';

const CreditModal = lazy(() => import('@/src/components/CreditModal'));
const ShareModal = lazy(() => import('@/src/components/ShareModal'));
const UpgradeModal = lazy(() => import('@/src/components/UpgradeModal'));

interface DashboardModalsProps {
  isUpgradeOpen: boolean;
  setIsUpgradeOpen: (v: boolean) => void;
  isShareOpen: boolean;
  setIsShareOpen: (v: boolean) => void;
  isCreditOpen: boolean;
  setIsCreditOpen: (v: boolean) => void;
}

export default function DashboardModals({
  isUpgradeOpen,
  setIsUpgradeOpen,
  isShareOpen,
  setIsShareOpen,
  isCreditOpen,
  setIsCreditOpen
}: DashboardModalsProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <Suspense fallback={null}>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        profileUrl={`${APP_CONFIG.BASE_URL}/profil/${user.id}`}
      />
      <CreditModal 
        isOpen={isCreditOpen} 
        onClose={() => setIsCreditOpen(false)} 
      />
    </Suspense>
  );
}
