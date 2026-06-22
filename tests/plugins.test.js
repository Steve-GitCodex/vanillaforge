/**
 * Tests for the plugin / service-registry system.
 *
 * Covers: provide(), use(), get(), idempotency, override, and invalid plugin guard.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FrameworkApp, createApp } from '../src/framework.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApp() {
  // Minimal config; keep DOM side-effects quiet in happy-dom.
  return createApp({ debug: false });
}

// ---------------------------------------------------------------------------
// provide() / get()
// ---------------------------------------------------------------------------

describe('FrameworkApp.provide() and get()', () => {
  it('registers and retrieves a service by name', () => {
    const app = makeApp();
    const svc = { doThing: () => 'done' };
    app.provide('my-service', svc);
    expect(app.get('my-service')).toBe(svc);
  });

  it('replaces an existing service', () => {
    const app = makeApp();
    app.provide('my-service', { v: 1 });
    const v2 = { v: 2 };
    app.provide('my-service', v2);
    expect(app.get('my-service')).toBe(v2);
  });

  it('returns null for an unknown service', () => {
    const app = makeApp();
    expect(app.get('nonexistent')).toBeNull();
  });

  it('built-in services are available via get()', () => {
    const app = makeApp();
    expect(app.get('eventBus')).toBeTruthy();
    expect(app.get('logger')).toBeTruthy();
    expect(app.get('errorHandler')).toBeTruthy();
    expect(app.get('componentManager')).toBeTruthy();
    expect(app.get('performanceUtils')).toBeTruthy();
  });

  it('returns this for chaining', () => {
    const app = makeApp();
    expect(app.provide('x', {})).toBe(app);
  });
});

// ---------------------------------------------------------------------------
// use()
// ---------------------------------------------------------------------------

describe('FrameworkApp.use()', () => {
  it('installs a function plugin', () => {
    const app = makeApp();
    let installed = false;
    const fn = (a, opts) => {
      expect(a).toBe(app);
      expect(opts.flag).toBe(true);
      installed = true;
    };
    app.use(fn, { flag: true });
    expect(installed).toBe(true);
  });

  it('installs an object plugin via install()', () => {
    const app = makeApp();
    let called = false;
    const plugin = {
      name: 'test-plugin',
      install(a, opts) {
        called = true;
        a.provide('test-svc', { from: 'plugin', opts });
      },
    };
    app.use(plugin, { extra: 42 });
    expect(called).toBe(true);
    expect(app.get('test-svc')).toEqual({ from: 'plugin', opts: { extra: 42 } });
  });

  it('is idempotent for named plugins (second call skipped)', () => {
    const app = makeApp();
    let count = 0;
    const plugin = { name: 'counted', install: () => count++ };
    app.use(plugin);
    app.use(plugin);
    expect(count).toBe(1);
  });

  it('is not idempotent for anonymous function plugins', () => {
    const app = makeApp();
    let count = 0;
    const fn = () => count++;
    // Same function reference — second install should be skipped because the
    // function itself is used as the key.
    app.use(fn);
    app.use(fn);
    expect(count).toBe(1);
  });

  it('throws for an invalid plugin', () => {
    const app = makeApp();
    expect(() => app.use({ name: 'bad' /* no install() */ })).toThrow();
  });

  it('returns this for chaining', () => {
    const app = makeApp();
    const plugin = { name: 'chain', install: () => {} };
    expect(app.use(plugin)).toBe(app);
  });

  it('a later use() with the same service name overrides the earlier one', () => {
    const app = makeApp();
    const p1 = { name: 'p1', install: (a) => a.provide('shared', { v: 1 }) };
    const p2 = { name: 'p2', install: (a) => a.provide('shared', { v: 2 }) };
    app.use(p1).use(p2);
    expect(app.get('shared').v).toBe(2);
  });
});
