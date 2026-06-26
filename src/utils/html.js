/**
 * HTML escaping and safe template utilities.
 *
 * Provides:
 *   escapeHtml(str)    - escape a string for safe insertion into HTML
 *   raw(value)         - wrap a trusted string so the html tag passes it through
 *   html`…`            - tagged template that auto-escapes every interpolation
 *                        unless it is a RawHtml instance (from raw() or icon()/child())
 *
 * Usage in a component:
 *
 *   import { html, raw, escapeHtml } from '../utils/html.js';
 *
 *   getTemplate() {
 *     return html`<h1>${this.state.title}</h1>
 *       <p>${this.state.body}</p>
 *       <span>${this.icon('check')}</span>`;  // icon() returns RawHtml — not double-escaped
 *   }
 *
 * The tagged template is completely optional. Plain template literals continue
 * to work as before; callers are responsible for escaping with escapeHtml() in
 * that case.  child() and icon() return RawHtml so they are safe to use in
 * either style.
 */

/**
 * Escape a plain string for safe embedding in HTML text or attribute values.
 * Escapes & < > " and '.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Wraps a trusted HTML string so the html tagged template passes it through
 * without escaping.  Also used as the return type of icon() and child() so
 * those helpers compose safely in html`` templates.
 */
export class RawHtml {
  constructor(value) {
    this._value = String(value == null ? '' : value);
  }

  toString() {
    return this._value;
  }
}

/**
 * Mark a string as trusted HTML so the html tagged template will not escape it.
 * Only call this on strings you control (e.g. output of icon(), child(), or
 * static SVG literals).  Never pass user input through raw().
 *
 * @param {unknown} value
 * @returns {RawHtml}
 */
export function raw(value) {
  return new RawHtml(value);
}

/**
 * Tagged template literal that auto-escapes every interpolated value.
 * RawHtml instances (from raw(), icon(), child()) are passed through unchanged.
 * Arrays are joined — each element is individually escaped or passed through.
 *
 * @param {TemplateStringsArray} strings
 * @param {...unknown} values
 * @returns {string}
 *
 * @example
 * html`<p>${userInput}</p>`         // userInput is escaped
 * html`<span>${this.icon('x')}</span>` // RawHtml from icon() — not double-escaped
 * html`<ul>${items.map(i => html`<li>${i.label}</li>`)}</ul>` // nested, safe
 */
export function html(strings, ...values) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += _stringify(values[i]);
    result += strings[i + 1];
  }
  return result;
}

function _stringify(value) {
  if (value instanceof RawHtml) return value.toString();
  if (Array.isArray(value)) return value.map(_stringify).join('');
  if (value == null) return '';
  return escapeHtml(value);
}
