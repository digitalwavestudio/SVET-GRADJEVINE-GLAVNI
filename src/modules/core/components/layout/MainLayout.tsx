import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { SignupBanner } from '@/src/components/SignupBanner';
import { MobileBottomNav } from '@/src/components/layout/MobileBottomNav';
import { StickySearchHeader } from '@/src/components/layout/StickySearchHeader';

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <SignupBanner />
      <Navbar />
        <StickySearchHeader />
      <main className="flex-1 flex flex-col relative pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
