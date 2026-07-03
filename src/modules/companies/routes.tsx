import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { companiesLoader } from '@/src/lib/loaders';

const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const B2BTendersPage = lazy(() => import('./pages/B2BTendersPage'));

export const getCompaniesRouter = () => [
  <Route key="comp-1" path="/firme/:grad" element={<CompaniesPage />} loader={companiesLoader} />,
  <Route key="comp-2" path="/firme" element={<CompaniesPage />} loader={companiesLoader} />,
  <Route key="comp-silo" path="/firma/:grad/:id" element={<CompanyProfilePage />} />,
  <Route key="comp-3" path="/firma/:id" element={<CompanyProfilePage />} />,
  <Route key="comp-5" path="/moj-profil/tenderi" element={<ProtectedRoute><B2BTendersPage /></ProtectedRoute>} />,
];
