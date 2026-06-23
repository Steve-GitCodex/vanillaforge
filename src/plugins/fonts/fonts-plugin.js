/**
 * VanillaForge built-in fonts plugin.
 *
 * Generates and injects @font-face declarations for named font families.
 * Font data is bundled directly — no external requests, no file setup, no
 * path configuration required.
 *
 * Basic usage (zero config):
 *   import { createApp, fontsPlugin } from './src/framework.js';
 *   const app = createApp({ ... });
 *   app.use(fontsPlugin, { families: ['Inter', 'JetBrains Mono'] });
 *
 * Select specific weights:
 *   app.use(fontsPlugin, {
 *     families: [{ name: 'Inter', weights: [400, 700] }],
 *   });
 *
 * Advanced — serve your own font files instead of the bundled data URIs:
 *   app.use(fontsPlugin, {
 *     families: ['Inter'],
 *     path: '/assets/fonts',   // your server path; disables data URI embedding
 *   });
 *
 * Register a custom font family at runtime:
 *   this.service('fonts').addFamily('MyFont', {
 *     cssFamily: 'MyFont',
 *     variable: false,
 *     weights: [400, 700],
 *     styles: ['normal'],
 *     filename: (weight) => `MyFont-${weight}.woff2`,
 *   });
 *   // Custom families need a path — they are not bundled.
 *   // Set it with: app.use(fontsPlugin, { path: '/fonts', families: [...] })
 *   // or pass it when calling addFamily via the service directly.
 *
 * Theme integration (automatic when themePlugin is also installed):
 *   Installing Inter sets  --vf-font-sans to 'Inter', system-ui, ...
 *   Installing JetBrains Mono sets --vf-font-mono to 'JetBrains Mono', monospace, ...
 *
 * Bundled fonts are Latin-subset, variable-weight woff2 (open-source, MIT-licensed).
 * Font data is loaded lazily — it is only fetched when the plugin is actually installed.
 */

import { FONT_MANIFESTS } from './font-manifests.js';

// ---------------------------------------------------------------------------
// FontsService
// ---------------------------------------------------------------------------

/**
 * Manages @font-face injection and the runtime font manifest registry.
 * Registered under the key 'fonts' via app.provide().
 */
export class FontsService {
  /**
   * @param {Object} options
   * @param {Array<string|{name:string,weights?:number[],styles?:string[]}>} [options.families]
   * @param {string}  [options.path]    - Optional URL base for custom/external font files.
   *                                      When omitted, bundled data URIs are used for built-in fonts.
   * @param {string}  [options.display='swap'] - CSS font-display value.
   */
  constructor(options = {}) {
    this._path = options.path ? options.path.replace(/\/$/, '') : null;
    this._display = options.display || 'swap';
    this._manifests = new Map(FONT_MANIFESTS);
    this._loadedFamilies = [];
    this._styleEl = null;
    // Resolves once @font-face CSS has been injected (after any lazy font data loads).
    this._ready = Promise.resolve();

    const requested = options.families || [];
    if (requested.length > 0) {
      this._load(requested);
      this._ready = this._reinject();
    }
  }

  // ---- public API ----------------------------------------------------------

  /**
   * Returns the CSS family names that have been loaded.
   * @returns {string[]}
   */
  getFamilies() {
    return this._loadedFamilies.map((e) => e.cssFamily);
  }

  /**
   * Register a custom font manifest and inject its @font-face block.
   * Custom families are served from the path passed to the constructor.
   *
   * @param {string} name     - Lookup key (e.g. 'MyFont').
   * @param {Object} manifest - FontManifest-shaped object.
   * @returns {FontsService} this, for chaining.
   */
  addFamily(name, manifest) {
    this._manifests.set(name, manifest);
    this._loadOne(name, manifest, null, null);
    this._ready = this._reinject();
    return this;
  }

  // ---- private -------------------------------------------------------------

  _load(requested) {
    for (const entry of requested) {
      const isString = typeof entry === 'string';
      const name = isString ? entry : entry.name;
      const weightFilter = isString ? null : (entry.weights || null);
      const styleFilter = isString ? null : (entry.styles || null);

      const manifest = this._manifests.get(name);
      if (!manifest) {
        throw new Error(
          `fontsPlugin: unknown font family "${name}". ` +
          'Use addFamily() to register a custom font manifest.'
        );
      }

      this._loadOne(name, manifest, weightFilter, styleFilter);
    }
    // _reinject() is called by the constructor after _load()
  }

