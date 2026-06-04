import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { SignupBanner } from '@/src/components/SignupBanner';

export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <SignupBanner />
      <Navbar />
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
