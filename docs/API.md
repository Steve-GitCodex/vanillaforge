# VanillaForge API Reference

---

## createApp()

```js
import { createApp } from 'vanillaforge';

const app = createApp({
  appName: 'My App',     // optional display name
  mountId: 'main-content', // DOM id for route mount point (default: 'main-content')
  debug: false,          // verbose logging
  router: {
    mode: 'history',     // 'history' (default) or 'hash'
    basePath: '',        // URL prefix for GitHub Pages / subdirectory deploys
    fallback: '/404',    // route shown when no match found
  },
});
```

### Plugin system

```js
app.use(iconsPlugin);                           // install a plugin
app.use(themePlugin, { tokens: { primary: '#3b82f6' } }); // with options
app.provide('myService', instance);             // register a custom service
app.get('theme');                               // retrieve a service by name
```

`app.use()` is idempotent — calling it twice with the same plugin is a no-op.

### Startup

```js
await app.initialize({
  routes: {
    '/': HomeComponent,
    '/users/:id': UserDetailComponent,
  },
  // components: { name: Class }  — named registry for this.child('name') lookups
});
await app.start();
```

### Navigation

```js
app.navigate('/users/42');
```

---

## BaseComponent

All components extend `BaseComponent`. Set `this.name` and `this.state` in the
constructor; implement `getTemplate()`.

```js
import { BaseComponent } from 'vanillaforge';

export class CounterComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'counter';
    this.state = { count: 0 };
  }

  getTemplate() {
    return `<div>
      <p>Count: <strong>${this.state.count}</strong></p>
      <button data-action="increment">+</button>
    </div>`;
  }

  getMethods() {
    return {
      increment: () => this.setState({ count: this.state.count + 1 }),
    };
  }
}
```

### Declarative event binding

Wire DOM events to `getMethods()` entries with `data-*` attributes — no manual
`addEventListener` needed. Listeners are delegated to the component root and
cleaned up automatically on destroy.

| Attribute      | DOM event | Typical use                 |
| -------------- | --------- | --------------------------- |
| `data-action`  | `click`   | buttons, links              |
| `data-change`  | `change`  | checkboxes, radios, selects |
| `data-input`   | `input`   | text inputs, textareas      |
| `data-keydown` | `keydown` | keyboard shortcuts          |
| `data-submit`  | `submit`  | forms                       |

Handlers receive `(event, matchedElement)`.

```html
<button data-action="save">Save</button>
<input data-input="onSearch" placeholder="Search...">
<select data-change="setFilter">...</select>
<form data-submit="handleForm">...</form>
```

### setState()

```js
this.setState({ count: 5 });              // merge patch + re-render (DOM morph)
this.setState({ count: 5 }, false);       // update state silently, no re-render
```

Re-renders are applied via the DOM morph — only changed nodes are touched.

### Lifecycle hooks

```js
async onInit() {
  // runs once before the first render; good for data fetching and subscriptions
}

getLifecycle() {
  return {
    onMount:   () => { /* after the component's DOM is in the page */ },
    onUnmount: () => { /* before the component is removed; clean up here */ },
  };
}
```

### Accessing services

```js
this.service('store');   // StoreService (when storePlugin is installed)
this.service('alerts');  // AlertsService
this.service('theme');   // ThemeService
this.service('icons');   // IconsService
this.service('fonts');   // FontsService
```

Returns `null` when the service is not installed, so templates degrade
gracefully without explicit null checks.

### Icons shortcut

```js
this.icon('plus', { size: 16 });   // renders an inline SVG string
this.icon('trash');                // default size 24
```

### Component composition

Embed child components declaratively from `getTemplate()`:

```js
getTemplate() {
  return `<div>
    ${this.child(UserCardComponent, { user: this.state.user })}
    ${this.state.items.map((it, i) =>
      this.child(ItemComponent, { item: it }, it.id)
    ).join('')}
  </div>`;
}
```

`this.child(ClassOrName, props, key)` returns a placeholder that the framework
replaces with the mounted child after each render. The `key` argument is used
for stable list reconciliation.

### Signals (fine-grained reactivity)

```js
constructor(eventBus, props) {
  super(eventBus, props);
  this.count = this.signal(0);   // reactive value linked to this component
}

getTemplate() {
  return `<div>
    <p>${this.count.value}</p>
    <button data-action="inc">+</button>
  </div>`;
}

getMethods() {
  return {
    inc: () => this.count.set(this.count.value + 1),
  };
}
```

`signal.set()` schedules a single batched morph re-render via microtask —
multiple calls in the same synchronous block produce one render. Signals are
destroyed automatically when the component is destroyed.

Standalone signals (without a component) are also supported:

```js
import { Signal } from 'vanillaforge';

const count = new Signal(0);
const unsub = count.subscribe((value) => console.log(value));
count.set(1);   // → logs 1
unsub();
```

### EventBus

