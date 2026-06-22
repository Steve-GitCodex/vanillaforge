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
