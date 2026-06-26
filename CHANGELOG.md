# Changelog

All notable changes to VanillaForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.0] - 2026-06-26

This release adds the HTTP plugin, computed signals, expanded navigation guard
documentation, and Laravel-inspired CLI `add` subcommands.

### Added

#### HTTP plugin (`src/plugins/http/http-plugin.js`)
- `httpPlugin` — install with `app.use(httpPlugin, { baseURL: '/api', headers: {} })`.
- `HttpService.get/post/put/patch/delete(url, body?, opts?)` — all return parsed
  JSON or text; pass `{ raw: true }` to receive the raw `Response` object.
- Automatic `Content-Type: application/json` for object bodies; `FormData` and
  `URLSearchParams` pass through without serialisation.
- `setHeader(name, value)` / `removeHeader(name)` — mutate defaults for all
  subsequent requests (useful for token refresh).
- `addInterceptor({ request?, response?, error? })` — returns `this` for chaining;
  interceptors run in registration order.
- Non-2xx responses throw an `Error` with `.status`, `.statusText`, and `.body`
  properties (parsed JSON when available, text otherwise).
- Exported from `vanillaforge` as `httpPlugin` and `HttpService`.
- Full TypeScript types (`HttpService`, `HttpInterceptor`, `HttpError`,
  `RequestOptions`, `HttpPluginOptions`) added to `types/index.d.ts`.
- `tests/http.test.js` — 26 tests covering all verbs, headers, errors, interceptors,
  and plugin installation.
- New `docs/http.md` — full API reference, route-loader usage, token-refresh example.
- `docs/plugins.md` — new "HTTP plugin" section.
- `README.md` — HTTP plugin mentioned in features list and docs index.

#### Computed signals (`src/core/signal.js`)
- `computed(fn, dependencies)` — returns a derived `Signal<T>` that recomputes
  whenever any dependency signal changes.
- Reuses existing `Object.is` equality — identical derived values fire no subscribers.
- Cleanup: `_destroy()` on the computed signal removes all dependency subscriptions
  (BaseComponent calls this automatically on teardown).
- Exported from `vanillaforge` as `computed`.
- TypeScript: `computed<T>(fn: () => T, deps: Signal<any>[]): Signal<T>` added to
  `types/index.d.ts`.
- `tests/signals.test.js` — 7 new `computed` test cases.
- New `docs/signals.md` — full `signal()` + `computed()` API reference and patterns.
- `README.md` — computed signals mentioned in features list.

#### Navigation guards — documentation
- `docs/router.md` — expanded "Navigation Guards" section with:
  - Global guard via `app.router.beforeNavigation(async (route, path) => boolean)`
  - Per-route `beforeEnter` in the route config object
  - Auth redirect and loading indicator patterns
- `create-vanillaforge/templates/router-app/src/app.js` — commented-out guard
  example so scaffolded router-apps show the pattern immediately.
- `docs/roadmap.md` — guards moved to "Done (v1.10)".

#### CLI `add` subcommands (`create-vanillaforge`)
- `npx create-vanillaforge add component <name>` — scaffolds
  `src/components/<name>-component.js` from a minimal BaseComponent template and
  prints the import + registration snippet.
- `npx create-vanillaforge add route <path> <name>` — scaffolds a route-aware
  component (with `this.props.data` loader comment) and prints the route config
  snippet for `app.js`.
- `npx create-vanillaforge add plugin <name>` — scaffolds
  `src/plugins/<name>/<name>-plugin.js` with plugin boilerplate and prints the
  `app.use()` install snippet.
- All `add` commands verify that `vanillaforge` is listed in the current
  directory's `package.json` and exit with a friendly error otherwise.
- Names accepted in any casing (kebab-case, PascalCase, camelCase); normalised
  to kebab-case for file names and PascalCase for class names automatically.
- New fragment templates in `create-vanillaforge/templates/fragments/`.
- `create-vanillaforge` bumped to **v1.1.0**.
- `docs/cli.md` — new "Adding files to an existing project" section.
- `create-vanillaforge/README.md` — matching "Adding files" section.

