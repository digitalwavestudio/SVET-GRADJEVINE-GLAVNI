import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { cateringLoader } from '@/src/lib/loaders';

const CateringPage = lazy(() => import('./pages/CateringPage'));
const CateringDetailPage = lazy(() => import('./pages/CateringDetailPage'));
const CateringItemDetailPage = lazy(() => import('./pages/CateringItemDetailPage'));

export const CateringRouter = [
  <Route key="cat-1" path="/ketering/:grad" element={<CateringPage />} loader={cateringLoader} />,
  <Route key="cat-2" path="/ketering" element={<CateringPage />} loader={cateringLoader} />,
  <Route key="cat-silo" path="/ketering/:grad/:id" element={<CateringDetailPage />} />,
  <Route key="cat-3" path="/ketering/provajder/:id" element={<CateringDetailPage />} />,
  <Route key="cat-4" path="/ketering/:providerId/stavka/:itemId" element={<CateringItemDetailPage />} />,
];
