import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  return {
    root: workspaceRoot,
    plugins: [angular()],
    cacheDir: 'node_modules/.vite-vitest',
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
      server: {
        deps: {
          inline: ['firebase', /rxfire/, '@angular/fire'],
        },
      },
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
