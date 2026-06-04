import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));

export const AuthRouter = [
  <Route key="prijava" path="/prijava" element={<LoginPage />} />,
  <Route key="registracija" path="/registracija" element={<RegisterPage />} />
];

export const AuthDashboardRouter = [
  <Route key="izbor-uloge" path="/moj-profil/izbor-uloge" element={<ProtectedRoute><RoleSelectionPage /></ProtectedRoute>} />
];
