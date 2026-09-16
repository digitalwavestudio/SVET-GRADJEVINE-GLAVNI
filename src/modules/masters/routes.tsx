import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

const MastersPage = lazy(() => import('./pages/MastersPage'));

export const getMastersRouter = () => [
  <Route key="majstori-grad-zanimanje" path="/majstori/:zanimanje/:grad" element={<MastersPage />} />,
  <Route key="majstori-zanimanje" path="/majstori/:zanimanje" element={<MastersPage />} />,
  <Route key="majstori-grad" path="/majstori/:grad" element={<MastersPage />} />,
  <Route key="majstori" path="/majstori" element={<MastersPage />} />,
  <Route key="majstori-grad-zanimanje" path="/majstori/:zanimanje/:grad" element={<MastersPage />} />,
  <Route key="majstori-zanimanje" path="/majstori/:zanimanje" element={<MastersPage />} />,
  <Route key="majstori-grad" path="/majstori/:grad" element={<MastersPage />} />,
  <Route key="majstori" path="/majstori" element={<MastersPage />} />,
  <Route key="majstori-id" path="/majstori/profil/:id" element={<Navigate to="/" replace />} />,
  <Route key="majstori-silo" path="/majstor/:zanat/:grad/:id" element={<Navigate to="/" replace />} />,
  <Route key="majstor-id" path="/majstor/:id" element={<Navigate to="/" replace />} />
];
