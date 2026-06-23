/**
 * Store plugin — shared reactive state for VanillaForge applications.
 *
 * Provides a lightweight key/value store layered on top of the EventBus.
 * Any component (or plugin) can read, write, and subscribe to named keys.
 *
 * Usage:
 *
 *   app.use(storePlugin);
 *
 *   // From a component:
 *   const store = this.service('store');
 *
 *   store.set('cart', [...items]);          // write
 *   store.get('cart');                      // read (current value)
 *   const unsub = store.subscribe('cart', (items) => {
 *     this.setState({ items });
 *   });
 *   unsub();                                // stop listening
 *
 * Events emitted on the shared EventBus:
 *   'store:change' — { key, value, prev } — every time a key changes.
 *   'store:change:<key>' — { value, prev } — per-key variant for targeted listeners.
 */

export class StoreService {
  /**
   * @param {import('../../core/event-bus.js').EventBus} eventBus
   */
  constructor(eventBus) {
    this._bus = eventBus;
    this._state = new Map();
  }

  /**
   * Write a value to the store under `key`.
   * Identical values (via Object.is) are silently ignored — no events fired.
   *
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const prev = this._state.get(key);
    if (Object.is(prev, value)) return;
    this._state.set(key, value);
    this._bus.emit('store:change', { key, value, prev });
    this._bus.emit(`store:change:${key}`, { value, prev });
  }

  /**
   * Read the current value for `key`.
   * Returns `undefined` when the key has never been written.
   *
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._state.get(key);
  }

  /**
   * Subscribe to changes for a specific `key`.
   * The handler is called with `(value, prev)` whenever the key changes.
   * Returns an unsubscribe function.
   *
   * @param {string} key
   * @param {(value: *, prev: *) => void} handler
   * @returns {() => void} unsubscribe
   */
  subscribe(key, handler) {
    return this._bus.on(`store:change:${key}`, ({ value, prev }) => {
      handler(value, prev);
    });
  }

  /**
   * Subscribe to ALL store changes.
   * The handler is called with `(key, value, prev)` on every write.
   * Returns an unsubscribe function.
   *
   * @param {(key: string, value: *, prev: *) => void} handler
   * @returns {() => void} unsubscribe
   */
  subscribeAll(handler) {
    return this._bus.on('store:change', ({ key, value, prev }) => {
      handler(key, value, prev);
    });
  }

  /**
   * Remove a key from the store and fire change events with `value: undefined`.
   *
   * @param {string} key
   */
  delete(key) {
    if (!this._state.has(key)) return;
    const prev = this._state.get(key);
    this._state.delete(key);
    this._bus.emit('store:change', { key, value: undefined, prev });
    this._bus.emit(`store:change:${key}`, { value: undefined, prev });
  }

  /**
   * Returns all keys currently in the store.
   * @returns {string[]}
   */
  keys() {
    return Array.from(this._state.keys());
  }
}

/**
 * Install the store plugin.
 *
 * Registers a `StoreService` instance as the 'store' service.
 * After install, components access it via `this.service('store')`.
 *
 * @type {import('../../framework.js').Plugin}
 */
export const storePlugin = {
  name: 'store',

  install(app) {
    const store = new StoreService(app.eventBus);
    app.provide('store', store);
  },
};
