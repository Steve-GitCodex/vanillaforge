# VanillaForge — Roadmap

This is the living plan for VanillaForge's evolution toward a batteries-included framework where
developers don't need Font Awesome, Tailwind, Bootstrap, Google Fonts, or SweetAlert — while
remaining free to bring those libraries in if they want to.

Every item below plugs into the **plugin/service registry** added in v1.1. See
`DEVELOPMENT.md` for how to write a plugin.

---

## Done (v1.9.2 — security + quality hardening)

### HTML escaping primitive
- `escapeHtml(value)` — canonical HTML escape for `& < > " '`; null/undefined → `''`.
- `RawHtml` class — wraps a trusted string so the `html` tag passes it through unchanged.
- `raw(value)` — convenience factory for `RawHtml`.
- `html` tagged template — auto-escapes every interpolation; `RawHtml` values pass through.
- `this.icon()` and `this.child()` now return `RawHtml`, so they are safe in both plain
  template literals (via `toString()`) and `html` tagged templates (no double-escaping).
- All three exported from `vanillaforge`: `import { html, raw, escapeHtml } from 'vanillaforge'`.
- Full TypeScript generics added to `types/index.d.ts`.
- `components.md` updated with an "Escaping and XSS" section; `README.md` updated with
  a "Security" section and CSP note.

### Security fixes
- **notification.js `showModal`:** `title`, `message`, `details`, and button labels are now
  escaped with `escapeHtml` before injection into `innerHTML`; button `action` values are
  sanitised before use as CSS selectors. Closes the default-reachable XSS in the legacy
  error notification path.
- **Router param decoding:** dynamic route segments are now decoded with `decodeURIComponent`
  (with a safe fallback for malformed input). `/users/John%20Doe` → `params.id === 'John Doe'`.
  `router.md` updated with a note on decoded params and the escaping requirement.
- **app.js error fallback:** replaced the inline `onclick="location.reload()"` (CSP-hostile)
  with a programmatically created button + `addEventListener`.

### Quality fixes
- **event-bus `getListeners()` / `getStats()`:** fixed a crash (`this.onceListeners` was never
  defined). Both methods now derive their data from the single `this.listeners` Map, splitting
  by the `once` flag on each listener entry.
- **`SweetAlert` deprecated:** `src/utils/sweet-alert.js` now carries a `@deprecated` JSDoc
  banner pointing users to `alertsPlugin`. The class and its export are preserved until v2.0.
- **`String.prototype.substr` removed:** replaced with `slice` in `base-component.js` and
  `error-handler.js`.
- **`base-component.js` formatting:** fixed glued JSDoc/signatures and a stray `}}` at end
  of `cleanup()`.
- **Shared `escapeHtml`:** the private duplicate copies in `icons-plugin.js` and
  `alerts-plugin.js` have been replaced with an import from the shared `utils/html.js`.

### Dev-dependency audit
- `npm audit fix` applied; runtime audit remains at 0 vulnerabilities.
  One remaining moderate in `http-server` (dev-only, never shipped) requires a
  breaking upgrade and is deferred.

---

## Deferred to v2.0

### Remove deprecated `SweetAlert` wrapper
- Delete `src/utils/sweet-alert.js`, `src/styles/components/sweet-alert.css`, and the
  `SweetAlert` export from `src/framework.js`. This is a breaking change and is bundled
  into the 2.0 major release.

### Stricter Content Security Policy support
- Eliminate `style-src 'unsafe-inline'` requirement by moving theme/alerts/fonts injected
  styles to adoptedStyleSheets (CSSStyleSheet constructor) or a nonce-based approach.

### Version string single-sourcing
- Remove hardcoded version strings from `home-component.js` and `framework.js`; derive
  them from `package.json` at build time.

---

## Done (v1.4)

### Self-hosted fonts plugin
- `fontsPlugin` — install with `app.use(fontsPlugin, { families: ['Inter', 'JetBrains Mono'] })`.
- Inter and JetBrains Mono bundled as Latin-subset, variable-weight woff2 data URIs —
  zero external requests, works out of the box.
- Weight and style filtering: `{ name: 'Inter', weights: [400, 700], styles: ['normal'] }`.
- `path` option to serve your own font files instead of the bundled data URIs.
- Custom family registration via `FontsService.addFamily(name, manifest)`.
- Theme token integration: loads Inter → updates `--vf-font-sans`; loads JetBrains Mono →
  updates `--vf-font-mono` (no-op when themePlugin is absent).
- `getFamilies()` — returns CSS family names of all loaded fonts.
- Idempotent style element: reuses `<style id="vf-fonts">` rather than duplicating it.
- Exported from `src/framework.js` as `fontsPlugin` + `FontsService`.

---

## Done (v1.3)

### Alerts / notification plugin
- `alertsPlugin` — install with `app.use(alertsPlugin)`.
- `success()`, `error()`, `warning()`, `info()` — auto-dismissing slide-in toasts.
- `confirm(message, opts)` — modal dialog returning `Promise<boolean>`; optional
  `onConfirm`/`onCancel` callbacks, `danger` variant, custom button labels.
- Injected styles use `--vf-*` tokens; plain-CSS fallbacks when themePlugin absent.
- Backward-compat `showToast`/`showModal` interface wires into `ErrorHandler`.
- `maxToasts` cap — oldest toast silently removed when exceeded.

---

## Done (v1.2)

