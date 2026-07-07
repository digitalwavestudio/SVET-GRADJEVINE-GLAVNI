import { lazy } from 'react';
import { Route } from 'react-router-dom';

const FeedPage = lazy(() => import('./pages/FeedPage'));

export const getSocialRouter = () => [
  <Route key="feed" path="/feed" element={<FeedPage />} />,
];