## [1.9.2] - 2026-06-26

This release hardens the framework against XSS, removes CSP-hostile patterns, and
fixes several quality issues found during a pre-publish audit.

### Added

#### HTML escaping primitive (`src/utils/html.js`)
- `escapeHtml(value)` — canonical HTML escape for `& < > " '`; `null`/`undefined` → `''`.
- `RawHtml` class — wraps a trusted string so the `html` tagged template passes it through unchanged.
- `raw(value)` — convenience factory for `RawHtml`.
- `html` tagged template — auto-escapes every interpolation; `RawHtml` values pass through.
  Nested `html\`\`` calls and arrays are each individually escaped.
- `this.icon()` and `this.child()` now return `RawHtml`, so they compose safely in both
  plain template literals (via `toString()`) and `html\`\`` (no double-escaping).
- All four symbols exported from `src/framework.js`: `import { html, raw, escapeHtml, RawHtml } from 'vanillaforge'`.
- Full TypeScript types added to `types/index.d.ts` (`RawHtml` class, `html`/`raw`/`escapeHtml` signatures).

#### Tests
- `tests/html.test.js` — covers `escapeHtml`, `RawHtml`, `raw`, and `html\`\``:
  angle brackets, ampersands, quotes, null/undefined coercion, array handling,
  nested templates, and the icon()-style RawHtml pass-through.
- `tests/notification.test.js` — covers the `Notification` service: `showToast`,
  `showModal`, and the `escapeHtml` guard against XSS payloads in title/message/details.

### Fixed

#### Security

- **`notification.js` XSS (`src/utils/notification.js`):** `title`, `message`, `details`,
  and button labels are now escaped with `escapeHtml` before injection into `innerHTML`.
  Button `action` values are sanitised before use as CSS selectors.
  This closes the default-reachable XSS path in the legacy error-notification flow.
- **Router param injection (`src/core/router.js`):** dynamic route segments are now decoded
  with `decodeURIComponent` (with a safe fallback for malformed input) so
  `/users/John%20Doe` → `params.id === 'John Doe'`. `docs/router.md` updated with a note
  on decoded params and the escaping requirement.
- **`app.js` CSP (`src/app.js`):** replaced the inline `onclick="location.reload()"` in
  the error-fallback button (blocked by `script-src` without `'unsafe-inline'`) with a
  programmatically created button and `addEventListener`.

#### Quality

- **`event-bus.js` crash (`src/core/event-bus.js`):** `getListeners()` and `getStats()`
  no longer throw `TypeError: this.onceListeners is not iterable`. Both methods now derive
  their data from the single `this.listeners` Map, splitting entries by the `once` flag.
- **`SweetAlert` deprecated (`src/utils/sweet-alert.js`):** the class now carries a
  `@deprecated` JSDoc banner pointing users to `alertsPlugin`. The export is preserved
  until v2.0 to avoid a breaking change.
- **`String.prototype.substr` removed:** replaced with `slice` in
  `src/components/base-component.js` and `src/utils/error-handler.js`.
- **Shared `escapeHtml`:** the private duplicate copies in `src/plugins/icons/icons-plugin.js`
  and `src/plugins/alerts/alerts-plugin.js` are replaced with imports from `src/utils/html.js`.
- **`base-component.js` formatting:** fixed glued JSDoc/signatures and a stray `}}` at the
  end of `cleanup()`.

#### Documentation
- `docs/components.md` — new "Escaping and XSS" section covering `html\`\``, `raw()`, and `escapeHtml()`.
- `docs/router.md` — note on decoded params and the escaping requirement.
- `README.md` — new "Security" section and CSP note; HTML escaping mentioned in feature list.
- `docs/roadmap.md` — v1.9.2 items marked done.

---

## [1.9.1] - 2026-06-23

### Fixed

