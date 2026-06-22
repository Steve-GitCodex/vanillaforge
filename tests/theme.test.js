/**
 * Tests for the built-in theme plugin.
 *
 * Covers: ThemeService token injection, camelCase -> kebab-case conversion,
 * default tokens, overrides, setTokens(), getToken(), base:false option,
 * idempotent <style> element, and themePlugin install.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeService, themePlugin } from '../src/plugins/theme/theme-plugin.js';
import { createApp } from '../src/framework.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService(options = {}) {
  return new ThemeService(options);
}

function getStyleContent() {
  const el = document.getElementById('vf-theme');
  return el ? el.textContent : null;
}

// ---------------------------------------------------------------------------
// ThemeService — style element
// ---------------------------------------------------------------------------

describe('ThemeService — style injection', () => {
  afterEach(() => {
    // Clean up any injected <style> element between tests.
    const el = document.getElementById('vf-theme');
    if (el) el.remove();
  });

  it('creates a <style id="vf-theme"> element in document.head', () => {
    makeService();
    const el = document.getElementById('vf-theme');
    expect(el).toBeTruthy();
    expect(el.tagName.toLowerCase()).toBe('style');
  });

  it('produces a :root block with --vf-* custom properties', () => {
    makeService();
    const css = getStyleContent();
    expect(css).toContain(':root {');
    expect(css).toContain('--vf-primary:');
    expect(css).toContain('--vf-radius:');
    expect(css).toContain('--vf-font-sans:');
  });

  it('converts camelCase token names to --vf-kebab-case', () => {
    makeService({ tokens: { primaryDark: '#000', fontSans: 'serif', shadowMd: '0 4px 8px #000' } });
    const css = getStyleContent();
    expect(css).toContain('--vf-primary-dark: #000');
    expect(css).toContain('--vf-font-sans: serif');
    expect(css).toContain('--vf-shadow-md: 0 4px 8px #000');
  });

  it('includes default primary token', () => {
    makeService();
    expect(getStyleContent()).toContain('--vf-primary: #3b82f6');
  });

  it('includes the base stylesheet by default', () => {
    makeService();
    const css = getStyleContent();
    expect(css).toContain('.vf-btn');
    expect(css).toContain('.vf-card');
  });

  it('omits the base stylesheet when base: false', () => {
    makeService({ base: false });
    const css = getStyleContent();
    expect(css).toContain(':root {');
    expect(css).not.toContain('.vf-btn');
  });

  it('does not create a second <style> element on setTokens()', () => {
    const svc = makeService();
    svc.setTokens({ primary: '#ff0000' });
    svc.setTokens({ radius: '10px' });
    expect(document.querySelectorAll('#vf-theme').length).toBe(1);
  });

  it('reuses an existing #vf-theme element rather than creating a duplicate', () => {
    // First service injects the element.
    makeService({ tokens: { primary: '#aaa' } });
    // Second service (e.g. after an override) should reuse it.
    makeService({ tokens: { primary: '#bbb' } });
    expect(document.querySelectorAll('#vf-theme').length).toBe(1);
    expect(getStyleContent()).toContain('--vf-primary: #bbb');
  });
});

// ---------------------------------------------------------------------------
// ThemeService — token API
// ---------------------------------------------------------------------------

describe('ThemeService — token API', () => {
  afterEach(() => {
    const el = document.getElementById('vf-theme');
    if (el) el.remove();
  });

  it('custom tokens override defaults', () => {
    makeService({ tokens: { primary: '#ff0000' } });
    expect(getStyleContent()).toContain('--vf-primary: #ff0000');
  });

  it('default tokens that are not overridden are preserved', () => {
    makeService({ tokens: { primary: '#ff0000' } });
    expect(getStyleContent()).toContain('--vf-radius:');
  });

  it('setTokens() merges new values and re-injects', () => {
    const svc = makeService({ tokens: { primary: '#aaa' } });
    svc.setTokens({ primary: '#bbb', radius: '99px' });
    const css = getStyleContent();
    expect(css).toContain('--vf-primary: #bbb');
    expect(css).toContain('--vf-radius: 99px');
  });

  it('setTokens() returns this for chaining', () => {
    const svc = makeService();
    expect(svc.setTokens({ primary: '#fff' })).toBe(svc);
  });

  it('getToken() returns the current value of a token', () => {
    const svc = makeService({ tokens: { primary: '#123456' } });
    expect(svc.getToken('primary')).toBe('#123456');
  });

  it('getToken() reflects values updated via setTokens()', () => {
    const svc = makeService();
    svc.setTokens({ primary: '#abcdef' });
    expect(svc.getToken('primary')).toBe('#abcdef');
  });

  it('getToken() returns null for an unknown token name', () => {
    const svc = makeService();
    expect(svc.getToken('nonExistentToken')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// themePlugin integration
// ---------------------------------------------------------------------------

describe('themePlugin', () => {
  afterEach(() => {
    const el = document.getElementById('vf-theme');
    if (el) el.remove();
  });

  it('registers a ThemeService under the "theme" key', () => {
    const app = createApp({ debug: false });
    app.use(themePlugin);
    const svc = app.get('theme');
    expect(svc).toBeInstanceOf(ThemeService);
  });

  it('passes token options to the service', () => {
    const app = createApp({ debug: false });
    app.use(themePlugin, { tokens: { primary: '#cafebb' } });
    expect(app.get('theme').getToken('primary')).toBe('#cafebb');
  });

  it('is idempotent — second use() call is a no-op', () => {
    const app = createApp({ debug: false });
    app.use(themePlugin, { tokens: { primary: '#111' } });
    app.use(themePlugin, { tokens: { primary: '#222' } });
    // First install wins because the plugin system skips duplicates.
    expect(app.get('theme').getToken('primary')).toBe('#111');
  });

  it('is exported from src/framework.js', async () => {
    const { themePlugin: imported } = await import('../src/framework.js');
    expect(imported).toBeTruthy();
    expect(typeof imported.install).toBe('function');
  });
});
