import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';

const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));

export const CheckoutRouter = [
  <Route key="checkout" path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />,
  <Route key="checkout-success" path="/checkout/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
];
