/**
 * Tests for the built-in fonts plugin.
 *
 * Covers: @font-face injection, bundled data URI (zero-config), path override,
 * variable font CSS generation, weight/style filtering, unknown family error,
 * getFamilies(), addFamily(), theme token integration, idempotent style element,
 * and fontsPlugin install.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { FontsService, fontsPlugin } from '../src/plugins/fonts/fonts-plugin.js';
import { createApp, themePlugin } from '../src/framework.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService(options = {}) {
  return new FontsService(options);
}

function getStyleContent() {
  const el = document.getElementById('vf-fonts');
  return el ? el.textContent : null;
}

function cleanup() {
  document.getElementById('vf-fonts')?.remove();
  document.getElementById('vf-theme')?.remove();
}

// ---------------------------------------------------------------------------
// Style element lifecycle
// ---------------------------------------------------------------------------

describe('FontsService — style injection', () => {
  afterEach(cleanup);

  it('creates a <style id="vf-fonts"> element in document.head', () => {
    makeService({ families: ['Inter'] });
    const el = document.getElementById('vf-fonts');
    expect(el).toBeTruthy();
    expect(el.tagName.toLowerCase()).toBe('style');
  });

  it('does nothing when no families are requested', () => {
    makeService({ families: [] });
    expect(document.getElementById('vf-fonts')).toBeNull();
  });

  it('reuses an existing #vf-fonts element rather than creating a duplicate', () => {
    makeService({ families: ['Inter'] });
    makeService({ families: ['JetBrains Mono'] });
    expect(document.querySelectorAll('#vf-fonts').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Bundled data URI (zero-config, no path)
// ---------------------------------------------------------------------------

describe('FontsService — bundled data URI (default)', () => {
  afterEach(cleanup);

  it('generates @font-face for Inter without a path option', () => {
    makeService({ families: ['Inter'] });
    expect(getStyleContent()).toContain("font-family: 'Inter'");
  });

  it('uses a data URI src when no path is given', () => {
    makeService({ families: ['Inter'] });
    expect(getStyleContent()).toContain("url('data:font/woff2;base64,");
  });

  it('generates data URI src for JetBrains Mono without a path option', () => {
    makeService({ families: ['JetBrains Mono'] });
    const css = getStyleContent();
    expect(css).toContain("font-family: 'JetBrains Mono'");
    expect(css).toContain("url('data:font/woff2;base64,");
  });

  it('generates separate blocks for normal and italic styles', () => {
    makeService({ families: ['Inter'] });
    const css = getStyleContent();
    expect(css).toContain('font-style: normal');
    expect(css).toContain('font-style: italic');
  });
});

// ---------------------------------------------------------------------------
// Path override (advanced / custom files)
// ---------------------------------------------------------------------------

describe('FontsService — path override', () => {
  afterEach(cleanup);

  it('uses a URL path src when path is provided', () => {
    makeService({ families: ['Inter'], path: '/assets/fonts' });
    const css = getStyleContent();
    expect(css).toContain("url('/assets/fonts/Inter-Variable.woff2')");
    expect(css).not.toContain('data:font/woff2');
  });

  it('strips a trailing slash from path', () => {
    makeService({ families: ['Inter'], path: '/assets/fonts/' });
    expect(getStyleContent()).toContain("url('/assets/fonts/Inter-Variable.woff2')");
  });
});

// ---------------------------------------------------------------------------
// @font-face block shape
// ---------------------------------------------------------------------------

describe('FontsService — @font-face block content', () => {
  afterEach(cleanup);

  it('uses the full weight range for a variable font', () => {
    makeService({ families: ['Inter'] });
    expect(getStyleContent()).toContain('font-weight: 100 900');
  });

  it('uses font-display: swap by default', () => {
    makeService({ families: ['Inter'] });
    expect(getStyleContent()).toContain('font-display: swap');
  });

  it('respects a custom display option', () => {
    makeService({ families: ['Inter'], display: 'optional' });
    expect(getStyleContent()).toContain('font-display: optional');
  });

  it('generates blocks for both Inter and JetBrains Mono in one call', () => {
    makeService({ families: ['Inter', 'JetBrains Mono'] });
    const css = getStyleContent();
    expect(css).toContain("font-family: 'Inter'");
    expect(css).toContain("font-family: 'JetBrains Mono'");
  });
});

// ---------------------------------------------------------------------------
// Weight and style filtering
// ---------------------------------------------------------------------------

describe('FontsService — weight and style filtering', () => {
  afterEach(cleanup);

  it('respects custom weights for a variable font (uses min/max of subset)', () => {
    makeService({ families: [{ name: 'Inter', weights: [400, 700] }] });
    expect(getStyleContent()).toContain('font-weight: 400 700');
  });

  it('respects style filter — omits italic when only normal is requested', () => {
    makeService({ families: [{ name: 'Inter', styles: ['normal'] }] });
    const css = getStyleContent();
    expect(css).toContain('font-style: normal');
    expect(css).not.toContain('font-style: italic');
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('FontsService — unknown family', () => {
  afterEach(cleanup);

  it('throws a descriptive error for an unknown family name', () => {
    expect(() => makeService({ families: ['Roboto'] }))
      .toThrow(/unknown font family "Roboto"/);
  });
});

// ---------------------------------------------------------------------------
// getFamilies()
// ---------------------------------------------------------------------------

describe('FontsService — getFamilies()', () => {
  afterEach(cleanup);

  it('returns an empty array when no families are loaded', () => {
    const svc = makeService();
    expect(svc.getFamilies()).toEqual([]);
  });

  it('returns CSS family names of all loaded fonts', () => {
    const svc = makeService({ families: ['Inter', 'JetBrains Mono'] });
    expect(svc.getFamilies()).toEqual(['Inter', 'JetBrains Mono']);
  });
});

// ---------------------------------------------------------------------------
// addFamily()
// ---------------------------------------------------------------------------

describe('FontsService — addFamily()', () => {
  afterEach(cleanup);

  it('registers and generates CSS for a custom static font', () => {
    const svc = makeService({ path: '/fonts' });
    svc.addFamily('MyFont', {
      cssFamily: 'MyFont',
      variable: false,
      weights: [400, 700],
      styles: ['normal'],
      filename: (weight) => `MyFont-${weight}.woff2`,
    });

    const css = getStyleContent();
    expect(css).toContain("font-family: 'MyFont'");
    expect(css).toContain("url('/fonts/MyFont-400.woff2')");
    expect(css).toContain("url('/fonts/MyFont-700.woff2')");
  });

  it('includes the custom family in getFamilies()', () => {
    const svc = makeService({ path: '/fonts' });
    svc.addFamily('MyFont', {
      cssFamily: 'MyFont',
      variable: false,
      weights: [400],
      styles: ['normal'],
      filename: () => 'MyFont-400.woff2',
    });
    expect(svc.getFamilies()).toContain('MyFont');
  });

  it('returns this for chaining', () => {
    const svc = makeService({ path: '/fonts' });
    const returned = svc.addFamily('ChainFont', {
      cssFamily: 'ChainFont',
      variable: false,
      weights: [400],
      styles: ['normal'],
      filename: () => 'ChainFont-400.woff2',
    });
    expect(returned).toBe(svc);
  });
});

// ---------------------------------------------------------------------------
// Theme token integration
// ---------------------------------------------------------------------------

describe('FontsService — theme token integration', () => {
  afterEach(cleanup);

  it('updates --vf-font-sans when Inter is loaded with themePlugin present', () => {
    const app = createApp({ debug: false });
    app.use(themePlugin);
    app.use(fontsPlugin, { families: ['Inter'] });
    expect(app.get('theme').getToken('fontSans')).toContain('Inter');
  });

  it('updates --vf-font-mono when JetBrains Mono is loaded with themePlugin present', () => {
    const app = createApp({ debug: false });
    app.use(themePlugin);
    app.use(fontsPlugin, { families: ['JetBrains Mono'] });
    expect(app.get('theme').getToken('fontMono')).toContain('JetBrains Mono');
  });

  it('does not throw when themePlugin is absent', () => {
    expect(() => {
      const app = createApp({ debug: false });
      app.use(fontsPlugin, { families: ['Inter'] });
    }).not.toThrow();
  });

  it('does not update tokens when themePlugin is absent', () => {
    const app = createApp({ debug: false });
    app.use(fontsPlugin, { families: ['Inter'] });
    expect(app.get('theme')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fontsPlugin integration
// ---------------------------------------------------------------------------

describe('fontsPlugin', () => {
  afterEach(cleanup);

  it('registers a FontsService under the "fonts" key', () => {
    const app = createApp({ debug: false });
    app.use(fontsPlugin, { families: ['Inter'] });
    expect(app.get('fonts')).toBeInstanceOf(FontsService);
  });

  it('is idempotent — second use() call is a no-op', () => {
    const app = createApp({ debug: false });
    app.use(fontsPlugin, { families: ['Inter'] });
    app.use(fontsPlugin, { families: ['JetBrains Mono'] });
    expect(app.get('fonts').getFamilies()).toEqual(['Inter']);
  });

  it('fontsPlugin and FontsService are both exported from framework.js', async () => {
    const { fontsPlugin: imported, FontsService: ImportedService } =
      await import('../src/framework.js');
    expect(imported).toBe(fontsPlugin);
    expect(ImportedService).toBe(FontsService);
  });
});
