# Component Composition

Composition lets a parent component embed child components directly in its template. Each child
has its own state, lifecycle, and event handling — fully isolated from the parent.

---

## Basic usage

Use `this.child()` inside `getTemplate()`:

```js
import { BaseComponent } from '../framework.js';
import { UserCard } from './user-card.js';

export class UsersList extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'users-list';
    this.state = { users: [] };
  }

  async onInit() {
    this.setState({ users: await fetchUsers() });
  }

  getTemplate() {
    return `
      <div class="users-list">
        <h2>Users</h2>
        ${this.state.users.map(u =>
          this.child(UserCard, { user: u }, u.id)
        ).join('')}
      </div>`;
  }
}
```

`child(componentClassOrName, props, key)` parameters:

| Parameter | Type | Description |
|---|---|---|
| `componentClassOrName` | `Class` or `string` | Component class, or a name registered via `app.initialize({ components: { ... } })` |
| `props` | `Object` | Props passed to the child component |
| `key` | `string\|number\|null` | Stable key for list reconciliation (see below) |

---

## Keys and list reconciliation

When rendering lists of children, always pass a key:

```js
this.state.items.map(item => this.child(ItemRow, { item }, item.id))
```

Keys let VanillaForge match existing child instances to updated items instead of recreating
them. This means:
- A child's internal state is preserved when its position in the list changes.
- Only children with changed props re-render — others are untouched.
- Removing an item destroys only that child (calls `onDestroy` and cleans up its listeners).

Without a key, a positional fallback is used (`__vf_0`, `__vf_1`, …). This works for static
children but causes unnecessary remounts when the list is reordered.

---

## Props flow

Props flow one way: parent to child. When the parent re-renders (e.g. after `setState()`),
`reconcileChildren()` calls `child.updateProps(newProps)` on each existing child. The child
only re-renders if the props actually changed (existing `updateProps` diffs via JSON comparison).

Inside a child, access props via `this.props`:

```js
export class UserCard extends BaseComponent {
  getTemplate() {
    const { user } = this.props;
    return `
      <div class="user-card">
        <strong>${user.name}</strong>
        <p>${user.email}</p>
        <button data-action="toggle">
          ${this.state.expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>`;
  }

  getMethods() {
    return {
      toggle: () => this.setState({ expanded: !this.state.expanded })
    };
  }
}
```

`this.state.expanded` persists across parent re-renders — the child's state is never reset by
the parent unless the child is destroyed (its host removed from the template).

---

## Child lifecycle

Children follow the same lifecycle as route components:

| Hook | When it fires |
|---|---|
| `onInit()` | After first mount — fetch data, set up subscriptions |
| `onRender()` | After every render (including re-renders from `setState`) |
| `onDestroy()` | Just before the child is destroyed |
| `getLifecycle().onMount()` | After the first `init()` completes |
| `getLifecycle().onUnmount()` | Before the child is destroyed |

---

## Event isolation

Each component's event delegation is scoped to its own wrapper element. A `data-action` click
inside a child is handled **only** by that child's `getMethods()`. It does not bubble up to
trigger the parent's actions. This means parents and children can use the same action names
without conflict.

```js
// Parent and child both have a 'remove' action — no conflict
parent.getMethods() = { remove: () => this.removeUser() }
child.getMethods()  = { remove: () => this.setState({ collapsed: true }) }
```

---

## Referencing children by registered name

If a component was registered via `app.initialize({ components: { 'nav-bar': NavBar } })`, you
can reference it by name instead of importing the class directly:

```js
getTemplate() {
  return `
    <header>
      ${this.child('nav-bar', { active: '/home' })}
    </header>
    <main>...</main>`;
}
```

This is useful when you want loose coupling between a parent and its children.

---

## Nesting children in children

Children can themselves use `this.child()` to embed grandchildren. The `app` reference and
component resolver are propagated down the tree automatically, so `this.service()`, `this.icon()`,
and `this.child('by-name')` all work at any depth.

---

## Teardown

When a parent component is destroyed (e.g. when a route unmounts), all of its children are
automatically destroyed too, recursively. You don't need to manage child teardown manually.

---

## Common patterns

### Conditional child

```js
getTemplate() {
  return `
    <div>
      ${this.state.showModal ? this.child(ConfirmModal, { onConfirm: () => this.confirm() }) : ''}
      <button data-action="open">Open</button>
    </div>`;
}
```

When `showModal` becomes `false` after a `setState()`, the modal's host is removed from the
template, `reconcileChildren()` detects it has no host, and calls `onUnmount` + `destroy()`.

### Communication: child to parent via EventBus

Children can emit events via `this.emit('my:event', data)` and parents subscribe to them:

```js
// child
getMethods() {
  return {
    select: (e, target) => this.emit('item:selected', { id: this.props.item.id })
  };
}

// parent (in onInit or setupEventListeners)
setupEventListeners() {
  this.subscribe('item:selected', ({ id }) => {
    this.setState({ selectedId: id });
  });
}
```

---

## Gotchas

- **Don't call `this.child()` outside `getTemplate()`** — the spec buffer is reset at the start
  of each render, so specs collected outside render are lost.
- **Keys must be unique within a parent** — two children with the same key will conflict.
- **Async children in `getTemplate()`** — `getTemplate()` is synchronous. If a child needs async
  setup, put the async work in `onInit()` and use `setState()` to trigger a re-render once done.
- **Direct DOM manipulation in children** — avoid it. Go through `setState()` and let the morph
  handle updates, or use `onRender()` for post-render DOM queries.
