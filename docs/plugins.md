# Plugin System

VanillaForge's plugin system lets you register, replace, or extend framework services — icons,
theming, alerts, fonts, or anything else — without touching the framework core.

---

## Installing a plugin

```js
import { createApp, iconsPlugin } from './src/framework.js';

const app = createApp({ debug: true });

app.use(iconsPlugin);                          // default options
app.use(iconsPlugin, { icons: { logo: '...' } }); // with options
await app.initialize({ routes, components });
await app.start();
```

`app.use()` is idempotent — calling it twice with the same plugin (identified by `plugin.name`)
logs a warning and skips the second install. It is chainable:

```js
app.use(iconsPlugin).use(myOtherPlugin);
```

---

## Reaching a service from a component

Once a plugin registers a service via `app.provide()`, any component can access it:

```js
// Generic access
const svc = this.service('icons');

// Icons shortcut (built-in helper)
const svg = this.icon('check', { size: 18 });
```

Both return `null`/`''` when the service is absent, so templates degrade gracefully without
needing `if` checks everywhere.

---

## Built-in icons plugin

The icons plugin ships with VanillaForge and provides ~20 inline SVG icons so you don't need
Font Awesome or any external icon library.

### Install

```js
import { createApp, iconsPlugin } from './src/framework.js';

const app = createApp({ ... });
app.use(iconsPlugin);
```

### Use in a component

```js
getTemplate() {
  return `
    <button data-action="save">
      ${this.icon('check', { size: 18 })} Save
    </button>
    <button data-action="remove">
      ${this.icon('trash', { size: 18 })} Delete
    </button>`;
}
```

### Available icons

| Name | Description |
|---|---|
| `check` | Checkmark |
| `close` | X (close/dismiss) |
| `trash` | Delete |
| `plus` | Add |
| `minus` | Remove / collapse |
| `menu` | Hamburger menu |
| `chevron-right` | Navigate forward |
| `chevron-left` | Navigate back |
| `chevron-down` | Expand |
| `chevron-up` | Collapse |
| `search` | Search/find |
| `info` | Informational |
| `warning` | Alert / caution |
| `edit` | Edit / pencil |
| `arrow-left` | Back |
| `arrow-right` | Forward |
| `home` | Home |
| `user` | Profile / account |
| `settings` | Settings / gear |
| `external-link` | Open in new tab |

### `icon(name, options)` options

| Option | Type | Default | Description |
|---|---|---|---|
| `size` | `number` | `24` | Width and height in pixels |
| `className` | `string` | `''` | Extra CSS class on the `<svg>` element |
| `title` | `string` | — | Adds a `<title>` and `role="img"` for accessibility |
| `color` | `string` | — | Inline color override (default inherits `currentColor`) |

### Adding custom icons

```js
app.use(iconsPlugin, {
  icons: {
    logo: '<path d="M12 2 L22 12 L12 22 L2 12 Z" fill="currentColor"/>',
    star:  '<polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="currentColor"/>',
  }
});
```

Or add icons after install:

```js
app.get('icons').register('star', '<polygon points="..."/>');
```

### Replacing the icons service entirely

```js
// Bring your own icon renderer
app.provide('icons', {
  render: (name, opts) => `<i class="fa fa-${name}"></i>` // Font Awesome wrapper
});
// this.icon() in components still works — it calls your render() method
```

---

## Built-in fonts plugin

The fonts plugin ships self-hosted, Latin-subset variable fonts as bundled data URIs — no
external requests, no Google Fonts, no file setup required.

### Install (zero config)

```js
import { createApp, fontsPlugin } from './src/framework.js';

const app = createApp({ ... });
app.use(fontsPlugin, { families: ['Inter', 'JetBrains Mono'] });
```

This injects `@font-face` declarations into `<head>` for both families, covering all weights
and both normal and italic styles.

### Select specific weights or styles

```js
app.use(fontsPlugin, {
  families: [
    { name: 'Inter', weights: [400, 700] },
    { name: 'JetBrains Mono', styles: ['normal'] },
  ],
});
```

For variable fonts, `weights` is treated as a `[min, max]` range — passing `[400, 700]`
generates `font-weight: 400 700`.

### Serve your own font files