#### Font data now loads lazily (`src/plugins/fonts/`)
- `font-manifests.js` converted static imports of `inter.js` and `jetbrains-mono.js`
  (~244 KB of base64 font data) to dynamic `import()` inside each `dataUri()` function.
  The data is only fetched the first time `fontsPlugin` is actually installed.
  Previously, every `import { createApp } from 'vanillaforge'` — including projects that
  never use fonts — paid the 244 KB parsing cost up front, which broke the demo and
  generated apps in VS Code's built-in browser (module-load timeout / stuck loading spinner).
- `FontsService._src()`, `_buildCSS()`, and `_reinject()` are now `async` to handle the
  lazy data loading. A `_ready` Promise is exposed so callers can `await svc._ready`
  after installation.
- `ESLint` config updated: `AbortController` added to browser globals.

#### `autoLoadCSS` no longer hangs in file:// environments (`src/components/base-component.js`)
- Added `AbortController` with a 500 ms timeout to the `fetch HEAD` call in `autoLoadCSS`.
  In environments where `fetch` never rejects (VS Code webview, `file://` protocol),
  the old code left `init()` suspended indefinitely. The abort ensures the method always
  returns within half a second even when the network is unavailable.

#### Demo CSS always loads in VS Code's built-in browser (`index.html`)
- Added explicit `<link>` tags for `home-component.css` and `not-found-component.css`.
  All visual styling for the demo lives in those files; relying solely on `autoLoadCSS`
  meant a blank/unstyled page whenever `fetch` was unavailable.

## [1.9.0] - 2026-06-23

This release completes the public API surface and prepares the package for npm
publication.

### Added

#### Service class re-exports
- `IconsService`, `ThemeService`, `AlertsService`, and `FontsService` are now exported
  directly from `src/framework.js` alongside their plugin objects, matching the
  existing `StoreService` export. Allows standalone instantiation and TypeScript type
  annotations without importing from internal plugin paths.

#### Publish readiness
- `prepublishOnly` npm script — runs `npm test && npm run lint` automatically before
  any `npm publish`.
- `package.json` `"files"` field tightened to include only framework source
  (`src/framework.js`, `src/core/`, `src/components/base-component.js`,
  `src/plugins/`, `src/utils/`) and `types/`. Demo files, build scripts, and
  examples are no longer included in the published package.
- `FRAMEWORK_VERSION` constant bumped to `1.9.0`.

## [1.8.0] - 2026-06-23

This release adds **route loaders** — async data-fetching that runs before a route
component mounts, so the first render always has data available.

### Added

#### Route loaders (`src/core/router.js`)
- `loader` option on a route config object — an async function called before the
  component mounts.
- Receives `{ params, path }` — the dynamic URL segments and the matched path.
- Return value is passed to the component as `this.props.data` on the first render.
- Loader errors are caught and logged; the component still mounts with
  `props.data: undefined` so it can render a graceful fallback.
- Fully backward-compatible — routes registered as a bare component class continue
  to work unchanged.
- TypeScript types: `RouteLoader`, `RouteLoaderContext`, and `RouteConfig.loader`
  added to `types/index.d.ts`.
- `FRAMEWORK_VERSION` bumped to `1.8.0`.

#### Tests
- `tests/router-loaders.test.js` — covers: loader called before mount, return value
  in `props.data`, `params` and `path` passed to loader, loader error handling,
  bare-class routes still work, multiple routes with independent loaders.

#### Documentation
- `docs/roadmap.md` — route loaders moved to "Done (v1.8)".
- `docs/API.md` — "Route loaders" section with full usage example.

---

## [1.7.0] - 2026-06-23

This release adds the **shared store plugin** — a reactive key/value store accessible
from any component, no prop-drilling required.

### Added

#### Store plugin (`src/plugins/store/store-plugin.js`)
- `storePlugin` — install with `app.use(storePlugin)`.
- `StoreService.set(key, value)` — writes a value; `Object.is` equality check
  means identical values are silently ignored.
