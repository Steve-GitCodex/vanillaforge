import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // happy-dom gives us a real DOM (document, elements, events, selection)
    // so the morph + component pipeline can be tested without a browser.
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    globals: true,
  },
});
