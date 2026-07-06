import { lazy } from 'react';
import { Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

const ContactPage = lazy(() => import('./pages/ContactPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AffiliateRulesPage = lazy(() => import('./pages/AffiliateRulesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const UsefulLinksPage = lazy(() => import('./pages/UsefulLinksPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const DigitalToolsPage = lazy(() => import('./pages/DigitalToolsPage'));

import ProtectedRoute from '@/src/components/ProtectedRoute';

export const getCoreRouter = () => [
  <Route key="home" path="/" element={<HomePage />} />,
  <Route key="links" path="/korisni-linkovi" element={<UsefulLinksPage />} />,
  <Route key="community" path="/zajednica" element={<CommunityPage />} />,
  <Route key="tools" path="/digitalni-alati" element={<DigitalToolsPage />} />,
  <Route key="kontakt" path="/kontakt" element={<ContactPage />} />,
  <Route key="o-nama" path="/o-nama" element={<AboutPage />} />,
  <Route key="uslovi" path="/uslovi-koriscenja" element={<TermsPage />} />,
  <Route key="privatnost" path="/privatnost" element={<PrivacyPage />} />,
  <Route key="politika-privatnosti" path="/politika-privatnosti" element={<PrivacyPage />} />,
  <Route key="pravila" path="/pravila-oglasavanja" element={<AffiliateRulesPage />} />
];

export const getCoreDashboardRouter = () => [
  <Route key="podrska" path="/podrska" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
];