- `StoreService.get(key)` — returns the current value (`undefined` for unset keys).
- `StoreService.subscribe(key, fn)` — per-key subscription; handler receives
  `(value, prev)`; returns an unsubscribe function.
- `StoreService.subscribeAll(fn)` — subscribes to all writes; handler receives
  `(key, value, prev)`.
- `StoreService.delete(key)` — removes a key and fires change events with
  `value: undefined`.
- `StoreService.keys()` — returns all stored key names.
- Emits `'store:change'` and `'store:change:<key>'` on the shared EventBus so any
  code can react without holding a service reference.
- Exported from `src/framework.js` as `storePlugin` and `StoreService`.
- Full TypeScript generics in `types/index.d.ts`.
- `FRAMEWORK_VERSION` bumped to `1.7.0`.

#### Tests
- `tests/store.test.js` — covers: set/get round-trip, Object.is no-op, subscribe
  per-key, unsubscribe, subscribeAll, delete fires events, keys(), EventBus events,
  plugin registration, idempotency.

#### Documentation
- `docs/roadmap.md` — store plugin moved to "Done (v1.7)".
- `docs/plugins.md` — full "Store plugin" section with cross-component cart example.
- `docs/API.md` — `storePlugin` quick reference.

---

## [1.6.0] - 2026-06-23

This release adds **signals** — fine-grained reactive primitives that batch updates
and keep re-renders minimal without requiring `setState()`.

### Added

#### Signals (`src/core/signal.js`, `src/components/base-component.js`)
- `Signal<T>` class — a reactive cell; reading `.value` returns the current value;
  `.set(newValue)` updates it and notifies all subscribers.
- `Object.is` equality check — identical values are ignored, no unnecessary renders.
- `signal.subscribe(fn)` — returns an unsubscribe function; works standalone with no
  component needed.
- `this.signal(initialValue)` on `BaseComponent` — creates a `Signal` linked to the
  component. Calling `.set()` schedules a single batched morph re-render via
  microtask; multiple `.set()` calls in the same synchronous block collapse into one.
- Auto-cleanup: signals created via `this.signal()` are destroyed when the
  component is destroyed, preventing memory leaks.
- `Signal` exported from `src/framework.js` for standalone use.
- Full TypeScript generic `Signal<T>` in `types/index.d.ts`.
- `FRAMEWORK_VERSION` bumped to `1.6.0`.

#### Tests
- `tests/signals.test.js` — covers: read/write, Object.is no-op, subscribe/
  unsubscribe, batched rendering, component signal auto-cleanup on destroy,
  standalone signal, multiple subscribers.

#### Documentation
- `docs/roadmap.md` — signals moved to "Done (v1.6)".
- `docs/API.md` — "Signals" section with component and standalone examples.

---

## [1.5.0] - 2026-06-23

This release adds the **scaffold CLI** and **TypeScript declaration file** so new
projects can be created in one command and VS Code provides full type coverage.

### Added

#### Scaffold CLI (`create-vanillaforge/`)
- `npx create-vanillaforge my-app` — interactive project scaffolder.
- `--template=<name>` flag for non-interactive use.
- Four templates:
  - `minimal` — bare component + router, no plugins.
  - `full` — all first-party plugins pre-installed.
  - `todo-app` — fully-working Todo app matching the examples/ version.
  - `router-app` — multi-route app with params and child components.
- Each generated project uses a GitHub git dependency + import map; no build step
  needed in development.
- CLI package lives in `create-vanillaforge/` (monorepo style); entry point:
  `create-vanillaforge/bin/cli.js`.
- See `docs/cli.md` for the full CLI reference.

#### TypeScript declarations (`types/index.d.ts`)
- Full declaration file covering every exported symbol: `createApp`, `FrameworkApp`,
  `BaseComponent`, `Router`, `EventBus`, `Signal`, all plugin classes
  (`IconsService`, `ThemeService`, `AlertsService`, `FontsService`, `StoreService`),
  all option interfaces, and all constants.
