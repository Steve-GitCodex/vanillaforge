# 🧩 Components

*How to build reusable UI components*

## What are Components?

Components are the building blocks of a VanillaForge application. Each component
is a self-contained class that manages its own:

- **Content** — the HTML it renders (`getTemplate()`)
- **Data** — local reactive state (`this.state` + `setState()`)
- **Behavior** — declarative event handlers (`getMethods()`)

All components extend `BaseComponent`.

## Basic Component

A component must implement `getTemplate()` (or `getHTML()` for async), returning
an HTML string:

```javascript
import { BaseComponent } from '../src/framework.js';

class MyComponent extends BaseComponent {
    constructor(eventBus, props = {}) {
        super(eventBus, props);
        this.name = 'my-component';
        this.state = { message: 'Hello!' };
    }

    getTemplate() {
        return `<div class="my-component">${this.state.message}</div>`;
    }
}
```

## State and re-rendering

`setState()` merges new values into `this.state` and re-renders. Re-renders are
applied with a DOM morph, so only changed nodes update and focused inputs keep
their caret — you never lose typing mid-render.

```javascript
class Counter extends BaseComponent {
    constructor(eventBus, props = {}) {
        super(eventBus, props);
        this.name = 'counter';
        this.state = { count: 0 };
    }

    getTemplate() {
        return `
            <div class="counter">
                <p>Count: ${this.state.count}</p>
                <button data-action="increment">+</button>
                <button data-action="decrement">-</button>
            </div>
        `;
    }

    getMethods() {
        return {
            increment: () => this.setState({ count: this.state.count + 1 }),
            decrement: () => this.setState({ count: this.state.count - 1 }),
        };
    }
}
```

Pass `setState(newState, false)` to update state **without** re-rendering (useful
for tracking a controlled input's value between keystrokes).

## Handling events

Wire DOM events declaratively with `data-*` attributes. Each attribute maps to a
named entry in `getMethods()` and fires on exactly one event type:

| Attribute      | Fires on  | Example                                  |
| -------------- | --------- | ---------------------------------------- |
| `data-action`  | `click`   | `<button data-action="save">Save</button>` |
| `data-change`  | `change`  | `<input type="checkbox" data-change="toggle">` |
| `data-input`   | `input`   | `<input data-input="onType">`            |
| `data-keydown` | `keydown` | `<input data-keydown="onKey">`           |
| `data-submit`  | `submit`  | `<form data-submit="onSubmit">`          |

Handlers receive `(event, matchedElement)`. Listeners are delegated to the
component root once and removed automatically when the component is destroyed —
no manual `addEventListener`/cleanup needed.

For keyed lists, add `data-key` so reordering or removing items reuses DOM nodes:

```javascript
getTemplate() {
    return `<ul>${this.state.todos
        .map((t) => `<li data-key="${t.id}">${t.text}</li>`)
        .join('')}</ul>`;
}
```

## Lifecycle hooks

Override these to run code at each stage (all optional):

```javascript
class LifecycleComponent extends BaseComponent {
    async onInit() {
        // Called once before the first render.
        // Good for: loading data, subscribing to events.
        this.state.data = await fetchSomeData();
    }

    async onRender() {
        // Called after each render (HTML is in the DOM).
    }

    onDestroy() {
        // Called when the component is being removed.
        // Good for: clearing timers you created.
    }

    getLifecycle() {
        return {
            onMount: async () => { /* after the component is mounted by the manager */ },
            onUnmount: () => { /* before it is unmounted */ },
        };
    }
}
```

## Props and route params

Components receive a `props` object. When a component is mounted by the router,
the matched route (including URL params) is available at `this.props.route`:

```javascript
// Route: /users/:id   ->   URL: /users/123
class UserComponent extends BaseComponent {
    constructor(eventBus, props = {}) {
        super(eventBus, props);
        this.name = 'user';
    }

    async onInit() {
        const userId = this.props.route?.params?.id; // '123'
        this.state.user = await fetchUser(userId);
    }

    getTemplate() {
        if (!this.state.user) return '<div>Loading…</div>';
        return `
            <div class="user-profile">
                <h1>${this.state.user.name}</h1>
                <p>User ID: ${this.props.route.params.id}</p>
            </div>`;
    }
}
```

## Component communication

Use the event bus to let components talk without direct references. `subscribe()`
registers a handler that is cleaned up automatically on destroy:

```javascript
class ParentComponent extends BaseComponent {
    async onInit() {
        this.subscribe('child:action', (data) => {
            this.setState({ lastChildAction: data.action });
        });
    }
}

class ChildComponent extends BaseComponent {
    getTemplate() {
        return `<button data-action="notify">Notify parent</button>`;
    }
    getMethods() {
        return {
            notify: () => this.emit('child:action', { action: 'button-click' }),
        };
    }
}
```

## Best practices

- **Keep components small** — one clear responsibility each.
- **Prefer declarative events** (`data-*` + `getMethods()`) over manual listeners.
- **Use `data-key`** for lists so identity and DOM state are preserved.
- **Clean up timers** you create in `onDestroy()`; event-bus subscriptions made
  with `subscribe()` and delegated DOM listeners are cleaned up for you.

---

*Keep components small and focused on a single responsibility.*
