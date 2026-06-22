/**
 * VanillaForge built-in theme plugin.
 *
 * Injects a block of CSS custom properties (--vf-*) into <head> and,
 * by default, a small base stylesheet that makes apps look sensible
 * out of the box without Tailwind, Bootstrap, or any external CSS.
 *
 * Usage:
 *   import { createApp, themePlugin } from './src/framework.js';
 *   const app = createApp({ ... });
 *
 *   app.use(themePlugin);                        // defaults only
 *   app.use(themePlugin, {
 *     tokens: { primary: '#6366f1', radius: '8px' }
 *   });
 *   app.use(themePlugin, { base: false });        // token vars only, no base stylesheet
 *
 * In any component:
 *   this.service('theme').setTokens({ primary: '#ef4444' }); // live update
 *   this.service('theme').getToken('primary');                // '#ef4444'
 *
 * In CSS / inline styles:
 *   color: var(--vf-primary);
 *   border-radius: var(--vf-radius);
 */

import { BASE_STYLES } from './base-styles.js';

// ---------------------------------------------------------------------------
// Default design tokens
// ---------------------------------------------------------------------------

const DEFAULT_TOKENS = {
  // Colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  secondary: '#6b7280',
  surface: '#ffffff',
  background: '#f4f5f7',
  text: '#1f2933',
  textMuted: '#7b8794',
  border: '#e5e7eb',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  // Shape
  radius: '6px',
  radiusSm: '4px',
  radiusLg: '12px',
  // Typography
  fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontMono: '"JetBrains Mono", "Fira Code", monospace',
  // Shadows
  shadowSm: '0 1px 3px rgba(0,0,0,.08)',
  shadowMd: '0 4px 16px rgba(0,0,0,.08)',
  shadowLg: '0 10px 30px rgba(0,0,0,.12)',
  // Base spacing unit (useful for calc()-based layouts)
  space: '4px',
};

// ---------------------------------------------------------------------------
// ThemeService
// ---------------------------------------------------------------------------

/**
 * Manages design tokens and injects them as CSS custom properties.
 * Registered under the key 'theme' via app.provide().
 */
export class ThemeService {
  constructor(options = {}) {
    this._tokens = { ...DEFAULT_TOKENS, ...(options.tokens || {}) };
    this._includeBase = options.base !== false;
    this._styleEl = null;
    this._inject();
  }

  /**
   * Update one or more tokens and re-inject the style block.
   *
   * @param {Object} tokens - Partial token map to merge in
   * @returns {ThemeService} this, for chaining
   */
  setTokens(tokens) {
    Object.assign(this._tokens, tokens);
    this._inject();
    return this;
  }

  /**
   * Read a single token value by its camelCase name.
   *
   * @param {string} name - e.g. 'primary', 'fontSans'
   * @returns {string|null}
   */
  getToken(name) {
    return Object.prototype.hasOwnProperty.call(this._tokens, name)
      ? this._tokens[name]
      : null;
  }

  // ---- private -----------------------------------------------------------

  _inject() {
    if (typeof document === 'undefined') return;

    if (!this._styleEl) {
      // Reuse an element a previous ThemeService instance may have left behind
      // (e.g. hot-reload or a second app.use() call after override).
      this._styleEl = document.getElementById('vf-theme');
      if (!this._styleEl) {
        this._styleEl = document.createElement('style');
        this._styleEl.id = 'vf-theme';
        document.head.appendChild(this._styleEl);
      }
    }

    this._styleEl.textContent = this._buildCSS();
  }

  _buildCSS() {
    const vars = Object.entries(this._tokens)
      .map(([k, v]) => `  --vf-${camelToKebab(k)}: ${v};`)
      .join('\n');
    const rootBlock = `:root {\n${vars}\n}`;
    return this._includeBase
      ? `${rootBlock}\n${BASE_STYLES}`
      : rootBlock;
  }
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

/**
 * Plugin object. Install with:
 *   app.use(themePlugin)
 *   app.use(themePlugin, { tokens: { primary: '#6366f1' } })
 *   app.use(themePlugin, { base: false })
 *
 * Options:
 *   tokens {Object} - Token overrides merged on top of defaults.
 *   base   {boolean} - Set to false to skip the base stylesheet (default: true).
 */
export const themePlugin = {
  name: 'theme',

  install(app, options = {}) {
    const service = new ThemeService(options);
    app.provide('theme', service);
  },
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function camelToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