### CSS / theming plugin
- `themePlugin` — install with `app.use(themePlugin)` or with token overrides.
- 20 default design tokens injected as `--vf-*` CSS custom properties on `:root`.
- Token names: camelCase in JS → `--vf-kebab-case` in CSS.
- `ThemeService.setTokens(map)` — live-update tokens after install.
- `ThemeService.getToken(name)` — read any token value.
- `base: false` option skips the base stylesheet.
- Base stylesheet: box-sizing reset, body font/color wired to tokens, `.vf-card`,
  `.vf-btn` + variants (`-primary`, `-secondary`, `-danger`, `-success`), `.vf-icon`.
- Exported from `src/framework.js` as part of the public API.

---

## Done (v1.1)

### Plugin / service-registry foundation
- `app.use(plugin, options)` — install a plugin; idempotent, chainable.
- `app.provide(name, instance)` — register or override a named service.
- `app.get(name)` — retrieve a service (reads registry first, falls back to component names).
- `componentManager.app` + `instance.app` — every component can call `this.service(name)`.
- `this.icon(name, opts)` — shortcut to the icons service.

### Component composition
- `this.child(ClassOrName, props, key)` — embed child components in templates.
- `reconcileChildren()` — mounts new children, updates props, destroys removed ones.
- Morph treats `[data-vf-host]` as an opaque boundary (child DOM survives parent re-renders).
- Event delegation scoped so child events don't fire the parent's handler.
- Full child teardown when parent is destroyed (no listener leaks).

### Built-in icons (first plugin)
- ~20 original inline SVG icons: check, close, trash, plus, minus, menu, chevrons, search, info,
  warning, edit, arrows, home, user, settings, external-link.
- `iconsPlugin` — install with `app.use(iconsPlugin)`.
- Custom icons via `app.use(iconsPlugin, { icons: { logo: '<path .../>' } })` or
  `app.get('icons').register('name', svg)`.
- Replaces Font Awesome for common UI icons; users can still bring their own icon lib.

---

## Done (v1.6)

### Signals / fine-grained reactivity
- `this.signal(initialValue)` — creates a `Signal` linked to the component.
- `signal.value` — read the current value in `getTemplate()`.
- `signal.set(newValue)` — updates the value and schedules a single morph re-render via
  microtask batching (multiple `.set()` calls in the same synchronous block → one render).
- `signal.subscribe(fn)` — returns an unsubscribe function; works standalone, no component needed.
- `Object.is` equality check — identical values are ignored, no unnecessary renders.
- Auto-cleanup: all signals destroyed when their component is destroyed, preventing memory leaks.
- `Signal` class exported from `src/framework.js` for standalone use.
- Full TypeScript generic type `Signal<T>` in `types/index.d.ts`.

---

## Done (v1.7)

### Shared store plugin
- `storePlugin` — install with `app.use(storePlugin)`.
- `store.set(key, value)` — writes a value; identical values (via `Object.is`) are no-ops.
- `store.get(key)` — reads the current value (returns `undefined` for unset keys).
- `store.subscribe(key, fn)` — per-key subscription; handler receives `(value, prev)`;
  returns an unsubscribe function.
- `store.subscribeAll(fn)` — subscribes to all writes; handler receives `(key, value, prev)`.
- `store.delete(key)` — removes a key and fires change events.
- `store.keys()` — returns all stored key names.
- Emits `'store:change'` and `'store:change:<key>'` on the shared EventBus so any code can
  react without going through the service directly.
- Exported from `src/framework.js` as `storePlugin` + `StoreService`.
- Full TypeScript generics in `types/index.d.ts`.

---

## Done (v1.5)

### Scaffold CLI + TypeScript types
- `npx create-vanillaforge my-app` — interactive or `--template=<name>` flag.
- Four templates: `minimal` (no plugins), `full` (all plugins), `todo-app`, `router-app`.
- Each scaffold uses a GitHub git dependency + importmap so no build step is needed in dev.
- CLI package lives in `create-vanillaforge/` (monorepo style); bin: `create-vanillaforge/bin/cli.js`.
- `types/index.d.ts` — full TypeScript declaration file for the entire public API; wired into
  the package `"exports"` field so VS Code picks it up automatically.
- Framework `package.json` updated: `"types": "types/index.d.ts"`, `"files"` includes `types/`.
- See `docs/cli.md` for the full CLI reference.

---

## Done (v1.8)

### Route loaders

- `loader` option on route config — an async function that runs before the component mounts.
- Return value is available as `this.props.data` on the first render.
- Loader receives `{ params, path }` — dynamic segments and the matched URL path.
- Loader errors are caught and logged; the component still mounts with `props.data: undefined`.
- Fully backward-compatible — routes registered as a bare class continue to work unchanged.

```js
app.initialize({
  routes: {
    '/users/:id': {
      component: UserDetailComponent,
      loader: async ({ params }) =>
        fetch(`/api/users/${params.id}`).then(r => r.json()),
    },
  },
});

// In UserDetailComponent:
getTemplate() {
  const user = this.props.data;        // pre-fetched before first render
  return `<h1>${user ? user.name : 'Loading...'}</h1>`;
}
```

---

## Done (v1.9)

### npm publish readiness
- `"exports"` field in `package.json` — wires the default entry and `./types` for
  TypeScript consumers.
- `"files"` field tightened — publishes only framework source, plugins, utils, and
  types; demo files, build scripts, and examples are excluded.
- `prepublishOnly` script — runs `npm test && npm run lint` before every publish.
- `IconsService`, `ThemeService`, `AlertsService`, `FontsService` re-exported from
  `src/framework.js` to complete the public API surface.
- Version bumped to `1.9.0`; ready for `npm publish vanillaforge`.
