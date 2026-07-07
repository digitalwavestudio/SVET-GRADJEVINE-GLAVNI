import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { MobileBottomNav } from '@/src/components/layout/MobileBottomNav';
import { StickySearchHeader } from '@/src/components/layout/StickySearchHeader';

const SignupBanner = React.lazy(() => import('@/src/components/SignupBanner'));

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}><SignupBanner /></Suspense>
      <Navbar />
        <StickySearchHeader />
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