- `package.json` updated: `"types": "types/index.d.ts"`, `"files"` array includes
  `types/`, `"exports"` map includes the `"types"` condition.
- VS Code picks up types automatically in JavaScript projects (no extra config
  needed when importing from the package).
- `FRAMEWORK_VERSION` bumped to `1.5.0`.

#### Documentation
- `docs/cli.md` — full CLI reference: usage, templates, flags, generated layout.
- `docs/roadmap.md` — scaffold + types moved to "Done (v1.5)".

---

## [1.4.0] - 2026-06-22

This release adds the **self-hosted fonts plugin** — Inter and JetBrains Mono bundled
as Latin-subset variable-weight woff2 data URIs. Zero external requests, no Google
Fonts, no file setup.

### Added

#### Fonts plugin (`src/plugins/fonts/`)
- `fontsPlugin` — install with `app.use(fontsPlugin, { families: ['Inter', 'JetBrains Mono'] })`.
- Inter and JetBrains Mono bundled as Latin-subset, variable-weight woff2 data
  URIs — zero external requests, works out of the box.
- Weight and style filtering: `{ name: 'Inter', weights: [400, 700], styles: ['normal'] }`.
  For variable fonts `weights` is treated as a `[min, max]` range.
- `path` option to serve your own font files instead of bundled data URIs.
- Custom family registration via `FontsService.addFamily(name, manifest)` — returns
  `this` for chaining.
- Theme token integration: loading Inter updates `--vf-font-sans`; loading JetBrains
  Mono updates `--vf-font-mono` (no-op when `themePlugin` is absent).
- `FontsService.getFamilies()` — returns CSS family names of all loaded fonts.
- Idempotent `<style id="vf-fonts">` element — reuses existing element rather than
  duplicating it.
- `display` option controls `font-display` (default: `'swap'`).
- Exported from `src/framework.js` as `fontsPlugin` and `FontsService`.
- `FRAMEWORK_VERSION` bumped to `1.4.0`.

#### Tests
- `tests/fonts.test.js` — covers: style element creation, Inter/JetBrains Mono
  `@font-face` injection, weight range, style filtering, idempotency, `getFamilies()`,
  theme token integration, custom path, `addFamily()`, `fontsPlugin` install.

#### Documentation
- `docs/roadmap.md` — fonts plugin moved to "Done (v1.4)".
- `docs/plugins.md` — "Built-in fonts plugin" section with full option table and
  `addFamily()` example.

---

## [1.3.0] - 2026-06-22

This release adds the **alerts plugin** — zero-dependency toasts and confirm dialogs.
Apps no longer need SweetAlert, `window.confirm`, or any other notification library.
The plugin also replaces the old `Notification` class so the ErrorHandler automatically
uses the new styled UI.

### Added

#### Alerts plugin (`src/plugins/alerts/`)
- `alertsPlugin` — install with `app.use(alertsPlugin)` or with options.
- `AlertsService` methods:
  - `success(message)`, `error(message)`, `warning(message)`, `info(message)` —
    show a slide-in toast that auto-dismisses after `duration` ms (default 4000).
  - `confirm(message, opts)` — show a modal dialog; returns a `Promise<boolean>`
    (true = confirmed, false = cancelled / backdrop click). Simultaneously calls
    `opts.onConfirm` / `opts.onCancel` callbacks if provided.
- Toast options: `duration` (per-call override), type classes (`vf-toast-success`,
  `vf-toast-error`, `vf-toast-warning`, `vf-toast-info`), built-in close button.
- Confirm options: `title` (optional heading), `confirmText`, `cancelText`,
  `danger` (red confirm button), `onConfirm`, `onCancel`.
- `maxToasts` cap (default 5) — oldest toast is silently removed when exceeded.
- Injected styles (`<style id="vf-alerts-styles">`) use `--vf-*` custom properties
  if the theme plugin is installed, with plain-CSS fallbacks if not.
- Backward-compatible `showToast(message, type)` and `showModal(title, message, opts)`
  methods so the existing `ErrorHandler` works without changes.
