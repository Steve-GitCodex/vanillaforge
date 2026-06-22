# VanillaForge — Developer & Maintainer Guide

This document is for the owner and any future contributors returning to VanillaForge after time
away. It answers "where does everything live, how does it fit together, and what's next?"

---

## Vision

VanillaForge is a **batteries-included, zero-dependency SPA framework** built entirely on vanilla
JavaScript. The goal is that a developer can build a real, production-ready app without reaching
for Font Awesome, Tailwind, Bootstrap, Google Fonts, SweetAlert, or any other external UI
library — while still being free to drop in those libraries if they want to.

Every subsystem (icons, CSS/theming, alerts, fonts) is implemented as a **plugin** so it can be
replaced, overridden, or skipped entirely.

---

## Picking up after a long break

Do this in order:

1. Read this file top-to-bottom (15 min).
2. Read `docs/roadmap.md` — one section describes where we left off and what's next.
3. `npm test` — all tests should pass; if something is broken, fix it before adding features.
4. `npm run lint` — 0 errors required.
5. Open `src/framework.js` for the top-level public API, then `src/components/base-component.js`
   for the component model. Those two files are the frame around everything else.
6. Check `CLAUDE.md` — this is the AI-assistant coding guide; follow the same rules manually.

---

## Architecture map

```
createApp(config)
  └─ FrameworkApp
       ├─ _services Map          <- plugin service registry (icons, theme, alerts, ...)
       ├─ eventBus               <- pub/sub, the nervous system
       ├─ router                 <- History-API client routing
       ├─ componentManager       <- mounts/unmounts route components
       ├─ errorHandler           <- centralized error + notification
       └─ use(plugin) / get(name) / provide(name, svc) <- plugin API

BaseComponent (extends by user components)
  ├─ getTemplate()               <- returns HTML string; call this.child() inside it
  ├─ getMethods()                <- { actionName: fn } wired to data-action/input/change/...
  ├─ setState(patch)             <- merges state, re-renders via morph
  ├─ child(Class|name, props, key) <- declare a child component in the template
  ├─ service(name)               <- reach a plugin service (e.g. this.service('icons'))
  └─ icon(name, opts)            <- shortcut for this.service('icons').render(name, opts)

DOM render pipeline (per re-render):
  getTemplate()            <- HTML string with host placeholders for children
       |
  morph(element, html)     <- surgical DOM diff; host elements are opaque boundaries
       |
  reconcileChildren()      <- mounts new children, updates existing, destroys removed
```

---

## Plugin / service system

Every subsystem lives in `src/plugins/<name>/`. A plugin is an object with a `name` and an
`install(app, options)` method (or just a function `(app, options) => void`).

### Writing a plugin

```js
// src/plugins/my-thing/my-thing-plugin.js
export class MyThingService {
  doSomething() { return 'done'; }
}

export const myThingPlugin = {
  name: 'my-thing',
  install(app, options = {}) {
    app.provide('my-thing', new MyThingService(options));
  }
};
```

### Installing a plugin

```js
import { createApp, iconsPlugin } from './src/framework.js';
import { myThingPlugin } from './src/plugins/my-thing/my-thing-plugin.js';

const app = createApp({ debug: true });
app.use(iconsPlugin);               // built-in icons
app.use(myThingPlugin, { opt: 1 }); // your plugin
```

### Reaching a service from a component

```js
getMethods() {
  return {
    save: () => {
      const svc = this.service('my-thing');
      if (svc) svc.doSomething();
    }
  };
}
```

Or in a template:

```js
getTemplate() {
  return `<button>${this.icon('check')} Save</button>`;
}
```

### Overriding a built-in service

```js
app.provide('icons', myCustomIconsService); // replaces the default
```

---

## Component composition

A parent component can embed child components directly in its template:

```js
import { UserCard } from './user-card.js';

getTemplate() {
  return `
    <div class="users">
      ${this.state.users.map(u =>
        this.child(UserCard, { user: u }, u.id)
      ).join('')}
    </div>`;
}
```

How it works:
- `child()` emits a `<div data-vf-host="..." data-key="..."></div>` placeholder and records
  the spec.
- After the morph, `reconcileChildren()` mounts new children, updates props for existing ones,
  and destroys children whose host was removed.
- The morph treats host elements as opaque — it never recurses into a child's DOM, so child
  internal state survives parent re-renders.
- Each child's event delegation is scoped to its own wrapper, so clicks in a child don't
  bubble up to the parent's delegated listener.

See `docs/composition.md` for the full guide.

---

## Conventions

These also live in `CLAUDE.md` (the AI guide). Follow them manually too:

- **No emojis** anywhere in code, logs, comments, commit messages, or UI copy.
- **2-space indentation**, **single quotes** in JS.
- **No manual DOM listeners** in components — use `data-action`, `data-input`, `data-change`,
  `data-keydown`, `data-submit` attributes + `getMethods()`.
- **No innerHTML replacement** for updates — always go through `setState()` + the morph.
- **No runtime dependencies** — keep the framework dependency-free (dev-only tooling is fine).
- Run `npm test && npm run lint && npm run build` before committing anything.

---

## Commands

| Command | What it does |
|---|---|
| `npm test` | Vitest unit tests (happy-dom) |
| `npm run test:watch` | Watch mode |
| `npm run lint` | ESLint (must be 0 errors) |
| `npm run format` | Prettier |
| `npm run build` | esbuild bundle to dist/ |
| `npm run dev` | Build + serve dist/ on port 3000 |
| `npm run example` | Todo-app example on port 3001 |
| `npm run example:router` | Router + composition example on port 3002 |
| `npm run css:discover` | Report missing component CSS |
| `npm run css:generate` | Auto-generate CSS stubs |

---

## Directory tour

```
src/
  app.js                   <- demo bootstrap (not the library entry point)
  framework.js             <- public API re-exports + FrameworkApp + createApp
  components/
    base-component.js      <- BaseComponent (all user components extend this)
  core/
    component-manager.js   <- mounts/unmounts components into DOM containers
    router.js              <- History-API SPA routing
    dom-morph.js           <- focus-preserving DOM diff (the render engine)
    event-bus.js           <- pub/sub event system
  plugins/
    icons/
      icons-plugin.js      <- IconsService + iconsPlugin (install with app.use())
      default-icons.js     <- ~20 built-in inline SVG icon paths
  utils/
    logger.js              <- contextual logger with child() factory
    error-handler.js       <- centralized error handling + user notifications
    notification.js        <- toast + modal UI
    validation.js          <- email/phone/currency validators
    performance.js         <- debounce, throttle, lazy-load, cache, measure
    ...

examples/
  todo-app/               <- standalone single-component SPA (no build needed)
  router-app/             <- multi-component app with composition + icons

tests/                    <- Vitest test suites
docs/                     <- markdown documentation
scripts/
  build.js                <- esbuild + CSS auto-discovery
  css-discovery.js        <- scan for missing component CSS
```

---

## What's next

See `docs/roadmap.md` for a detailed, prioritized list of upcoming features. Short version:

1. **CSS / theming plugin** — design tokens + utility styles, replacing Tailwind/Bootstrap
2. **Alerts plugin** — fold the existing Notification + SweetAlert into the plugin pattern
3. **Self-hosted fonts plugin** — replace Google Fonts
4. **Fast onboarding** — scaffold CLI, starter templates, TypeScript types
5. **Signals reactivity** — fine-grained updates (roadmap already flagged in dom-morph.js)
6. **Data + shared state** — route loaders, global store
7. **npm publish** — when the API is stable