```js
app.use(fontsPlugin, {
  families: ['Inter'],
  path: '/assets/fonts',  // disables bundled data URIs; uses URL paths instead
});
// -> url('/assets/fonts/Inter-Variable.woff2')
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `families` | `Array` | `[]` | Font families to load. See below for shape. |
| `path` | `string` | — | URL base for external font files. Omit to use bundled data URIs. |
| `display` | `string` | `'swap'` | CSS `font-display` value. |

Each entry in `families` can be a plain string (`'Inter'`) or a descriptor object:

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Font family name (must match a bundled family or one added via `addFamily()`). |
| `weights` | `number[]` | Subset of weights. Variable fonts: min/max of the array. |
| `styles` | `string[]` | `['normal']`, `['italic']`, or `['normal', 'italic']` (default). |

### Bundled families

| Name | Weights | Styles | Theme token |
|---|---|---|---|
| `'Inter'` | 100–900 (variable) | normal, italic | `--vf-font-sans` |
| `'JetBrains Mono'` | 100–800 (variable) | normal, italic | `--vf-font-mono` |

### Theme token integration

When `themePlugin` is also installed, loading Inter automatically sets `--vf-font-sans`
to `'Inter', system-ui, ...`, and loading JetBrains Mono sets `--vf-font-mono`:

```js
app.use(themePlugin);
app.use(fontsPlugin, { families: ['Inter'] });
// --vf-font-sans is now: 'Inter', system-ui, -apple-system, ...
```

### Accessing the service

```js
const fonts = app.get('fonts');          // FontsService instance
fonts.getFamilies();                     // ['Inter', 'JetBrains Mono']
```

### Registering a custom font family

```js
app.get('fonts').addFamily('MyFont', {
  cssFamily: 'MyFont',
  variable: false,
  weights: [400, 700],
  styles: ['normal'],
  filename: (weight) => `MyFont-${weight}.woff2`,
  // dataUri: (style) => '...'  // optional; omit to use path-based URL
});
```

`addFamily()` returns the service for chaining. Custom families without a bundled data URI
are served from the `path` option passed at install time.

---

## Built-in theme plugin

The theme plugin injects `--vf-*` CSS custom properties onto `:root` and provides a base
stylesheet with utility classes.

### Install

```js
import { createApp, themePlugin } from './src/framework.js';

const app = createApp({ ... });
app.use(themePlugin);
// or override tokens:
app.use(themePlugin, { tokens: { primary: '#0070f3' } });
```

### Design tokens (20 defaults)

All tokens are injected as `--vf-<kebab-case>`. Token names in JS use camelCase:
`textMuted` → `--vf-text-muted`, `radiusSm` → `--vf-radius-sm`.

| Token | CSS variable | Default |
|---|---|---|
| `primary` | `--vf-primary` | `#3b82f6` |
| `primaryDark` | `--vf-primary-dark` | `#2563eb` |
| `secondary` | `--vf-secondary` | `#6b7280` |
| `surface` | `--vf-surface` | `#ffffff` |
| `background` | `--vf-background` | `#f4f5f7` |
| `text` | `--vf-text` | `#1f2933` |
| `textMuted` | `--vf-text-muted` | `#7b8794` |
| `border` | `--vf-border` | `#e5e7eb` |
| `danger` | `--vf-danger` | `#ef4444` |
| `success` | `--vf-success` | `#10b981` |
| `warning` | `--vf-warning` | `#f59e0b` |
| `radius` | `--vf-radius` | `6px` |
| `radiusSm` | `--vf-radius-sm` | `4px` |
| `radiusLg` | `--vf-radius-lg` | `12px` |
| `fontSans` | `--vf-font-sans` | `system-ui, -apple-system, ...` |
| `fontMono` | `--vf-font-mono` | `"JetBrains Mono", "Fira Code", monospace` |
| `shadowSm` | `--vf-shadow-sm` | `0 1px 3px rgba(0,0,0,.08)` |
| `shadowMd` | `--vf-shadow-md` | `0 4px 16px rgba(0,0,0,.08)` |
| `shadowLg` | `--vf-shadow-lg` | `0 10px 30px rgba(0,0,0,.12)` |
| `space` | `--vf-space` | `4px` |

### Service API

```js
const theme = app.get('theme');
theme.setTokens({ primary: '#0070f3', radius: '4px' }); // live update
theme.getToken('primary'); // '#0070f3'
```

### Base stylesheet classes

| Class | Description |
|---|---|
| `.vf-card` | Bordered, shadowed card container |
| `.vf-btn` | Base button |
| `.vf-btn-primary` | Primary action button |
| `.vf-btn-secondary` | Secondary action button |
| `.vf-btn-danger` | Destructive action button |
| `.vf-btn-success` | Positive action button |
| `.vf-icon` | Inline icon sizing helper |

Skip the base stylesheet with `app.use(themePlugin, { base: false })`.

---

## Built-in alerts plugin

The alerts plugin provides auto-dismissing toasts and promise-based confirm dialogs.

### Install

```js
import { createApp, alertsPlugin } from './src/framework.js';

const app = createApp({ ... });
app.use(alertsPlugin);
```