```js
// from a component:
this.emit('cart:updated', { total: 42 });
const unsub = this.on('cart:updated', (data) => { ... });

// from app-level code:
app.eventBus.emit('event', data);
const unsub = app.eventBus.on('event', handler);
app.eventBus.once('event', handler);   // auto-unsubscribes after first delivery
app.eventBus.off('event', handler);
```

---

## Routing

### Static and dynamic routes

```js
await app.initialize({
  routes: {
    '/':           HomeComponent,
    '/about':      AboutComponent,
    '/users/:id':  UserDetailComponent,   // :id captured in this.props.id
  },
});
```

Route params are available as `this.props.route.params` inside the matched component.

### Route loaders

A `loader` function can be attached to any route. It runs asynchronously before the
component mounts; its return value is passed to the component as `this.props.data`.

```js
await app.initialize({
  routes: {
    '/users/:id': {
      component: UserDetailComponent,
      loader: async ({ params, path }) =>
        fetch(`/api/users/${params.id}`).then(r => r.json()),
    },
    '/dashboard': {
      component: DashboardComponent,
      loader: async () => Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json()),
      ]).then(([stats, alerts]) => ({ stats, alerts })),
    },
  },
});
```

Inside the component the data is ready before `getTemplate()` is called for the first time:

```js
getTemplate() {
  const user = this.props.data;
  if (!user) return `<p>Failed to load user.</p>`;
  return `<h1>${user.name}</h1><p>${user.email}</p>`;
}
```

If the loader throws, the error is logged and the component still mounts with
`this.props.data === undefined` so it can show an appropriate fallback state.

### Navigation guard

```js
app.router.beforeNavigation((route, path) => {
  if (path.startsWith('/admin') && !isLoggedIn) {
    app.navigate('/login');
    return false;   // cancel navigation
  }
  return true;
});
```

### GitHub Pages / subdirectory deploys

```js
const app = createApp({
  router: { basePath: '/my-repo' },
});
```

---

## Built-in plugins

See [plugins.md](plugins.md) for full details on each plugin.

### iconsPlugin

```js
import { iconsPlugin } from 'vanillaforge';
app.use(iconsPlugin);

// in a component:
this.icon('plus', { size: 16, title: 'Add item' });

// register a custom icon:
app.get('icons').register('logo', '<path d="..."/>');

// list all icon names:
app.get('icons').list();
```

Built-in names: `check`, `close`, `trash`, `plus`, `minus`, `menu`,
`chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `search`,
`info`, `warning`, `edit`, `arrow-up`, `arrow-down`, `home`, `user`,
`settings`, `external-link`.

### themePlugin

```js
import { themePlugin } from 'vanillaforge';
app.use(themePlugin, {
  tokens: { primary: '#3b82f6', radius: '8px' },
  base: true,   // inject base stylesheet (.vf-btn, .vf-card, etc.)
});

// live-update tokens:
app.get('theme').setTokens({ primary: '#ef4444' });
app.get('theme').getToken('primary');   // '#ef4444'
```

Tokens are injected as `--vf-<kebab-case>` CSS custom properties on `:root`.
Base stylesheet classes: `.vf-btn`, `.vf-btn-primary`, `.vf-btn-secondary`,
`.vf-btn-danger`, `.vf-btn-success`, `.vf-card`, `.vf-icon`.

### alertsPlugin

```js
import { alertsPlugin } from 'vanillaforge';
app.use(alertsPlugin);

// in a component:
const alerts = this.service('alerts');
alerts.success('Saved!');
alerts.error('Something went wrong.');
alerts.warning('Check your input.');
alerts.info('Here is some info.');

const confirmed = await alerts.confirm('Delete this item?', {
  danger: true,
  confirmText: 'Delete',
  cancelText: 'Keep',
});
```

### fontsPlugin

```js
import { fontsPlugin } from 'vanillaforge';
app.use(fontsPlugin, {
  families: ['Inter', 'JetBrains Mono'],
  // or with weight filtering:
  // families: [{ name: 'Inter', weights: [400, 700] }],
});
```

Bundled families: `Inter`, `JetBrains Mono`. Both are embedded as
Latin-subset variable-weight woff2 data URIs — no external requests.

### storePlugin

```js
import { storePlugin } from 'vanillaforge';
app.use(storePlugin);

// in a component:
const store = this.service('store');
store.set('user', { name: 'Alice' });
store.get('user');                       // { name: 'Alice' }
store.delete('user');
store.keys();                            // ['user', ...]

// per-key subscription (returns unsubscribe):
const unsub = store.subscribe('user', (value, prev) => { ... });

// subscribe to all writes:
store.subscribeAll((key, value, prev) => { ... });
```

The store also emits on the shared EventBus:

```js
app.eventBus.on('store:change', ({ key, value, prev }) => { ... });
app.eventBus.on('store:change:user', ({ value, prev }) => { ... });
```

---

## Writing a custom plugin

```js
const myPlugin = {
  name: 'my-plugin',
  install(app, options = {}) {
    app.provide('myService', {
      greet: (name) => `Hello, ${name}!`,
    });
  },
};

app.use(myPlugin, { /* options */ });

// in a component:
this.service('myService').greet('World');
```
