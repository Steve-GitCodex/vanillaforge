/**
 * Built-in font manifests for VanillaForge fontsPlugin.
 *
 * Each manifest describes a font family. The font data is bundled directly as
 * base64 data URIs so no external requests or file setup are needed — the
 * plugin works out of the box.
 *
 * Bundled fonts are Latin-subset, variable-weight woff2 files sourced from
 * the @fontsource-variable packages (open-source, MIT-licensed subsets).
 *
 * @typedef {Object} FontManifest
 * @property {string}   cssFamily    - CSS font-family name.
 * @property {string}   [themeToken] - camelCase ThemeService token to update (e.g. 'fontSans').
 * @property {string}   fallback     - Fallback stack appended to the token value.
 * @property {boolean}  variable     - True when a single file covers all weights.
 * @property {number[]} weights      - [min, max] for variable fonts; list for static.
 * @property {string[]} styles       - Available styles ('normal', 'italic').
 * @property {function(string): string|null} dataUri - Returns the bundled data URI for a style,
 *                                     or null if not bundled (triggers URL path lookup instead).
 */

import { INTER_NORMAL, INTER_ITALIC } from './files/inter.js';
import { JETBRAINS_MONO_NORMAL, JETBRAINS_MONO_ITALIC } from './files/jetbrains-mono.js';

/** @type {Map<string, FontManifest>} */
export const FONT_MANIFESTS = new Map([
  [
    'Inter',
    {
      cssFamily: 'Inter',
      themeToken: 'fontSans',
      fallback: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      variable: true,
      weights: [100, 900],
      styles: ['normal', 'italic'],
      dataUri: (style) => style === 'italic' ? INTER_ITALIC : INTER_NORMAL,
      filename: () => 'Inter-Variable.woff2',
    },
  ],
  [
    'JetBrains Mono',
    {
      cssFamily: 'JetBrains Mono',
      themeToken: 'fontMono',
      fallback: '"Fira Code", "Cascadia Code", "Courier New", monospace',
      variable: true,
      weights: [100, 800],
      styles: ['normal', 'italic'],
      dataUri: (style) => style === 'italic' ? JETBRAINS_MONO_ITALIC : JETBRAINS_MONO_NORMAL,
      filename: () => 'JetBrainsMono-Variable.woff2',
    },
  ],
]);
