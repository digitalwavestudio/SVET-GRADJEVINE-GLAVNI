import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { machinesLoader } from '@/src/lib/loaders';

const ConstructionMachinesPage = lazy(() => import('./pages/ConstructionMachinesPage'));
const MachineDetailsPage = lazy(() => import('./pages/MachineDetailsPage'));

export function getMachinesRouter() {
  return [
    <Route key="masine" path="/masine" element={<ConstructionMachinesPage />} />,
    <Route key="masina-detalji" path="/masina/:id" element={<MachineDetailsPage />} />,
    // New routes for gradjevinske-masine
    <Route key="gradjevinske-masine" path="/gradjevinske-masine" element={<ConstructionMachinesPage />} />,
    <Route key="gradjevinske-masina-detalji" path="/gradjevinske-masine/:id" element={<MachineDetailsPage />} />,
  ];
}