- On install, `app.errorHandler.notification` is re-pointed to the new service,
  so framework errors automatically use the styled toasts and dialogs.
- `alertsPlugin` exported from `src/framework.js` as part of the public API.
- `FRAMEWORK_VERSION` bumped to `1.3.0`.

#### Tests
- `tests/alerts.test.js` — 22 tests covering: container creation, style injection,
  de-duplication, all four toast type classes, message rendering, auto-dismiss with
  fake timers, close button, maxToasts trimming, `showToast()` backward compat,
  `confirm()` Promise resolution (confirm / cancel / backdrop), `onConfirm` /
  `onCancel` callbacks, DOM cleanup after close, title and danger-button options,
  `showModal()` backward compat and close button, and full plugin integration
  (registration, ErrorHandler wiring, options pass-through, idempotency).

#### Examples
- `examples/router-app/components/user-card.js` — adds a "Remove" button (trash
  icon) that triggers a danger confirm dialog; on confirmation emits `user:remove`
  and shows a success toast.
- `examples/router-app/components/users-list.js` — initialises state from the users
  array, listens for `user:remove` on the EventBus, and drops the user from state so
  the list re-renders without that card.
- `examples/router-app/index.html` — installs `alertsPlugin`; adds `.user-card-remove`
  hover style; updates the subtitle.

#### Documentation
- `docs/roadmap.md` — alerts moved to "Done"; fonts/scaffold/signals renumbered.

## [1.2.0] - 2026-06-22

This release adds the **CSS/theming plugin** — the first batteries-included styling
subsystem. Apps now look sensible out of the box without Tailwind, Bootstrap, or any
external CSS library, while remaining fully themeable.

### Added

#### Theme plugin (`src/plugins/theme/`)
- `themePlugin` — install with `app.use(themePlugin)` or
  `app.use(themePlugin, { tokens: { primary: '#6366f1', radius: '8px' } })`.
- `ThemeService` — creates a `<style id="vf-theme">` in `<head>` and fills it with
  a `:root {}` block of CSS custom properties (`--vf-primary`, `--vf-radius`, …).
- **20 default tokens:** `primary`, `primaryDark`, `secondary`, `surface`,
  `background`, `text`, `textMuted`, `border`, `danger`, `success`, `warning`,
  `radius`, `radiusSm`, `radiusLg`, `fontSans`, `fontMono`,
  `shadowSm`, `shadowMd`, `shadowLg`, `space`.
- Token names follow camelCase in JS and `--vf-kebab-case` in CSS
  (`primaryDark` → `--vf-primary-dark`).
- `setTokens(map)` — merge new values and live-update the injected stylesheet.
  Returns `this` for chaining.
- `getToken(name)` — read the current resolved value; returns `null` for unknown
  names.
- `base: false` option — inject only the `:root {}` token block, skip the
  base stylesheet.
- Idempotent `<style>` element — re-using an existing `#vf-theme` element so a
  second ThemeService (e.g. after `app.provide('theme', …)`) doesn't leave orphans.
- Base stylesheet (`src/plugins/theme/base-styles.js`) — included by default:
  box-sizing reset, body font/color/background wired to tokens, `.vf-card` surface
  card, `.vf-btn` + `.vf-btn-primary/secondary/danger/success`, `.vf-icon` alignment.
- `themePlugin` exported from `src/framework.js` as part of the public API.
- `FRAMEWORK_VERSION` bumped to `1.2.0`.

#### Documentation
- `docs/roadmap.md` — CSS/theming moved to "Done"; alerts/notifications is now next.

#### Tests
- `tests/theme.test.js` — 16 tests covering: style element creation, `:root` block,
  camelCase→kebab conversion, default token values, token overrides, base styles
  inclusion/exclusion, idempotent element reuse, `setTokens()` update and chaining,
  `getToken()` read/update/null, and `themePlugin` integration via `createApp`.

