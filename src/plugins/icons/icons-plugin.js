/**
 * VanillaForge built-in icons plugin.
 *
 * Provides zero-dependency, inline-SVG icons so apps don't need Font Awesome
 * or any other external icon library. Icons render as accessible <svg> elements
 * directly in the HTML string — no external requests, no flash of missing icons.
 *
 * Usage:
 *   import { createApp, iconsPlugin } from './src/framework.js';
 *   const app = createApp({ ... });
 *   app.use(iconsPlugin);              // install with defaults
 *   app.use(iconsPlugin, {
 *     icons: { logo: '<path .../>' }  // add/override individual icons
 *   });
 *
 * In any component:
 *   getTemplate() {
 *     return `<button>${this.icon('check', { size: 18 })} Save</button>`;
 *   }
 *
 * Users can still bring their own icon library — just don't install this plugin
 * and wire up whatever they prefer.
 */

import { defaultIcons } from './default-icons.js';
import { escapeHtml } from '../../utils/html.js';

/**
 * Service that stores and renders inline SVG icons.
 * Registered under the key 'icons' via app.provide().
 */
export class IconsService {
    constructor(icons = {}) {
        this._icons = new Map(Object.entries(icons));
        this._warnedUnknown = new Set();
    }

    /**
     * Register a custom icon (or override an existing one).
     *
     * @param {string} name - Icon name
     * @param {string} innerSvg - SVG inner content (everything inside <svg>...</svg>)
     * @returns {IconsService} this, for chaining
     */
    register(name, innerSvg) {
        this._icons.set(name, innerSvg);
        return this;
    }

    /**
     * Check whether a named icon is registered.
     *
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        return this._icons.has(name);
    }

    /**
     * Render a named icon as an inline SVG string.
     *
     * @param {string} name - Icon name (e.g. 'check', 'trash', 'menu')
     * @param {Object} [opts={}]
     * @param {number} [opts.size=24] - Width and height in pixels
     * @param {string} [opts.className=''] - Extra CSS class on the <svg> element
     * @param {string} [opts.title] - Accessible title; omit for decorative icons
     * @param {string} [opts.color] - Inline color override (defaults to currentColor)
     * @returns {string} Inline SVG string, or '' for unknown icons
     */
    render(name, opts = {}) {
        const inner = this._icons.get(name);
        if (!inner) {
            if (!this._warnedUnknown.has(name)) {
                console.warn(`[VanillaForge icons] Unknown icon: "${name}"`);
                this._warnedUnknown.add(name);
            }
            return '';
        }

        const size = opts.size ?? 24;
        const cls = ['vf-icon', opts.className].filter(Boolean).join(' ');
        const colorStyle = opts.color ? ` style="color:${opts.color}"` : '';
        const titleTag = opts.title
            ? `<title>${escapeHtml(opts.title)}</title>`
            : '';
        const aria = opts.title
            ? `role="img" aria-label="${escapeHtml(opts.title)}"`
            : 'aria-hidden="true"';

        return (
            `<svg xmlns="http://www.w3.org/2000/svg" ` +
            `class="${cls}" ` +
            `width="${size}" height="${size}" ` +
            `viewBox="0 0 24 24" ` +
            `fill="none" ` +
            `${aria}` +
            `${colorStyle}>` +
            `${titleTag}${inner}` +
            `</svg>`
        );
    }
}

/**
 * Plugin object. Install with app.use(iconsPlugin) or
 * app.use(iconsPlugin, { icons: { myIcon: '<path .../>' } }).
 *
 * Options:
 *   icons {Object} - Additional icon definitions merged on top of the defaults.
 *                    A key that already exists in defaults is overridden.
 */
export const iconsPlugin = {
    name: 'icons',

    install(app, options = {}) {
        const merged = { ...defaultIcons, ...(options.icons || {}) };
        const service = new IconsService(merged);
        app.provide('icons', service);
    },
};

// escapeHtml is imported from src/utils/html.js
