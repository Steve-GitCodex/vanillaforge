import js from '@eslint/js';

/**
 * Flat ESLint config (ESLint v9+). Framework source is browser ES modules;
 * scripts and tests run in Node.
 */
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  console: 'readonly',
  performance: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  fetch: 'readonly',
  AbortController: 'readonly',
  alert: 'readonly',
  prompt: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  Node: 'readonly',
  HTMLElement: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  MouseEvent: 'readonly',
  requestAnimationFrame: 'readonly',
  Blob: 'readonly',
  Image: 'readonly',
  FormData: 'readonly',
  IntersectionObserver: 'readonly',
  MutationObserver: 'readonly',
  getComputedStyle: 'readonly',
};

const nodeGlobals = {
  process: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
};

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'examples/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: nodeGlobals,
    },
  },
];
