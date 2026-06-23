/**
 * Signal — a reactive primitive for VanillaForge.
 *
 * A Signal holds a single value. Reading `.value` returns the current value.
 * Calling `.set(newValue)` updates the value and:
 *   - notifies all `.subscribe()` listeners immediately, and
 *   - schedules a single morph-based re-render of the linked component in the
 *     next microtask (multiple `.set()` calls in the same synchronous block
 *     are automatically batched into one render).
 *
 * Usage inside a component:
 *
 *   constructor(eventBus, props) {
 *     super(eventBus, props);
 *     this.count = this.signal(0);      // linked to this component
 *   }
 *
 *   getTemplate() {
 *     return `<p>${this.count.value}</p>`;
 *   }
 *
 *   getMethods() {
 *     return {
 *       inc: () => this.count.set(this.count.value + 1),
 *     };
 *   }
 *
 * Standalone usage (no component):
 *
 *   import { Signal } from 'vanillaforge';
 *   const name = new Signal('world');
 *   const unsub = name.subscribe((v) => console.log('Hello', v));
 *   name.set('VanillaForge'); // logs: Hello VanillaForge
 *   unsub();                  // stop listening
 *
 * Note on fine-grained DOM patching:
 *   The current implementation triggers a full morph re-render on change —
 *   the same efficient morph used by setState(), but batched across multiple
 *   signal updates. True text-node-level patching (bypassing getTemplate()
 *   entirely) requires a tagged-template helper and is planned for a future
 *   release.
 */

export class Signal {
  /**
   * @param {*} initialValue
   */
  constructor(initialValue) {
    this._value = initialValue;
    this._subscribers = new Set();
    this._component = null;
    this._destroyed = false;
  }

  /** The current value. */
  get value() {
    return this._value;
  }

  /**
   * Update the value. Identical values (via Object.is) are ignored.
   * Notifies subscribers and schedules a component re-render.
   * @param {*} newValue
   */
  set(newValue) {
    if (this._destroyed || Object.is(this._value, newValue)) return;
    this._value = newValue;
    for (const fn of this._subscribers) {
      try {
        fn(newValue);
      } catch (err) {
        // Subscriber errors must not prevent other subscribers from running.
        console.error('[Signal] subscriber error', err);
      }
    }
    if (this._component) {
      this._component._scheduleSignalRender();
    }
  }

  /**
   * Subscribe to value changes. The handler is called with the new value each
   * time `.set()` is called with a different value.
   *
   * Returns an unsubscribe function.
   *
   * @param {(value: *) => void} fn
   * @returns {() => void}
   */
  subscribe(fn) {
    this._subscribers.add(fn);
    return () => this._subscribers.delete(fn);
  }

  // ---------------------------------------------------------------------------
  // Internal API — used by BaseComponent, not part of the public surface
  // ---------------------------------------------------------------------------

  /** Link this signal to a component so .set() triggers its render. */
  _link(component) {
    this._component = component;
    return this;
  }

  /**
   * Detach from everything. Called when the owning component is destroyed.
   * After this, .set() is a safe no-op.
   */
  _destroy() {
    this._destroyed = true;
    this._subscribers.clear();
    this._component = null;
  }
}
