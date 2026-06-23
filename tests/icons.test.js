/**
 * Tests for the built-in icons plugin.
 *
 * Covers: IconsService.render(), register(), has(), iconsPlugin install,
 * BaseComponent.icon() helper, and graceful degradation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IconsService, iconsPlugin } from '../src/plugins/icons/icons-plugin.js';
import { createApp, BaseComponent } from '../src/framework.js';
import { EventBus } from '../src/core/event-bus.js';

// ---------------------------------------------------------------------------
// IconsService
// ---------------------------------------------------------------------------

describe('IconsService', () => {
  let svc;

  beforeEach(() => {
    svc = new IconsService({ check: '<polyline points="4,12 9,17 20,6"/>' });
  });

  it('renders a known icon as an inline SVG string', () => {
    const svg = svc.render('check');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('polyline');
    expect(svg).toContain('class="vf-icon"');
  });

  it('uses the default size of 24', () => {
    const svg = svc.render('check');
    expect(svg).toContain('width="24"');
    expect(svg).toContain('height="24"');
  });

  it('respects a custom size', () => {
    const svg = svc.render('check', { size: 18 });
    expect(svg).toContain('width="18"');
    expect(svg).toContain('height="18"');
  });

  it('adds a className when provided', () => {
    const svg = svc.render('check', { className: 'my-icon' });
    expect(svg).toContain('vf-icon my-icon');
  });

  it('adds aria-hidden for decorative icons (no title)', () => {
    const svg = svc.render('check');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toContain('<title>');
  });

  it('adds role=img and title for accessible icons', () => {
    const svg = svc.render('check', { title: 'Confirm action' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('<title>Confirm action</title>');
    expect(svg).not.toContain('aria-hidden');
  });

  it('escapes HTML in the title', () => {
    const svg = svc.render('check', { title: '<script>bad</script>' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('returns empty string for unknown icons', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = svc.render('nonexistent');
    expect(result).toBe('');
    spy.mockRestore();
  });

  it('warns once (not repeatedly) for the same unknown icon', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    svc.render('ghost');
    svc.render('ghost');
    svc.render('ghost');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('register() adds a new icon', () => {
    svc.register('star', '<polygon points="12,2 15,9 22,9"/>');
    const svg = svc.render('star');
    expect(svg).toContain('polygon');
  });

  it('register() overrides an existing icon', () => {
    svc.register('check', '<circle cx="12" cy="12" r="5"/>');
    const svg = svc.render('check');
    expect(svg).toContain('circle');
    expect(svg).not.toContain('polyline');
  });

  it('has() returns true for registered icons', () => {
    expect(svc.has('check')).toBe(true);
    expect(svc.has('ghost')).toBe(false);
  });

  it('register() is chainable', () => {
    expect(svc.register('x', '<line/>')).toBe(svc);
  });
});

// ---------------------------------------------------------------------------
// iconsPlugin
// ---------------------------------------------------------------------------

describe('iconsPlugin', () => {
  it('installs an IconsService under the "icons" key', () => {
    const app = createApp({ debug: false });
    app.use(iconsPlugin);
    const icons = app.get('icons');
    expect(icons).toBeInstanceOf(IconsService);
  });

  it('default icons are present after install', () => {
    const app = createApp({ debug: false });
    app.use(iconsPlugin);
    const icons = app.get('icons');
    expect(icons.has('check')).toBe(true);
    expect(icons.has('trash')).toBe(true);
    expect(icons.has('menu')).toBe(true);
  });

  it('merges custom icons with defaults', () => {
    const app = createApp({ debug: false });
    app.use(iconsPlugin, { icons: { logo: '<rect width="24" height="24"/>' } });
    const icons = app.get('icons');
    expect(icons.has('check')).toBe(true);   // default still present
    expect(icons.has('logo')).toBe(true);    // custom added
  });

  it('custom icons override defaults when same name is used', () => {
    const custom = '<circle cx="12" cy="12" r="12"/>';
    const app = createApp({ debug: false });
    app.use(iconsPlugin, { icons: { check: custom } });
    const svg = app.get('icons').render('check');
    expect(svg).toContain('circle');
    expect(svg).not.toContain('polyline');
  });
});

// ---------------------------------------------------------------------------
// BaseComponent.icon() helper
// ---------------------------------------------------------------------------

class TestIconComponent extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
    this.name = 'test-icon-component';
  }
  getTemplate() {
    return `<div>${this.icon('check', { size: 20 })}</div>`;
  }
}

describe('BaseComponent.icon()', () => {
  it('returns the SVG string when icons service is installed', () => {
    const app = createApp({ debug: false });
    app.use(iconsPlugin);

    const comp = new TestIconComponent(app.eventBus, {});
    comp.app = app;
    const html = comp.getTemplate();
    expect(html).toContain('<svg');
    expect(html).toContain('width="20"');
  });

  it('returns empty string when icons service is absent', () => {
    const app = createApp({ debug: false });
    // Do NOT install iconsPlugin

    const comp = new TestIconComponent(app.eventBus, {});
    comp.app = app;
    const html = comp.getTemplate();
    expect(html).toBe('<div></div>');
  });

  it('returns empty string when app is not wired (no app ref)', () => {
    const bus = new EventBus();
    const comp = new TestIconComponent(bus, {});
    // comp.app is null by default
    const html = comp.getTemplate();
    expect(html).toBe('<div></div>');
  });
});

// ---------------------------------------------------------------------------
// framework.js re-exports
// ---------------------------------------------------------------------------

describe('icons — framework.js exports', () => {
  it('iconsPlugin and IconsService are both exported from framework.js', async () => {
    const { iconsPlugin: imported, IconsService: ImportedService } =
      await import('../src/framework.js');
    expect(imported).toBe(iconsPlugin);
    expect(ImportedService).toBe(IconsService);
  });
});
