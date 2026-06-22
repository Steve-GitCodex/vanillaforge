/**
 * VanillaForge base stylesheet.
 *
 * Injected by ThemeService when base !== false (the default).
 * Every rule uses the --vf-* custom properties set by the token block,
 * so swapping tokens is enough to retheme everything here.
 */

export const BASE_STYLES = `
/* --- VanillaForge base --- */
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: var(--vf-font-sans);
  color: var(--vf-text);
  background: var(--vf-background);
  line-height: 1.5;
  margin: 0;
}

a { color: var(--vf-primary); }
a:hover { color: var(--vf-primary-dark); }

/* --- .vf-card --- */
.vf-card {
  background: var(--vf-surface);
  border-radius: var(--vf-radius-lg);
  box-shadow: var(--vf-shadow-md);
  padding: 1.5rem;
}

/* --- .vf-btn --- */
.vf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--vf-radius);
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  font-size: .9rem;
  text-decoration: none;
  transition: opacity .15s;
}
.vf-btn:hover { opacity: .85; }
.vf-btn:active { opacity: .7; }
.vf-btn:disabled { opacity: .45; cursor: not-allowed; }

.vf-btn-primary  { background: var(--vf-primary);   color: #fff; }
.vf-btn-secondary { background: var(--vf-border);  color: var(--vf-text); }
.vf-btn-danger   { background: var(--vf-danger);    color: #fff; }
.vf-btn-success  { background: var(--vf-success);   color: #fff; }

/* --- .vf-icon (icons plugin companion) --- */
.vf-icon { vertical-align: middle; }
`;
