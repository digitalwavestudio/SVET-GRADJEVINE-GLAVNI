import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/src/components/ProtectedRoute';

// Dynamic lazy imports equipped with magic prefetch annotations
const DashboardPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-home" */ './pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-admin" */ '../admin/pages/AdminDashboardPage'));
const MessagesPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-messages" */ './pages/MessagesPage'));
const MyApplicationsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-applications" */ './pages/MyApplicationsPage'));
const FavoritesPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-favorites" */ './pages/FavoritesPage'));
const SavedSearchesPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-searches" */ './pages/SavedSearchesPage'));
const MyAdsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-my-ads" */ './pages/MyAdsPage'));
const SettingsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-settings" */ './pages/SettingsPage'));
const AccountSettingsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-account-settings" */ './pages/AccountSettingsPage'));
const WalletPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-wallet" */ './pages/WalletPage'));
const VerificationCenterPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-verification" */ './pages/VerificationCenterPage'));
const MyInquiriesPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-inquiries" */ './pages/MyInquiriesPage'));
const DashboardModule = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-module" */ './index.tsx'));
const StatsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-stats" */ './pages/StatsPage'));
const PublicProfilePage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-public-profile" */ './pages/PublicProfilePage'));
const NotificationsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-notifications" */ './pages/NotificationsPage'));
const ConstructionSitePage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-construction" */ '../real_estate/pages/ConstructionSitePage'));

/**
 * Enterprise Prefetching Strategy:
 * Pre-warms and preloads the critical user profile dashboard chunks in the browser cache 
 * asynchronously immediately after home page rendering is completed. This minimises route network latency 
 * and ensures an instantaneous transition experience without competing for primary thread CPU.
 */
export const prefetchDashboard = () => {
  if (typeof window === 'undefined') return;

  const prefetchTask = () => {
    // Dynamic imports trigger chunk prefetching under the hood asynchronously
    Promise.all([
      import(/* webpackPrefetch: true, webpackChunkName: "dashboard-home" */ './pages/DashboardPage'),
      import(/* webpackPrefetch: true, webpackChunkName: "dashboard-my-ads" */ './pages/MyAdsPage'),
      import(/* webpackPrefetch: true, webpackChunkName: "dashboard-favorites" */ './pages/FavoritesPage'),
      import(/* webpackPrefetch: true, webpackChunkName: "dashboard-verification" */ './pages/VerificationCenterPage'),
      import(/* webpackPrefetch: true, webpackChunkName: "dashboard-applications" */ './pages/MyApplicationsPage')
    ]).catch((err) => {
      // Fail-safe tracking to not impact primary thread experience
    });
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(prefetchTask, { timeout: 3000 });
  } else {
    setTimeout(prefetchTask, 1500);
  }
};

const MyAccommodationCapacitiesPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-capacities" */ './pages/MyAccommodationCapacitiesPage'));
const MyCateringOrdersPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-orders" */ './pages/MyCateringOrdersPage'));
const MyCateringDeliveryPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-delivery" */ './pages/MyCateringDeliveryPage'));
const MyMachinesReservationsPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-reservations" */ './pages/MyMachinesReservationsPage'));
const MyCompanyPage = lazy(() => import(/* webpackPrefetch: true, webpackChunkName: "dashboard-company" */ '../companies/pages/MyCompanyPage'));


export const getDashboardRouter = () => [
  <Route key="moj-profil" path="/moj-profil" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />,
  <Route key="kontrolna-tabla" path="/kontrolna-tabla" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />,
  <Route key="obavestenja" path="/moj-profil/obavestenja" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />,
  <Route key="verifikacija" path="/moj-profil/verifikacija" element={<ProtectedRoute><VerificationCenterPage /></ProtectedRoute>} />,
  <Route key="oglasi" path="/moj-profil/oglasi" element={<ProtectedRoute><MyAdsPage /></ProtectedRoute>} />,
  <Route key="prijave" path="/moj-profil/prijave" element={<ProtectedRoute><MyApplicationsPage /></ProtectedRoute>} />,
  <Route key="omiljeni" path="/moj-profil/omiljeni" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />,
  <Route key="pretrage" path="/moj-profil/pretrage" element={<ProtectedRoute><SavedSearchesPage /></ProtectedRoute>} />,
  <Route key="upiti" path="/moj-profil/upiti" element={<ProtectedRoute><MyInquiriesPage /></ProtectedRoute>} />,
  <Route key="kapaciteti" path="/moj-profil/kapaciteti" element={<ProtectedRoute><MyAccommodationCapacitiesPage /></ProtectedRoute>} />,
  <Route key="narudzbine" path="/moj-profil/narudzbine" element={<ProtectedRoute><MyCateringOrdersPage /></ProtectedRoute>} />,
  <Route key="dostava" path="/moj-profil/dostava" element={<ProtectedRoute><MyCateringDeliveryPage /></ProtectedRoute>} />,
  <Route key="rezervacije" path="/moj-profil/rezervacije" element={<ProtectedRoute><MyMachinesReservationsPage /></ProtectedRoute>} />,
  <Route key="gradiliste" path="/moj-profil/gradiliste" element={<ProtectedRoute><ConstructionSitePage /></ProtectedRoute>} />,
  <Route key="firma" path="/moj-profil/firma" element={<ProtectedRoute><MyCompanyPage /></ProtectedRoute>} />,
  <Route key="poruke" path="/poruke" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />,
  <Route key="podesavanja" path="/podesavanja" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />,
  <Route key="novcanik" path="/novcanik" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />,
  <Route key="admin" path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />,
  <Route key="m-dashboard" path="/m/dashboard/*" element={<DashboardModule />} />
];

export const getDashboardPublicRouter = () => [
  <Route key="profil" path="/profil/:id" element={<PublicProfilePage />} />,
  <Route key="statistika" path="/cene-i-statistika" element={<StatsPage />} />,
  <Route key="statistika-zanimanje" path="/cene-i-statistika/:zanimanje" element={<StatsPage />} />,
  <Route key="statistika-zanimanje-grad" path="/cene-i-statistika/:zanimanje/:grad" element={<StatsPage />} />
];