#### Examples
- `examples/router-app/index.html` installs `themePlugin` with custom token overrides
  and replaces hard-coded hex values with `var(--vf-*)` references throughout its
  hand-written stylesheet.

## [1.1.0] - 2026-06-22

This release lays the **long-term foundation** for a batteries-included framework:
a plugin/service registry, component composition, and a built-in icons subsystem.
Every future subsystem (CSS/theming, alerts, fonts) slots into the same plugin API.

### Added

#### Plugin / service registry (`src/framework.js`)
- `app.use(plugin, options)` — installs a plugin (a function or `{ name, install }` object).
  Idempotent for named plugins, chainable, available before `app.initialize()`.
- `app.provide(name, instance)` — registers or replaces a named service in the registry.
- `app.get(name)` — looks up a service from the registry first, then falls back to registered
  component classes. Fully backward-compatible with existing `app.get('eventBus')` etc.
- All built-in services (`eventBus`, `logger`, `errorHandler`, `notification`, `validation`,
  `componentManager`, `performanceUtils`, `router`) are now in the registry.

#### Component composition (`src/components/base-component.js`, `src/core/dom-morph.js`, `src/core/component-manager.js`)
- `this.child(ClassOrName, props, key)` — declare a child component inside `getTemplate()`.
  Returns a host placeholder; after the morph, `reconcileChildren()` mounts/updates/destroys
  real child instances to match.
- `reconcileChildren()` — called automatically after every render. Mounts new children, updates
  props on existing ones (re-renders only when props change), destroys children whose host was
  removed from the template.
- DOM morph now treats `[data-vf-host]` elements as opaque boundaries — the mounted child's DOM
  is never overwritten by a parent re-render.
- Event delegation scoped per component — clicks inside a child do not trigger the parent's
  delegated handler.
- Child instances propagate `app` reference and component resolver down the tree, so
  `this.service()`, `this.icon()`, and `this.child('by-name')` work at any nesting depth.
- Full teardown: `parent.destroy()` recursively destroys all children, clearing listeners and
  instances with no leaks.
- `this.service(name)` — reach any plugin service from a component (`null` if absent).
- `this.icon(name, opts)` — shortcut to the icons service (empty string if absent).

#### Built-in icons plugin (`src/plugins/icons/`)
- `IconsService` — stores and renders inline SVG icons. Methods: `render(name, opts)`,
  `register(name, svg)`, `has(name)`.
- `iconsPlugin` — install with `app.use(iconsPlugin)` or
  `app.use(iconsPlugin, { icons: { myIcon: '<path .../>' } })`.
- Ships 20 original inline SVG icons: `check`, `close`, `trash`, `plus`, `minus`, `menu`,
  `chevron-right`, `chevron-left`, `chevron-down`, `chevron-up`, `search`, `info`, `warning`,
  `edit`, `arrow-left`, `arrow-right`, `home`, `user`, `settings`, `external-link`.
- `render()` options: `size` (default 24), `className`, `title` (adds accessible `<title>` +
  `role="img"`), `color`.
- Unknown icons log a warning once (not repeatedly) and return an empty string.
- Exported from `src/framework.js` as part of the public API.
- Fully replaceable: `app.provide('icons', customService)` overrides the default.

#### Documentation
- `DEVELOPMENT.md` (repo root) — maintainer handbook: vision, resume-after-a-break checklist,
  architecture map, plugin guide, conventions, commands, directory tour, and roadmap pointer.
- `docs/roadmap.md` — prioritised living roadmap for the next six capabilities (CSS/theming,
  alerts, fonts, fast onboarding, signals, data+store, npm publish).
- `docs/composition.md` — full guide to component composition: `child()`, keys, props flow,
  child lifecycle, event isolation, nesting, patterns, and gotchas.
- `docs/plugins.md` — plugin system guide: `use`/`provide`, icons reference, writing your own
  plugin, plugin rules.
- `docs/README.md` updated with new features and doc links.
- `README.md` updated: features list, quick-start example with icons, documentation links,
  expanded roadmap section.

