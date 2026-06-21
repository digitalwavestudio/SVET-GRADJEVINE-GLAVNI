import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import Sitemap from 'vite-plugin-sitemap';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCATIONS } from './src/constants/taxonomy';
import { MACHINE_CATEGORIES } from './src/constants/machineTaxonomy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dynamicRoutes = [
  '/',
  '/firme',
  '/alat-i-oprema',
  '/ketering',
  '/nekretnine',
  '/gradjevinske-masine',
];

// Add location-based routes
LOCATIONS.forEach(loc => {
  dynamicRoutes.push(`/firme/${loc.slug}`);
  dynamicRoutes.push(`/ketering/${loc.slug}`);
  dynamicRoutes.push(`/placevi/${loc.slug}`);
});

// Add machine categories
MACHINE_CATEGORIES.forEach(cat => {
  dynamicRoutes.push(`/gradjevinske-masine/${cat.id}`);
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  // Strip unnecessary vendor chunks from modulepreload (not needed on initial page)
  const stripModulePreloadPlugin = () => ({
    name: 'strip-modulepreload',
    transformIndexHtml: {
      order: 'post',
      handler: (html: string) => {
        return html.replace(
          /<link rel="modulepreload"[^>]*href="[^"]*vendor-(?:charts|payment)[^"]*"[^>]*>\n?/g,
          ''
        );
      },
    },
  });

  return {
    base: '/',
    logLevel: 'info',
    plugins: [
      react(),
      tailwindcss(),
      stripModulePreloadPlugin(),
      isProd && VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
          navigateFallbackDenylist: [/^\/__/],
          maximumFileSizeToCacheInBytes: 10000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        manifest: {
          name: 'Svet Građevine',
          short_name: 'Građevina',
          description: 'Najveća mreža za građevinsku industriju u Srbiji',
          theme_color: '#121212',
          background_color: '#0A0F14',
          display: 'standalone',
          lang: 'sr-RS'
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@svet-gradjevine/ui': path.resolve(__dirname, './packages/ui/src'),
        '@svet-gradjevine/shared': path.resolve(__dirname, './packages/shared/src'),
        '@svet-gradjevine/api': path.resolve(__dirname, './packages/api/src'),
        '@': path.resolve(__dirname, './'),
        // Alias for ProfileSettingsTab component
        // Removed custom alias for ProfileSettingsTab; use relative imports or generic alias
      },
    },
    define: {
      'process.env.ADMIN_EMAILS': JSON.stringify(env.ADMIN_EMAILS || '[]'),
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        '@tanstack/react-query',
        '@tanstack/react-query-persist-client',
        '@tanstack/query-sync-storage-persister',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/performance',
        'lucide-react',
        'motion',
        'recharts',
        'axios',
        'zod',
        'zustand',
        'react-hot-toast',
        'react-helmet-async',
        'clsx',
        'tailwind-merge'
      ]
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: true,
      // Raise warning limit to avoid false alarms for large chunks after minification
      chunkSizeWarningLimit: 1000, // KB
      // Split vendor code into a separate chunk for better caching and size management
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router') || id.includes('scheduler')) {
                return 'vendor-core';
              }
              if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) {
                return 'vendor-data';
              }
              if (id.includes('zustand') || id.includes('zod')) {
                return 'vendor-data';
              }
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
                return 'vendor-charts';
              }
              if (id.includes('stripe')) {
                return 'vendor-payment';
              }
              if (id.includes('motion')) {
                return 'vendor-animation';
              }
              if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('react-helmet-async') || id.includes('tailwind-merge') || id.includes('clsx')) {
                return 'vendor-ui';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor-other';
            }
          },
        },
      },
    },
  };
});
