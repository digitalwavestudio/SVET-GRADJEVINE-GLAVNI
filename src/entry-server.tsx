import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { BrandProvider } from '@/src/context/BrandContext';
import { MessagesProvider } from '@/src/context/MessagesContext';
import { VisibilityAbortProvider } from '@/src/context/VisibilityAbortContext';
import { AuthContext, AuthContextType } from '@/src/context/AuthContext';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { MobileBottomNav } from '@/src/components/layout/MobileBottomNav';
import { StickySearchHeader } from '@/src/components/layout/StickySearchHeader';
import HomePage from '@/src/modules/core/pages/HomePage';

const mockAuth: AuthContextType = {
  user: null, loading: false, isInitializing: false, isOffline: false, isQuotaExceeded: false,
  loginWithGoogle: () => Promise.resolve(), loginWithEmail: () => Promise.resolve(),
  registerWithEmail: () => Promise.resolve(), logout: () => Promise.resolve(),
  switchRole: () => Promise.resolve(), updateUser: () => Promise.resolve(),
  getIdToken: () => Promise.resolve(undefined), toggleSavedJob: () => Promise.resolve(),
  toggleSavedAd: () => Promise.resolve(), saveSearch: () => Promise.resolve(),
  removeSearch: () => Promise.resolve(),
};

export async function render(url: string): Promise<string> {
  if (typeof globalThis.window !== 'undefined') {
    (globalThis.window as any).location = { href: url, pathname: url.split('?')[0], search: url.includes('?') ? '?' + url.split('?')[1] : '' };
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  return renderToString(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrandProvider>
            <AuthContext.Provider value={mockAuth}>
              <MessagesProvider>
                <VisibilityAbortProvider>
                  <HelmetProvider>
                    <StaticRouter location={url}>
                      <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary">
                        <div className="flex flex-col min-h-screen">
                          <Navbar />
                          <StickySearchHeader />
                          <main className="flex-1 flex flex-col relative pb-24 md:pb-0">
                            <HomePage />
                          </main>
                          <Footer />
                          <MobileBottomNav />
                        </div>
                      </div>
                    </StaticRouter>
                  </HelmetProvider>
                </VisibilityAbortProvider>
              </MessagesProvider>
            </AuthContext.Provider>
          </BrandProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
