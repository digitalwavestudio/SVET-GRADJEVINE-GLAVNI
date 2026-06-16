import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';

const SmartMatchPage = lazy(() => import('./pages/SmartMatchPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const DocumentVaultPage = lazy(() => import('./pages/DocumentVaultPage'));
const WorkLogPage = lazy(() => import('./pages/WorkLogPage'));
const CalculatorsPage = lazy(() => import('./pages/CalculatorsPage'));

export const getToolsDashboardRouter = () => [
  <Route key="preporuke" path="/moj-profil/preporuke" element={<ProtectedRoute><SmartMatchPage /></ProtectedRoute>} />,
  <Route key="kalendar" path="/moj-profil/kalendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />,
  <Route key="dokumenti" path="/moj-profil/dokumenti" element={<ProtectedRoute><DocumentVaultPage /></ProtectedRoute>} />,
  <Route key="dnevnik" path="/moj-profil/dnevnik" element={<ProtectedRoute><WorkLogPage /></ProtectedRoute>} />
];

export const getToolsPublicRouter = () => [
  <Route key="kalkulatori" path="/kalkulatori" element={<CalculatorsPage />} />
];
