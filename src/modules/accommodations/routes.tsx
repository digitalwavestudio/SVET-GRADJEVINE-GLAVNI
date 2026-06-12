import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { accommodationsLoader } from '@/src/lib/loaders';

const AccommodationPage = lazy(() => import('./pages/AccommodationPage'));
const AccommodationDetailsPage = lazy(() => import('./pages/AccommodationDetailsPage'));

export const getAccommodationsRouter = () => [
  <Route key="acc-tip-grad" path="/smestaj/:tip/:grad" element={<AccommodationPage />} loader={accommodationsLoader} />,
  <Route key="acc-tip" path="/smestaj/:tip" element={<AccommodationPage />} loader={accommodationsLoader} />,
  <Route key="acc-1" path="/smestaj/lokacija/:grad" element={<AccommodationPage />} loader={accommodationsLoader} />,
  <Route key="acc-2" path="/smestaj" element={<AccommodationPage />} loader={accommodationsLoader} />,
  <Route key="acc-silo" path="/smestaj/:grad/:id" element={<AccommodationDetailsPage />} />,
  <Route key="acc-3" path="/smestaj/oglas/:id" element={<AccommodationDetailsPage />} />,
  <Route key="acc-legacy" path="/smestaj/:id" element={<AccommodationDetailsPage />} />,
];
