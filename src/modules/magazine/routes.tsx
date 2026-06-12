import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

const MagazinePage = lazy(() => import('./pages/MagazinePage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));

export const getMagazineRouter = () => [
  <Route key="magazin" path="/magazin" element={<MagazinePage />} />,
  <Route key="magazin-article" path="/magazin/:slug" element={<ArticlePage />} />
];
