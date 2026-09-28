import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vite.config';

// Vitest runs the client-only acceptance criteria (the halves of an AC that
// live in the React layer: the editor textarea, the markdown preview tab, the
// analytics chart, the dashboard metrics, the admin module list and the
// /admin/* role gate). The backend halves are covered by Minitest under
// server/test.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      restoreMocks: true,
    },
  }),
);
