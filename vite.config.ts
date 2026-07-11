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
        // Keep modulepreload for vendor-core and vendor-firebase (needed immediately)
        // Strip only heavy chart/animation/deferred chunks
        return html.replace(
          /<link rel="modulepreload"[^>]*href="[^"]*vendor-(?:charts|motion)[^"]*"[^>]*>\n?/g,
          ''
        );
      },
    },
  });

  // Inline critical CSS + fix stylesheet loading for CSP
  const inlineCriticalCssPlugin = () => ({
    name: 'inline-critical-css',
    transformIndexHtml: {
      order: 'post',
      handler: (html: string) => {
        const criticalCss = [
          '#root:empty{background-color:#0F1923;min-height:100vh}',
          'body{background-color:#0F1923;margin:0;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#e2e8f0;font-size:16px;line-height:1.5}',
          'nav.fixed.top-0{position:fixed;top:0;left:0;right:0;z-index:999;height:6rem;background:rgba(15,25,35,0.4);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05)}',
          'nav.fixed.top-0 .flex{display:flex;align-items:center;gap:0.75rem}',
          'nav.fixed.top-0 img{width:160px;height:auto;max-height:4.5rem}',
          '.hero-gradient{background:linear-gradient(135deg,rgba(15,25,35,0.9) 0%,rgba(15,25,35,0.4) 50%,rgba(15,25,35,0.1) 100%)}',
          '.hero-bottom-fade{-webkit-mask-image:linear-gradient(to bottom,black 80%,transparent 100%);mask-image:linear-gradient(to bottom,black 80%,transparent 100%)}',
          '.glass-panel{background:rgba(19,28,38,0.7);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.05)}',
          'h1.font-headline{font-family:Montserrat,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em}',
          'input,textarea{background:rgba(255,255,255,0.03);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.05)}',
          '.scroll-fade-in{opacity:0;animation:fadeIn 0.6s ease-out forwards}',
          '@keyframes fadeIn{to{opacity:1}}',
          '@keyframes heroBgIn{to{opacity:1}}',
          '::-webkit-scrollbar{width:8px;height:8px}',
          '::-webkit-scrollbar-track{background:#0f1923}',
          '::-webkit-scrollbar-thumb{background:#24303d;border-radius:4px}',
          'a{color:inherit;text-decoration:none}',
          '*,:after,:before{box-sizing:border-box}',
          '.text-white{color:#fff}.text-secondary{color:#f59e0b}.font-headline{font-family:Montserrat,sans-serif}.font-body{font-family:Inter,sans-serif}.text-sm{font-size:.875rem}.text-xl{font-size:1.25rem}.text-3xl{font-size:1.875rem}.uppercase{text-transform:uppercase}.tracking-tighter{letter-spacing:-.05em}.leading-\\[1\\.1\\]{line-height:1.1}.mb-8{margin-bottom:2rem}.relative{position:relative}',
          '.bg-surface{background-color:#0F1923}',
        ].join('');
        html = html.replace(
          '<style>\n      #root:empty { background-color: #0F1923; min-height: 100vh; }\n    </style>',
          '<style>' + criticalCss + '</style>'
        );
        // Defer full CSS — load async via preload (non-blocking) to avoid render-blocking
        html = html.replace(
          /<link rel="stylesheet"[^>]*href="\/assets\/index-[^"]+\.css"[^>]*>/,
          (match) => {
            const href = match.match(/href="([^"]+)"/)?.[1];
            if (!href) return match;
            const id = 'full-css';
            return `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript>${match}<\/noscript>`;
          }
        );
        return html;
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
      inlineCriticalCssPlugin(),
      isProd && VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [/^\/__/],
          maximumFileSizeToCacheInBytes: 10000000,
          navigationPreload: false,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-cache-v2',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/api\.svet-gradjevine\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache-v2',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
                networkTimeoutSeconds: 4,
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets-v2',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts-v2',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 }
              }
            }
          ]
        },
        manifest: {
          name: 'Svet Građevine',
          short_name: 'Građevina',
          description: 'Oglasi u građevinskoj industriji',
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
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
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
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/performance',
        'lucide-react',
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
      chunkSizeWarningLimit: 500, // KB
      // Split vendor code into a separate chunk for better caching and size management
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || /[\/\\]react[\/\\.]/.test(id) || id.includes('react-router') || id.includes('scheduler')) {
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
              // Stripe removed — unused on frontend
              if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils') || id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('react-helmet-async') || id.includes('tailwind-merge') || id.includes('clsx')) {
                return 'vendor-ui';
              }
              if (id.includes('firebase/auth')) {
                return 'vendor-firebase-auth';
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
