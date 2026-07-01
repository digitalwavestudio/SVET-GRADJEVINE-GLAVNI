import { lazy, useEffect } from 'react';
import { Route, useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));

/**
 * /registracija samo redirectuje na /prijava (sad je sve na jednom mestu)
 */
function RegistracijaRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/prijava', { replace: true }); }, [navigate]);
  return null;
}

export const getAuthRouter = () => [
  <Route key="prijava" path="/prijava" element={<AuthPage />} />,
  <Route key="registracija" path="/registracija" element={<RegistracijaRedirect />} />
];

export const getAuthDashboardRouter = () => [
  <Route key="izbor-uloge" path="/moj-profil/izbor-uloge" element={<ProtectedRoute><RoleSelectionPage /></ProtectedRoute>} />
];
