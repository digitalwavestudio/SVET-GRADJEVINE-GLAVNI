import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { jobLoader } from '@/src/lib/loaders';

const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailsPage = lazy(() => import('./pages/JobDetailsPage'));
const CVGeneratorPage = lazy(() => import('./pages/CVGeneratorPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));

export const JobsRouter = [
  <Route key="jobs-1" path="/poslovi/:zanimanje/:grad" element={<JobsPage />} loader={jobLoader} />,
  <Route key="jobs-2" path="/poslovi/:zanimanje" element={<JobsPage />} loader={jobLoader} />,
  <Route key="jobs-3" path="/poslovi/:grad" element={<JobsPage />} loader={jobLoader} />,
  <Route key="jobs-4" path="/poslovi" element={<JobsPage />} loader={jobLoader} />,
  <Route key="job-silo" path="/posao/:kategorija/:grad/:id" element={<JobDetailsPage />} />,
  <Route key="job-1" path="/job/:id" element={<JobDetailsPage />} />,
  <Route key="job-2" path="/posao/:id" element={<JobDetailsPage />} />,
  <Route key="cv" path="/moj-profil/cv" element={<ProtectedRoute><CVGeneratorPage /></ProtectedRoute>} />,
  <Route key="kandidati" path="/moj-profil/kandidati" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />,
];
