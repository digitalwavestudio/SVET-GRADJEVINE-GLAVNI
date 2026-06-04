import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));

export const SearchRouter = [
  <Route key="pretraga" path="/pretraga" element={<SearchResultsPage />} />
];
