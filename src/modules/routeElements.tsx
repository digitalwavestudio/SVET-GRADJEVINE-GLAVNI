import { Route } from 'react-router-dom';
import { MainLayout } from '@/src/modules/core/components/layout/MainLayout';
import NotFoundPage from '@/src/modules/core/pages/NotFoundPage';
import { getCoreRouter, getCoreDashboardRouter } from '@/src/modules/core/routes';
import { getJobsRouter } from '@/src/modules/jobs/routes';
import { getCompaniesRouter } from '@/src/modules/companies/routes';

import { getDashboardRouter, getDashboardPublicRouter } from '@/src/modules/dashboard/routes';
import { getAuthRouter, getAuthDashboardRouter } from '@/src/modules/auth/routes';
import { getToolsDashboardRouter, getToolsPublicRouter } from '@/src/modules/tools/routes';

import { getAdsRouter } from '@/src/modules/ads/routes';
import { getCheckoutRouter } from '@/src/modules/checkout/routes';
import { getMastersRouter } from '@/src/modules/masters/routes';
import { getSearchRouter } from '@/src/modules/search/routes';
import { getSocialRouter } from '@/src/modules/social/routes';
import { RootLayout } from '@/src/components/RootLayout';
import GlobalRouteError from '@/src/components/GlobalRouteError';

export function getRouteElements() {
  return (
    <Route element={<RootLayout />} errorElement={<GlobalRouteError />}>
      <Route element={<MainLayout />}>
        {getCoreRouter()}
        {getJobsRouter()}
        {getCompaniesRouter()}

        {getMastersRouter()}
        {getAdsRouter()}
        {getCheckoutRouter()}
        {getSearchRouter()}
        {getSocialRouter()}
        {getDashboardPublicRouter()}
        {getToolsPublicRouter()}
      </Route>

      {getAuthRouter()}

      {getDashboardRouter()}
      {getAuthDashboardRouter()}
      {getToolsDashboardRouter()}
      {getCoreDashboardRouter()}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  );
}
