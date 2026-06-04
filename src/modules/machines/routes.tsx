import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { machinesLoader } from '@/src/lib/loaders';

const ConstructionMachinesPage = lazy(() => import('./pages/ConstructionMachinesPage'));
const MachineDetailsPage = lazy(() => import('./pages/MachineDetailsPage'));

export const MachinesRouter = [
  <Route key="mac-1" path="/masine/:kategorija/:grad" element={<ConstructionMachinesPage />} loader={machinesLoader} />,
  <Route key="mac-2" path="/masine/:grad" element={<ConstructionMachinesPage />} loader={machinesLoader} />,
  <Route key="mac-3" path="/masine" element={<ConstructionMachinesPage />} loader={machinesLoader} />,
  <Route key="mac-4" path="/gradjevinske-masine" element={<Navigate to="/masine" replace />} />,
  <Route key="mac-silo-1" path="/masina/:kategorija/:grad/:id" element={<MachineDetailsPage />} />,
  <Route key="mac-silo-2" path="/gradjevinske-masine/:kategorija/:grad/:id" element={<MachineDetailsPage />} />,
  <Route key="mac-5" path="/gradjevinske-masine/:id" element={<MachineDetailsPage />} />,
  <Route key="mac-6" path="/masine/:id" element={<MachineDetailsPage />} />,
];