#### Examples
- `examples/router-app/components/user-card.js` — new `UserCard` child component with its own
  expand/collapse state, demonstrating stateful children and per-child event isolation.
- `examples/router-app/components/users-list.js` refactored to use `this.child(UserCard, ...)`,
  with users keyed by id.
- `examples/router-app/components/user-detail.js` updated to use `this.icon('arrow-left')`.
- `examples/router-app/index.html` installs `iconsPlugin` and adds card styles.

#### Tests
- `tests/composition.test.js` — child rendering, props flow, keyed identity/reuse, child state
  preservation across parent re-renders, removal/teardown, event isolation, by-name resolution.
- `tests/plugins.test.js` — `provide()`/`get()` round-trip, `use()` with function and object
  plugins, idempotency, invalid plugin guard, chaining, override behavior.
- `tests/icons.test.js` — `IconsService.render()` (size/class/title/aria/color), warn-once for
  unknown icons, `register()`/`has()`, `iconsPlugin` install and defaults, `BaseComponent.icon()`
  with and without the plugin installed.
- Total test count: 88 (all passing).

### Changed
- `src/framework.js`: version bumped to `1.1.0`.
- `src/core/component-manager.js`: `loadComponentClass()` now wires `instance.app` and
  `instance._resolveComponent` on every mounted route component.

## [1.0.1] - 2025-06-15 (production-ready refactor)

### Changed
- **Unified the render pipeline.** `BaseComponent` is now the single owner of
  rendering. The previous double-render (component init + a separate DOMRenderer)
  and its three overlapping event systems were removed; `DOMRenderer` is gone.
- **Reactive rendering via DOM morphing.** `setState()`/`updateProps()` now patch
  only changed nodes via a new zero-dependency `dom-morph` module, preserving the
  focus and caret of focused inputs and reconciling `data-key` lists in place.
- **Single declarative event system.** `data-action` (click), `data-change`,
  `data-input`, `data-keydown`, and `data-submit` are delegated once to the
  component root and cleaned up on destroy.
- Configurable mount container via `createApp({ mountId })` (default `main-content`).

### Fixed
- Router now navigates to the configured `fallback` route on a no-match, so the
  404 component actually renders.
- Router responds to `router:navigate` events from components.
- Todo example renders correctly (previously a blank page — it mounted into a
  container the router never used).

### Added
- DOM-morphing renderer (`src/core/dom-morph.js`).
- Routing example with route params (`examples/router-app/`).
- Test suite (Vitest + happy-dom) covering morph, components, router, event bus.
- Flat ESLint config (`eslint.config.js`) and CI workflow.

## [1.0.0] - 2025-06-15

### Added
- Initial release of Vanilla JS SPA Framework
- Component-based architecture with BaseComponent class
- Client-side routing with history API support
- Event-driven communication via EventBus
- Comprehensive error handling and logging system
- Build system for production deployment
- Framework debug utilities
- State management capabilities
- Form validation utilities
- SweetAlert integration for notifications
- Zero external dependencies
- Full ES module support
- TypeScript-friendly (JSDoc annotations)

### Framework Features
- **ComponentManager** - Manages component lifecycle and registration
- **Router** - Handles client-side navigation and route protection
- **EventBus** - Pub/sub pattern for component communication
- **Logger** - Configurable logging system with levels
- **ErrorHandler** - Centralized error handling and reporting
- **Validator** - Input validation utilities
- **FrameworkDebug** - Development debugging tools

### Examples
- Interactive counter demo
- Basic todo application example
- Component composition examples
- Routing demonstrations

### Documentation
- Comprehensive README with examples
- Framework API documentation
- Getting started guide
- Best practices guide

### Browser Support
- Modern browsers supporting ES2020+
- Chrome 80+, Firefox 72+, Safari 14+
- Edge 80+

### Bundle Size
- Framework core: ~48 KB minified (~14.5 KB gzipped)
- Full demo bundle (with all utilities): ~56 KB minified
