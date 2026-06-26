# Signals

Signals are fine-grained reactive values. When a signal changes, only the
component that owns it re-renders — the same efficient DOM morph used by
`setState()`, but scoped to the signal's owning component and batched
automatically across multiple changes in the same tick.

---

## Creating a signal

Inside a component, call `this.signal(initialValue)`:

```js
class CounterComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'counter';
    this.count = this.signal(0);       // linked to this component
    this.label = this.signal('Count');
  }

  getTemplate() {
    return html`
      <p>${this.label.value}: ${this.count.value}</p>
      <button data-action="inc">+</button>
    `;
  }

  getMethods() {
    return {
      inc: () => this.count.set(this.count.value + 1),
    };
  }
}
```

Signals created with `this.signal()` are:
- **Linked** — `.set()` schedules a morph re-render of this component
- **Batched** — multiple `.set()` calls in the same synchronous block produce
  one render (scheduled as a microtask)
- **Auto-cleaned** — destroyed automatically when the component is destroyed

---

## Standalone signals

You can also create signals outside a component, for example in a module-level
store or utility:

```js
import { Signal } from 'vanillaforge';

const theme = new Signal('light');

const unsub = theme.subscribe((value) => {
  document.body.dataset.theme = value;
});

theme.set('dark'); // calls the subscriber and updates the DOM

unsub(); // stop listening
```

Standalone signals do not trigger component re-renders — only component-linked
signals (created via `this.signal()`) do that.

---

## API

### `signal.value`

Read the current value. Safe to call anywhere, including inside `getTemplate()`.

### `signal.set(newValue)`

Update the value. `Object.is` equality is used — setting the same value is a
no-op and fires no subscribers.

When called on a component-linked signal, schedules a single morph re-render
in the next microtask (multiple `.set()` calls in the same tick → one render).

### `signal.subscribe(fn)`

Register a callback that receives the new value on each change.
Returns an unsubscribe function.

```js
const unsub = this.count.subscribe((v) => console.log('count is now', v));
// later:
unsub();
```

---

## Computed signals

`computed(fn, dependencies)` returns a derived signal that recomputes
automatically whenever any dependency changes:

```js
import { computed } from 'vanillaforge';

class ProfileComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'profile';
    this.firstName = this.signal('John');
    this.lastName  = this.signal('Doe');

    // fullName recomputes whenever firstName or lastName changes
    this.fullName = computed(
      () => `${this.firstName.value} ${this.lastName.value}`,
      [this.firstName, this.lastName],
    );
  }

  getTemplate() {
    return html`
      <h1>${this.fullName.value}</h1>
      <input value="${this.firstName.value}" data-input="setFirst" />
      <input value="${this.lastName.value}" data-input="setLast" />
    `;
  }

  getMethods() {
    return {
      setFirst: (e) => this.firstName.set(e.target.value),
      setLast:  (e) => this.lastName.set(e.target.value),
    };
  }
}
```

### `computed(fn, dependencies)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `fn` | `() => T` | Pure function that computes the derived value |
| `dependencies` | `Signal<any>[]` | Signals to watch |

Returns a `Signal<T>`. The returned signal is **read-only by convention** —
do not call `.set()` on it directly.

Computed signals reuse the same `Object.is` equality check — if `fn()` returns
the same value, no subscribers are notified and no re-render is triggered.

Cleanup is automatic: when `_destroy()` is called on the computed signal
(which BaseComponent does for all component-linked signals on teardown), all
dependency subscriptions are removed.

### Standalone computed signals

`computed()` works outside components too:

```js
import { Signal, computed } from 'vanillaforge';

const price = new Signal(100);
const qty   = new Signal(3);
const total = computed(() => price.value * qty.value, [price, qty]);

total.subscribe((v) => console.log('Total:', v));

qty.set(5); // logs: Total: 500
```

---

## Signals vs setState

Use signals when a **single reactive value** drives part of the template.
Use `setState()` when you are updating **several related properties at once**
and want a single conceptual update.

Both trigger the same efficient DOM morph — the difference is ergonomic.

```js
// Signal — good for a counter, a toggle, a text field value
this.count = this.signal(0);

// setState — good for form state with many fields
this.setState({ firstName: 'Alice', lastName: 'Smith', age: 30 });
```
