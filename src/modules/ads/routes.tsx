import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';

const PostAdPage = lazy(() => import('./pages/PostAdPage'));

export const getAdsRouter = () => [
  <Route key="postavi-oglas" path="/postavi-oglas" element={<ProtectedRoute><PostAdPage /></ProtectedRoute>} />
];
