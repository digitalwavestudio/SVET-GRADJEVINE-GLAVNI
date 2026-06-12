import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { realEstateLoader } from '@/src/lib/loaders';

const RealEstatePage = lazy(() => import('./pages/RealEstatePage'));
const RealEstateDetailPage = lazy(() => import('./pages/RealEstateDetailPage'));
const ConstructionSitePage = lazy(() => import('./pages/ConstructionSitePage'));

export const getRealEstateRouter = () => [
  <Route key="re-namena-grad" path="/placevi/:namena/:grad" element={<RealEstatePage />} loader={realEstateLoader} />,
  <Route key="re-namena" path="/placevi/:namena" element={<RealEstatePage />} loader={realEstateLoader} />,
  <Route key="re-1" path="/placevi/lokacija/:grad" element={<RealEstatePage />} loader={realEstateLoader} />,
  <Route key="re-2" path="/placevi" element={<RealEstatePage />} loader={realEstateLoader} />,
  <Route key="re-silo" path="/placevi/:namena/:grad/:id" element={<RealEstateDetailPage />} />,
  <Route key="re-3" path="/nekretnine/:id" element={<RealEstateDetailPage />} />,
  <Route key="re-placevi-id" path="/placevi/oglas/:id" element={<RealEstateDetailPage />} />,
  <Route key="re-4" path="/moj-profil/gradiliste" element={<ProtectedRoute><ConstructionSitePage /></ProtectedRoute>} />,
];
