import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { masterLoader } from '@/src/lib/loaders';

const MastersPage = lazy(() => import('./pages/MastersPage'));
const MasterProfilePage = lazy(() => import('./pages/MasterProfilePage'));

export const getMastersRouter = () => [
  <Route key="majstori-grad-zanimanje" path="/majstori/:zanimanje/:grad" element={<MastersPage />} loader={masterLoader} />,
  <Route key="majstori-zanimanje" path="/majstori/:zanimanje" element={<MastersPage />} loader={masterLoader} />,
  <Route key="majstori-grad" path="/majstori/:grad" element={<MastersPage />} loader={masterLoader} />,
  <Route key="majstori" path="/majstori" element={<MastersPage />} loader={masterLoader} />,
  <Route key="majstori-silo" path="/majstor/:zanat/:grad/:id" element={<MasterProfilePage />} />,
  <Route key="majstori-id" path="/majstori/:id" element={<MasterProfilePage />} />,
  <Route key="majstor-id" path="/majstor/:id" element={<MasterProfilePage />} />
];
