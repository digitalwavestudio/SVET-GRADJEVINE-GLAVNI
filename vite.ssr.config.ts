import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDir = path.resolve(__dirname, 'src/lib/firebase-mock');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@svet-gradjevine/ui': path.resolve(__dirname, './packages/ui/src'),
      '@svet-gradjevine/shared': path.resolve(__dirname, './packages/shared/src'),
      '@svet-gradjevine/api': path.resolve(__dirname, './packages/api/src'),
      '@': path.resolve(__dirname, './'),
      'firebase/app': path.resolve(mockDir, 'app.ts'),
      'firebase/auth': path.resolve(mockDir, 'auth.ts'),
      'firebase/firestore': path.resolve(mockDir, 'firestore.ts'),
      'firebase/performance': path.resolve(mockDir, 'performance.ts'),
    },
  },
  build: {
    outDir: 'dist-ssr',
    emptyOutDir: true,
    ssr: true,
    ssrEmitAssets: false,
    minify: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/entry-server.tsx'),
      output: {
        format: 'esm',
        entryFileNames: 'entry-server.mjs',
      },
      external: ['express', 'firebase-admin', 'ioredis'],
    },
    target: 'node22',
  },
});
