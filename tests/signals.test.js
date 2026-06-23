/**
 * Tests for the Signal reactive primitive and BaseComponent.signal() integration.
 *
 * Covers: standalone Signal, subscribe/unsubscribe, no-op on same value,
 * subscriber error isolation, component signal() factory, microtask-batched
 * render, multiple signals in one tick → one render, safe after destroy.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Signal } from '../src/core/signal.js';
import { BaseComponent } from '../src/components/base-component.js';
import { EventBus } from '../src/core/event-bus.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Flush microtasks AND any async render steps (render() is async). */
const flush = () => new Promise((r) => setTimeout(r, 0));

function mountComponent(ComponentClass, props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const instance = new ComponentClass(new EventBus(), { autoLoadCSS: false, ...props });
  instance.container = container;
  return instance;
}

// ---------------------------------------------------------------------------
// Standalone Signal
// ---------------------------------------------------------------------------

describe('Signal — standalone', () => {
  it('holds the initial value', () => {
    const s = new Signal(42);
    expect(s.value).toBe(42);
  });

  it('updates the value on set()', () => {
    const s = new Signal(0);
    s.set(7);
    expect(s.value).toBe(7);
  });

  it('is a no-op when set() is called with the same value', () => {
    const s = new Signal('hello');
    const fn = vi.fn();
    s.subscribe(fn);
    s.set('hello');
    expect(fn).not.toHaveBeenCalled();
    expect(s.value).toBe('hello');
  });

  it('uses Object.is semantics for equality (NaN === NaN)', () => {
    const s = new Signal(NaN);
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(NaN); // same NaN → no-op
    expect(fn).not.toHaveBeenCalled();
  });

  it('notifies a subscriber with the new value', () => {
    const s = new Signal(1);
    const received = [];
    s.subscribe((v) => received.push(v));
    s.set(2);
    s.set(3);
    expect(received).toEqual([2, 3]);
  });

  it('notifies multiple subscribers', () => {
    const s = new Signal(0);
    const a = vi.fn();
    const b = vi.fn();
    s.subscribe(a);
    s.subscribe(b);
    s.set(99);
    expect(a).toHaveBeenCalledWith(99);
    expect(b).toHaveBeenCalledWith(99);
  });

  it('unsubscribes correctly via the returned function', () => {
    const s = new Signal(0);
    const fn = vi.fn();
    const unsub = s.subscribe(fn);
    s.set(1);
    unsub();
    s.set(2);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('isolates subscriber errors — other subscribers still run', () => {
    const s = new Signal(0);
    const good = vi.fn();
    s.subscribe(() => { throw new Error('boom'); });
    s.subscribe(good);
    expect(() => s.set(1)).not.toThrow();
    expect(good).toHaveBeenCalledWith(1);
  });

  it('is safe to call set() after _destroy()', () => {
    const s = new Signal(5);
    const fn = vi.fn();
    s.subscribe(fn);
    s._destroy();
    s.set(10);
    expect(fn).not.toHaveBeenCalled();
    expect(s.value).toBe(5); // value unchanged after destroy
  });

  it('works with non-primitive values', () => {
    const s = new Signal({ x: 1 });
    const next = { x: 2 };
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(next);
    expect(fn).toHaveBeenCalledWith(next);
    expect(s.value).toBe(next);
  });
});

// ---------------------------------------------------------------------------
// BaseComponent — this.signal() factory
// ---------------------------------------------------------------------------

class SignalCounter extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'signal-counter';
    this.count = this.signal(0);
    this.label = this.signal('Count');
  }

  getTemplate() {
    return `<span class="v">${this.count.value}</span><span class="l">${this.label.value}</span>`;
  }

  getMethods() {
    return {
      inc: () => this.count.set(this.count.value + 1),
    };
  }
}

describe('BaseComponent — this.signal()', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('returns a Signal with the initial value', () => {
    const c = mountComponent(SignalCounter);
    expect(c.count).toBeInstanceOf(Signal);
    expect(c.count.value).toBe(0);
  });

  it('registers the signal in _signals', () => {
    const c = mountComponent(SignalCounter);
    expect(c._signals).toContain(c.count);
    expect(c._signals).toContain(c.label);
  });

  it('renders the signal value in the template', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();
    expect(c.querySelector('.v').textContent).toBe('0');
  });

  it('triggers a morph re-render when signal.set() is called', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();
    c.count.set(5);
    await flush();
    expect(c.querySelector('.v').textContent).toBe('5');
  });

  it('batches multiple signal.set() calls in the same tick into one render', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();

    let renderCount = 0;
    const orig = c.render.bind(c);
    c.render = async (...a) => { renderCount++; return orig(...a); };

    c.count.set(1);
    c.count.set(2);
    c.count.set(3);
    // All three happen synchronously before the microtask fires

    await flush();

    expect(renderCount).toBe(1); // only one render
    expect(c.querySelector('.v').textContent).toBe('3');
  });

  it('batches changes across different signals in the same tick', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();

    let renderCount = 0;
    const orig = c.render.bind(c);
    c.render = async (...a) => { renderCount++; return orig(...a); };

    c.count.set(10);
    c.label.set('Total');
    await flush();

    expect(renderCount).toBe(1);
    expect(c.querySelector('.v').textContent).toBe('10');
    expect(c.querySelector('.l').textContent).toBe('Total');
  });

  it('does not render when signal.set() is called before init()', async () => {
    const c = mountComponent(SignalCounter);
    c.count.set(99); // before init — isRendered is false
    await flush();
    expect(c.isRendered).toBe(false); // no render attempted
    await c.init();
    // After init, template reflects the latest signal value
    expect(c.querySelector('.v').textContent).toBe('99');
  });

  it('does not render after component is destroyed', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();
    c.destroy();
    c.count.set(100);
    await flush();
    expect(c.isDestroyed).toBe(true);
  });

  it('destroys all signals on component destroy', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();
    const fn = vi.fn();
    c.count.subscribe(fn);
    c.destroy();
    c.count.set(1);
    await flush();
    expect(fn).not.toHaveBeenCalled(); // subscriber cleared by _destroy()
    expect(c._signals).toHaveLength(0);
  });

  it('keeps the same wrapper element across signal-triggered re-renders', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();
    const wrapper = c.element;
    c.count.set(7);
    await flush();
    expect(c.element).toBe(wrapper);
  });

  it('can mix signal updates and setState in the same component', async () => {
    const c = mountComponent(SignalCounter);
    await c.init();
    c.count.set(3);
    await c.setState({}); // explicit setState between signal updates
    await flush();
    expect(c.querySelector('.v').textContent).toBe('3');
  });
});

// ---------------------------------------------------------------------------
// Signal exported from framework.js
// ---------------------------------------------------------------------------

describe('Signal — public export', () => {
  it('is exported from src/framework.js', async () => {
    const { Signal: ImportedSignal } = await import('../src/framework.js');
    expect(ImportedSignal).toBe(Signal);
  });
});
