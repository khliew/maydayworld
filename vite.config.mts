import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  return {
    plugins: [angular(), tsconfigPaths()],
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