  _loadOne(name, manifest, weightFilter, styleFilter) {
    const weights = weightFilter || manifest.weights;
    const styles = styleFilter || manifest.styles;
    this._loadedFamilies.push({ name, manifest, weights, styles, cssFamily: manifest.cssFamily });
  }

  async _reinject() {
    if (typeof document === 'undefined') return;

    if (!this._styleEl) {
      // Create / reuse the style element synchronously before any await so that
      // the element exists in the DOM as soon as _reinject() is called.
      this._styleEl = document.getElementById('vf-fonts');
      if (!this._styleEl) {
        this._styleEl = document.createElement('style');
        this._styleEl.id = 'vf-fonts';
        document.head.appendChild(this._styleEl);
      }
    }

    // Build CSS — may trigger lazy font data imports (async).
    this._styleEl.textContent = await this._buildCSS();
  }

  async _buildCSS() {
    const blocks = [];

    for (const { manifest, weights, styles, cssFamily } of this._loadedFamilies) {
      if (manifest.variable) {
        const [minW, maxW] = [Math.min(...weights), Math.max(...weights)];
        for (const style of styles) {
          const src = await this._src(manifest, null, style);
          blocks.push(this._block(cssFamily, style, `${minW} ${maxW}`, src));
        }
      } else {
        for (const weight of weights) {
          for (const style of styles) {
            const src = await this._src(manifest, weight, style);
            blocks.push(this._block(cssFamily, style, String(weight), src));
          }
        }
      }
    }

    return blocks.join('\n');
  }

  /**
   * Returns the CSS src value for a given manifest + weight + style.
   * Prefers the bundled data URI; falls back to the path-based URL when:
   *   - a path was explicitly provided, OR
   *   - the manifest has no dataUri function (custom family).
   */
  async _src(manifest, weight, style) {
    if (!this._path && typeof manifest.dataUri === 'function') {
      const uri = await manifest.dataUri(style);
      if (uri) return `url('${uri}') format('woff2')`;
    }

    const base = this._path || '/fonts';
    const file = manifest.filename(weight, style);
    return `url('${base}/${file}') format('woff2')`;
  }

  _block(family, style, weight, src) {
    return [
      '@font-face {',
      `  font-family: '${family}';`,
      `  font-style: ${style};`,
      `  font-weight: ${weight};`,
      `  font-display: ${this._display};`,
      `  src: ${src};`,
      '}',
    ].join('\n');
  }

  /**
   * Updates theme tokens for loaded families if the theme service is present.
   * Called from the plugin's install() after app.provide() so app.get('theme')
   * is available.
   *
   * @param {import('../../framework.js').FrameworkApp} app
   */
  _updateThemeTokens(app) {
    const theme = app.get('theme');
    if (!theme) return;

    const updates = {};
    for (const { manifest } of this._loadedFamilies) {
      if (manifest.themeToken) {
        updates[manifest.themeToken] = `'${manifest.cssFamily}', ${manifest.fallback}`;
      }
    }

    if (Object.keys(updates).length > 0) {
      theme.setTokens(updates);
    }
  }
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

/**
 * Plugin object. Install with:
 *   app.use(fontsPlugin, { families: ['Inter', 'JetBrains Mono'] })
 *
 * Options:
 *   families {Array}  - Font family names or descriptor objects. Required.
 *   path     {string} - URL base for custom font files (optional).
 *                       Omit to use bundled data URIs (recommended).
 *   display  {string} - CSS font-display value (default 'swap').
 *
 * Side effects on install:
 *   - Injects <style id="vf-fonts"> with @font-face declarations (async, after dynamic import).
 *   - Registers FontsService under 'fonts' (app.get('fonts')).
 *   - If themePlugin is installed, updates --vf-font-sans / --vf-font-mono.
 */
export const fontsPlugin = {
  name: 'fonts',

  install(app, options = {}) {
    const service = new FontsService(options);
    app.provide('fonts', service);
    service._updateThemeTokens(app);
  },
};