### Toasts

```js
const alerts = app.get('alerts');
alerts.success('Saved');
alerts.error('Something went wrong');
alerts.warning('Low disk space');
alerts.info('New version available');
```

Toasts auto-dismiss after a few seconds and slide in from the top-right. The oldest toast
is silently removed when the `maxToasts` cap is reached (default: 5).

### Confirm dialog

```js
const confirmed = await app.get('alerts').confirm('Delete this item?', {
  danger: true,
  confirmText: 'Delete',
  cancelText: 'Keep',
});

if (confirmed) {
  // user clicked Delete
}
```

Callbacks are also supported:

```js
app.get('alerts').confirm('Are you sure?', {
  onConfirm: () => doDelete(),
  onCancel:  () => console.log('cancelled'),
});
```

### Options for `confirm()`

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | — | Optional heading above the message. |
| `danger` | `boolean` | `false` | Styles the confirm button as destructive (red). |
| `confirmText` | `string` | `'Confirm'` | Confirm button text. |
| `cancelText` | `string` | `'Cancel'` | Cancel button text. |
| `onConfirm` | `function` | — | Called when the user confirms (in addition to the Promise). |
| `onCancel` | `function` | — | Called when the user cancels. |

Injected styles use `--vf-*` tokens when `themePlugin` is installed; plain-CSS fallbacks are
provided when it is absent.

---

## Writing your own plugin

A plugin is an object with a `name` and `install(app, options)` method:

```js
// src/plugins/analytics/analytics-plugin.js

class AnalyticsService {
  track(event, data = {}) {
    console.log('[analytics]', event, data);
    // Send to your analytics provider here
  }
}

export const analyticsPlugin = {
  name: 'analytics',

  install(app, options = {}) {
    const service = new AnalyticsService(options);
    app.provide('analytics', service);

    // Optional: auto-track route changes
    app.get('eventBus').on('router:navigated', ({ path }) => {
      service.track('page_view', { path });
    });
  }
};
```

Install it:

```js
app.use(analyticsPlugin, { endpoint: '/api/events' });
```

Use it from any component:

```js
getMethods() {
  return {
    buy: () => {
      this.service('analytics')?.track('purchase', { item: this.props.item });
      this.emit('cart:add', this.props.item);
    }
  };
}
```

---

## Store plugin

The store plugin provides a shared, reactive key/value store that any component or plugin can
read, write, and subscribe to — no prop-drilling required.

### Install

```js
import { createApp, storePlugin } from './src/framework.js';

const app = createApp({ ... });
app.use(storePlugin);
```

### Reading and writing

```js
// From any component:
const store = this.service('store');

store.set('cart', [{ id: 1, qty: 2 }]);   // write
store.get('cart');                          // read → current value
store.delete('cart');                       // remove
store.keys();                               // → ['cart', ...]
```

Writes are no-ops when the value is identical (uses `Object.is` equality), so subscribers
are never notified needlessly.

### Subscribing to changes

```js
// Per-key subscription
const unsub = store.subscribe('cart', (value, prev) => {
  this.setState({ cart: value });
});
unsub(); // stop listening

// Subscribe to all changes
const unsub = store.subscribeAll((key, value, prev) => {
  console.log(key, 'changed from', prev, 'to', value);
});
```

### EventBus events

The store also emits on the shared EventBus so any code can react without holding a
store reference:

```js
app.eventBus.on('store:change', ({ key, value, prev }) => { ... });
app.eventBus.on('store:change:cart', ({ value, prev }) => { ... });
```

### Example — cross-component cart

```js
// CartButton writes:
getMethods() {
  return {
    addItem: () => {
      const store = this.service('store');
      const current = store.get('cart') ?? [];
      store.set('cart', [...current, this.props.item]);
    }
  };
}

// CartSummary reads and reacts:
async onInit() {
  const store = this.service('store');
  this._unsub = store.subscribe('cart', (items) => {
    this.setState({ count: items.length });
  });
}

getLifecycle() {
  return {
    onUnmount: () => this._unsub?.(),
  };
}
```

---

## Plugin rules

- A plugin must either be a `function(app, options) => void` or an object with
  `{ name: string, install(app, options): void }`.
- Plugins with a `name` are deduplicated — installing the same plugin twice is safe (second
  call is silently skipped).
- Plugins can call `app.provide()`, `app.get()`, `app.componentManager.registerComponent()`,
  or subscribe to events.
- Install plugins **before** `app.initialize()` if they need to register components, or any
  time if they only register services.
- A later `app.use()` or `app.provide()` with the same service name **replaces** the earlier
  one, so third-party overrides always win.
