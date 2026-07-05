import { lazy } from 'react';
import { Route } from 'react-router-dom';

const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const AiSearchPage = lazy(() => import('./pages/AiSearchPage'));

export const getSearchRouter = () => [
  <Route key="pretraga" path="/pretraga" element={<SearchResultsPage />} />,
  <Route key="ai-pretraga" path="/ai-pretraga" element={<AiSearchPage />} />
];
