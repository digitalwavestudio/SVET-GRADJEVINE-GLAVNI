import { createBrowserRouter, RouterProvider, createRoutesFromElements } from 'react-router-dom';
import { AppProviders } from '@/src/components/AppProviders';
import { getRouteElements } from '@/src/modules/routeElements';

let router: ReturnType<typeof createBrowserRouter> | null = null;

function getRouter() {
  if (!router) {
    router = createBrowserRouter(
      createRoutesFromElements(getRouteElements())
    );
  }
  return router;
}

const GlobalFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0B0F19]">
    <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
  </div>
);

import { Toaster } from 'react-hot-toast';
import { AuthLoader } from '@/src/components/AuthLoader';

function App() {
  return (
    <AppProviders>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0A0F14',
            color: '#fff',
            border: '1px solid rgba(255,173,58,0.2)',
          },
        }}
      />
      <AuthLoader>
        <RouterProvider router={getRouter()} fallbackElement={<GlobalFallback />} />
      </AuthLoader>
    </AppProviders>
  );
}

export default App;
