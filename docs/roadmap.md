# VanillaForge — Roadmap

This is the living plan for VanillaForge's evolution toward a batteries-included framework where
developers don't need Font Awesome, Tailwind, Bootstrap, Google Fonts, or SweetAlert — while
remaining free to bring those libraries in if they want to.

Every item below plugs into the **plugin/service registry** added in v1.1. See
`DEVELOPMENT.md` for how to write a plugin.

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

## Done (v1.5)

### Scaffold CLI + TypeScript types
- `npx create-vanillaforge my-app` — interactive or `--template=<name>` flag.
- Four templates: `minimal` (no plugins), `full` (all plugins), `todo-app`, `router-app`.
- Each scaffold uses a GitHub git dependency + importmap so no build step is needed in dev.
- `types/index.d.ts` — full TypeScript declaration file for the entire public API; wired into
  the package `"exports"` field so VS Code picks it up automatically.
- Framework `package.json` updated: `"types": "types/index.d.ts"`, `"files"` includes `types/`.
- See `docs/cli.md` for the full CLI reference.

---

## Next: core engine upgrades

## Later: core engine upgrades

### 4. Signals / fine-grained reactivity

**Why:** Currently `setState()` re-renders the whole component template then morphs. For complex
components this is wasteful. Signals would let only the parts of the DOM that depend on a changed
value update directly.

**Shape of the API:**
```js
const count = this.signal(0);
// In template: ${count.value}
// In method:   count.set(count.value + 1) // -> only the text node updates
```

**Where it plugs in:** The morph is already the single render chokepoint. Signals slot in by
bypassing the template-string step and writing patches directly to the DOM. `src/core/dom-morph.js`
already notes this in its header comment.

---

### 5. Data loading + shared state

**Why:** Real apps need async data (route loaders) and state shared across components (a store).

**Route loaders:**
```js
addRoute('/users', {
  component: UsersListComponent,
  loader: async ({ params }) => fetch('/api/users').then(r => r.json()),
  // props.data is available in the component on first render
})
```

**Global store:**
```js
const store = this.service('store');
store.set('cart', [...items]);
store.get('cart');
store.subscribe('cart', (items) => this.setState({ items }));
```
- Layered on top of the existing EventBus (EventBus already does pub/sub; store just adds
  persistent state and a subscription shortcut).

**Where it plugs in:** `src/plugins/store/` + loader support wired into `src/core/router.js`.

---

## Finally: packaging

### 7. npm publish

When the public API is stable (after plugins + composition are battle-tested):
- Add `"exports"` field to `package.json`.
- Add `types/index.d.ts`.
- Semantic versioning: `2.0.0` for the stable public release.
- Publish `vanillaforge` (or `@vanillaforge/core`) to npm.
