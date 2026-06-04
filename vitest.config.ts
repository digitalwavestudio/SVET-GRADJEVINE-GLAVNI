import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./server/tests/setup.ts'],
    include: ['server/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environment: 'node', // Default
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['server/**/*.ts', 'src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['server/tests/**', 'src/tests/**', 'server/config/**', '**/index.ts'],
    },
  },
});
