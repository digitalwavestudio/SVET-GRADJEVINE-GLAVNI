import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider, createRoutesFromElements } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dehydrate } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { getRouteElements } from './modules/routeElements';
import { AppProviders } from './components/AppProviders';
import { Toaster } from 'react-hot-toast';

export interface SsrResult {
  html: string;
  dehydratedState: unknown;
  helmetHtml: string;
  status: number;
}

export async function render(url: string): Promise<SsrResult> {
  const routes = createRoutesFromElements(getRouteElements());

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: false,
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });

  const handler = createStaticHandler(routes);
  const request = new Request(url, { method: 'GET' });
  const context = await handler.query(request, { requestContext: { queryClient } });

  if (context instanceof Response) {
    return { html: '', dehydratedState: null, helmetHtml: '', status: context.status };
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  const helmetContext: Record<string, unknown> = {};

  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <HelmetProvider context={helmetContext}>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#0A0F14', color: '#fff', border: '1px solid rgba(255,173,58,0.2)' },
            }}
          />
          <StaticRouterProvider router={router} context={context} />
        </HelmetProvider>
      </AppProviders>
    </QueryClientProvider>
  );

  const dehydratedState = dehydrate(queryClient);
  const helmet = (helmetContext as any).helmet;
  const helmetHtml = helmet ? helmet.title.toString() + helmet.meta.toString() + helmet.link.toString() : '';

  return { html, dehydratedState, helmetHtml, status: context.statusCode || 200 };
}
