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

  return {
    base: '/',
    logLevel: 'info',
    plugins: [
      react(),
      tailwindcss(),
      isProd && VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
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
      port: 5174,
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
      // Raise warning limit to avoid false alarms for large chunks after minification
      chunkSizeWarningLimit: 1000, // KB
      // Split vendor code into a separate chunk for better caching and size management
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
