import React, { useRef, useEffect, Suspense, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import CommandCenter from '@/src/components/CommandCenter';
import ErrorBoundary from '@/src/components/common/ErrorBoundary';
import { Sidebar } from './dashboard/Sidebar';
import { DashboardTopHeader } from './dashboard/DashboardTopHeader';
import { MobileHeader } from './dashboard/MobileHeader';
import { useDashboardUIStore } from '@/src/modules/dashboard/store/dashboardUIStore';
import DashboardSkeleton from '@/src/modules/dashboard/components/dashboard/DashboardSkeleton';
import { motion, AnimatePresence } from 'motion/react';
import { MobileBottomNav } from '@/src/components/layout/MobileBottomNav';

export function DashboardLayout({ 
  children, 
  pulseRoleSelection 
}: { 
  children: React.ReactNode, 
  pulseRoleSelection?: boolean 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isMobileMenuOpen = useDashboardUIStore((state) => state.isMobileMenuOpen);
  const setIsMobileMenuOpen = useDashboardUIStore((state) => state.setIsMobileMenuOpen);

  useEffect(() => {
    if (!user) {
      navigate('/prijava');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#070B0F] text-white font-sans selection:bg-secondary selection:text-slate-950">
      <CommandCenter />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/80 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <Sidebar 
        pulseRoleSelection={pulseRoleSelection}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-[calc(100vh-64px)] md:min-h-screen flex flex-col relative w-full overflow-x-hidden pb-16 md:pb-0">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
        
        {/* Top Header */}
        <DashboardTopHeader fileInputRef={fileInputRef} />

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-10 relative z-10 w-full max-w-7xl mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<DashboardSkeleton />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
