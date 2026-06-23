/**
 * Tests for the Store plugin (StoreService + storePlugin).
 *
 * Covers: get/set, no-op on same value, subscribe, unsubscribe,
 * subscribeAll, delete, keys(), EventBus events, plugin install.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreService, storePlugin } from '../src/plugins/store/store-plugin.js';
import { EventBus } from '../src/core/event-bus.js';

function makeStore() {
  const bus = new EventBus();
  const store = new StoreService(bus);
  return { store, bus };
}

// ---------------------------------------------------------------------------
// StoreService — basic get/set
// ---------------------------------------------------------------------------

describe('StoreService — get / set', () => {
  it('returns undefined for an unset key', () => {
    const { store } = makeStore();
    expect(store.get('x')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    const { store } = makeStore();
    store.set('count', 42);
    expect(store.get('count')).toBe(42);
  });

  it('updates an existing key', () => {
    const { store } = makeStore();
    store.set('n', 1);
    store.set('n', 2);
    expect(store.get('n')).toBe(2);
  });

  it('stores object values by reference', () => {
    const { store } = makeStore();
    const obj = { a: 1 };
    store.set('obj', obj);
    expect(store.get('obj')).toBe(obj);
  });
});

// ---------------------------------------------------------------------------
// No-op on same value
// ---------------------------------------------------------------------------

describe('StoreService — same-value no-op', () => {
  it('does not fire events when the value is unchanged', () => {
    const { store, bus } = makeStore();
    store.set('x', 'hello');
    const fn = vi.fn();
    bus.on('store:change', fn);
    store.set('x', 'hello'); // identical — should be ignored
    expect(fn).not.toHaveBeenCalled();
  });

  it('uses Object.is semantics (NaN === NaN)', () => {
    const { store, bus } = makeStore();
    store.set('n', NaN);
    const fn = vi.fn();
    bus.on('store:change', fn);
    store.set('n', NaN);
    expect(fn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// subscribe (per-key)
// ---------------------------------------------------------------------------

describe('StoreService — subscribe(key, fn)', () => {
  it('calls handler with new value on change', () => {
    const { store } = makeStore();
    const fn = vi.fn();
    store.subscribe('cart', fn);
    store.set('cart', ['apple']);
    expect(fn).toHaveBeenCalledWith(['apple'], undefined);
  });

  it('passes (value, prev) to handler', () => {
    const { store } = makeStore();
    store.set('x', 1);
    const fn = vi.fn();
    store.subscribe('x', fn);
    store.set('x', 2);
    expect(fn).toHaveBeenCalledWith(2, 1);
  });

  it('multiple subscribers all fire', () => {
    const { store } = makeStore();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe('key', a);
    store.subscribe('key', b);
    store.set('key', 99);
    expect(a).toHaveBeenCalledWith(99, undefined);
    expect(b).toHaveBeenCalledWith(99, undefined);
  });

  it('unsubscribe stops delivery', () => {
    const { store } = makeStore();
    const fn = vi.fn();
    const unsub = store.subscribe('n', fn);
    store.set('n', 1);
    unsub();
    store.set('n', 2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not fire for a different key', () => {
    const { store } = makeStore();
    const fn = vi.fn();
    store.subscribe('a', fn);
    store.set('b', 100);
    expect(fn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// subscribeAll
// ---------------------------------------------------------------------------

describe('StoreService — subscribeAll(fn)', () => {
  it('calls handler with key/value/prev on any change', () => {
    const { store } = makeStore();
    const fn = vi.fn();
    store.subscribeAll(fn);
    store.set('x', 10);
    store.set('y', 20);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'x', 10, undefined);
    expect(fn).toHaveBeenNthCalledWith(2, 'y', 20, undefined);
  });

  it('unsubscribe works', () => {
    const { store } = makeStore();
    const fn = vi.fn();
    const unsub = store.subscribeAll(fn);
    store.set('a', 1);
    unsub();
    store.set('b', 2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe('StoreService — delete(key)', () => {
  it('removes the key', () => {
    const { store } = makeStore();
    store.set('x', 5);
    store.delete('x');
    expect(store.get('x')).toBeUndefined();
    expect(store.keys()).not.toContain('x');
  });

  it('fires change event with value: undefined', () => {
    const { store, bus } = makeStore();
    store.set('x', 5);
    const fn = vi.fn();
    bus.on('store:change', fn);
    store.delete('x');
    expect(fn).toHaveBeenCalledWith({ key: 'x', value: undefined, prev: 5 });
  });

  it('is a no-op for a key that does not exist', () => {
    const { store, bus } = makeStore();
    const fn = vi.fn();
    bus.on('store:change', fn);
    store.delete('missing');
    expect(fn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// keys()
// ---------------------------------------------------------------------------

describe('StoreService — keys()', () => {
  it('returns all current keys', () => {
    const { store } = makeStore();
    store.set('a', 1);
    store.set('b', 2);
    expect(store.keys()).toEqual(expect.arrayContaining(['a', 'b']));
    expect(store.keys()).toHaveLength(2);
  });

  it('excludes deleted keys', () => {
    const { store } = makeStore();
    store.set('a', 1);
    store.set('b', 2);
    store.delete('a');
    expect(store.keys()).toEqual(['b']);
  });
});

// ---------------------------------------------------------------------------
// EventBus events
// ---------------------------------------------------------------------------

describe('StoreService — EventBus events', () => {
  it('emits store:change with key/value/prev', () => {
    const { store, bus } = makeStore();
    const fn = vi.fn();
    bus.on('store:change', fn);
    store.set('count', 7);
    expect(fn).toHaveBeenCalledWith({ key: 'count', value: 7, prev: undefined });
  });

  it('emits store:change:<key> with value/prev', () => {
    const { store, bus } = makeStore();
    const fn = vi.fn();
    bus.on('store:change:count', fn);
    store.set('count', 7);
    expect(fn).toHaveBeenCalledWith({ value: 7, prev: undefined });
  });
});

// ---------------------------------------------------------------------------
// storePlugin install
// ---------------------------------------------------------------------------

describe('storePlugin', () => {
  it('registers the store service on the app', () => {
    const bus = new EventBus();
    const fakeApp = {
      eventBus: bus,
      _provided: {},
      provide(name, instance) {
        this._provided[name] = instance;
        return this;
      },
    };
    storePlugin.install(fakeApp);
    expect(fakeApp._provided['store']).toBeInstanceOf(StoreService);
  });

  it('is exported from framework.js', async () => {
    const { storePlugin: imported, StoreService: ImportedService } =
      await import('../src/framework.js');
    expect(imported).toBe(storePlugin);
    expect(ImportedService).toBe(StoreService);
  });
});
