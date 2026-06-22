# Changelog

All notable changes to VanillaForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
