import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { marketplaceLoader } from '@/src/lib/loaders';

const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const MarketplaceItemDetailsPage = lazy(() => import('./pages/MarketplaceItemDetailsPage'));
const MarketplaceModule = lazy(() => import('./index.tsx'));

export const MarketplaceRouter = [
  <Route key="alat-i-oprema-kategorija-grad" path="/alat-i-oprema/:kategorija/:grad" element={<MarketplaceModule />} loader={marketplaceLoader} />,
  <Route key="alat-i-oprema-kategorija" path="/alat-i-oprema/:kategorija" element={<MarketplaceModule />} loader={marketplaceLoader} />,
  <Route key="alat-i-oprema-grad" path="/alat-i-oprema/lokacija/:grad" element={<MarketplaceModule />} loader={marketplaceLoader} />,
  <Route key="alat-i-oprema" path="/alat-i-oprema" element={<MarketplaceModule />} loader={marketplaceLoader} />,
  <Route key="alat-i-oprema-silo" path="/alat-i-oprema/:kategorija/:grad/:id" element={<MarketplaceItemDetailsPage />} />,
  <Route key="alat-i-oprema-id" path="/alat-i-oprema/oglas/:id" element={<MarketplaceItemDetailsPage />} />,
  <Route key="alat-i-oprema-legacy" path="/alat-i-oprema/:id" element={<MarketplaceItemDetailsPage />} />,
  <Route key="m-marketplace" path="/m/marketplace/*" element={<MarketplaceModule />} loader={marketplaceLoader} />
];

export const MarketplaceDashboardRouter = [
  <Route key="alat-i-oprema" path="/moj-profil/alat-i-oprema" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
];
