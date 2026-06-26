# VanillaForge

**A small, zero-dependency JavaScript framework for building Single Page Applications with plain web standards.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![ES Modules](https://img.shields.io/badge/ES-Modules-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![Tests](https://img.shields.io/badge/tests-vitest-success.svg)](#testing)

VanillaForge gives you components, client-side routing, and an event bus in a
few small ES modules — no dependencies and no required build step. It runs
straight from `src/` in the browser; the build is only for producing an
optimized bundle.

## Why VanillaForge?

- **Zero runtime dependencies** — ships as plain ES modules.
- **Small** — the core is ~14.5 KB min+gzip (~48 KB minified).
- **Batteries-included** — icons, CSS/theming, alerts, self-hosted fonts, a shared
  reactive store, and an HTTP fetch wrapper, all built in. No Font Awesome, Bootstrap,
  SweetAlert, or Google Fonts required — but you can still bring them in if you want.
- **Reactive signals** — `this.signal(value)` for fine-grained reactivity;
  `computed(fn, deps)` for derived values that update automatically.
- **Component composition** — embed child components directly inside parent
  templates. Each child has isolated state, props, lifecycle, and event handling.
- **Plugin system** — every subsystem (icons, theme, alerts, fonts, store, http) is a
  plugin you can install, replace, or skip.
- **Efficient updates** — re-renders are applied with a tiny DOM-morphing diff,
  so only changed nodes are touched and focused inputs keep their cursor (see
  [How rendering works](#how-rendering-works)).
- **Client-side routing** — history API, route params (`/users/:id`), and a
  configurable fallback route.
- **Declarative events** — wire DOM events to methods with `data-*` attributes;
  the framework handles delegation and cleanup.

## Quick Start

### Scaffold a new project

```bash
npx create-vanillaforge my-app
cd my-app
npm install
npm run dev
```

The CLI prompts for a template. Pass `--template=<name>` to skip the prompt:

```bash
npx create-vanillaforge my-app --template=minimal   # no plugins
npx create-vanillaforge my-app --template=full       # all plugins
npx create-vanillaforge my-app --template=todo-app
npx create-vanillaforge my-app --template=router-app
```

See [create-vanillaforge/README.md](create-vanillaforge/README.md) for the full CLI reference.

### Install in an existing project

```bash
npm install vanillaforge
```

### Work on the framework itself

```bash
git clone https://github.com/Steve-GitCodex/vanillaforge.git
cd vanillaforge
npm install
npm run dev          # build to dist/ and serve
npm run example      # Todo app (no build needed)
npm run example:router   # Routing + params demo
```

**Your first component:**

```javascript
import { createApp, BaseComponent, iconsPlugin } from './src/framework.js';

class HelloWorld extends BaseComponent {
    constructor(eventBus, props = {}) {
        super(eventBus, props);
        this.name = 'hello-world';
        this.state = { count: 0 };
    }

    getTemplate() {
        return `
            <div class="hello">
                <h1>Hello, VanillaForge!</h1>
                <p>Clicked ${this.state.count} times.</p>
                <button data-action="inc">
                    ${this.icon('plus', { size: 16 })} Click me
                </button>
            </div>
        `;
    }

    getMethods() {
        return { inc: () => this.setState({ count: this.state.count + 1 }) };
    }
}

const app = createApp({ debug: true });
app.use(iconsPlugin);                                   // built-in SVG icons
await app.initialize({ routes: { '/': HelloWorld } });
await app.start();
```

The page needs a mount element (default id `main-content`, configurable via
`createApp({ mountId })`):

```html
<div id="main-content"></div>
<script type="module" src="./app.js"></script>
```

## How rendering works

Calling `setState()` re-runs your `getTemplate()` and **morphs** the result onto
the live DOM instead of replacing `innerHTML`. The morph:

- patches only attributes/text/nodes that actually changed;
- preserves the focus and caret/selection of a focused input, so typing is never
  interrupted by a re-render;
- reconciles lists by `data-key`, so reordering or removing an item reuses the
  existing DOM nodes instead of rebuilding the list.

```javascript
getTemplate() {
    return `<ul>${this.state.items
        .map((it) => `<li data-key="${it.id}">${it.label}</li>`)
        .join('')}</ul>`;
}
```

> Note: a full re-render still re-runs the whole template (then diffs it). Moving
> to fine-grained, signal-based updates is on the [roadmap](#roadmap).

## Declarative events

Bind DOM events to `getMethods()` entries with attributes. Each attribute maps to
exactly one event so a handler fires once:

| Attribute      | Fires on  | Typical use                 |
| -------------- | --------- | --------------------------- |
| `data-action`  | `click`   | buttons, links              |
| `data-change`  | `change`  | checkboxes, radios, selects |
| `data-input`   | `input`   | text inputs, textareas      |
| `data-keydown` | `keydown` | keyboard shortcuts          |
| `data-submit`  | `submit`  | forms                       |

Handlers receive `(event, matchedElement)`. Listeners are delegated to the
component's root element once and cleaned up automatically on destroy.

## Examples

- [Todo App](examples/todo-app/) — local state, filtering, keyed list, and
  focus-preserving input. Run with `npm run example`.
- [Routing demo](examples/router-app/) — a list view and a `/users/:id` detail
  view driven by route params. Run with `npm run example:router`.

## Testing

Tests run on [Vitest](https://vitest.dev) with [happy-dom](https://github.com/capricorn86/happy-dom)
(dev dependencies only — the framework itself stays dependency-free):

```bash
npm test
```

Coverage includes the DOM morph (focus/selection preservation, keyed lists), the
component lifecycle and event delegation, the router, the event bus, and both
examples.

## Build

```bash
npm run build               # bundle src/app.js + CSS into dist/
NODE_ENV=production npm run build   # minified bundle
```

The build uses [esbuild](https://esbuild.github.io/) to bundle and tree-shake,
and copies/minifies discovered CSS. See [docs/build-system.md](docs/build-system.md).

## Documentation

- [Components Guide](docs/components.md)
- [Component Composition](docs/composition.md)
- [Signals & Computed](docs/signals.md)
- [Plugin System & Built-in Icons](docs/plugins.md)
- [HTTP Plugin](docs/http.md)
- [Routing System](docs/router.md)
- [Event Bus](docs/event-bus.md)
- [CLI Reference](docs/cli.md)
- [API Reference](docs/API.md)
- [Build System](docs/build-system.md)
- [GitHub Pages](docs/github-pages.md)
- [Roadmap](docs/roadmap.md)

For maintainers returning after time away: see [DEVELOPMENT.md](DEVELOPMENT.md).

## Security

Templates return plain HTML strings — **escape all user-supplied values** before
interpolating them. VanillaForge ships a dedicated helper:

```javascript
import { escapeHtml, html } from 'vanillaforge';  // or from './src/framework.js'

// Escape individual values
getTemplate() {
  return `<h1>${escapeHtml(this.state.title)}</h1>`;
}

// Or use the html tagged template — every interpolation is auto-escaped
getTemplate() {
  return html`<h1>${this.state.title}</h1>`;
}
```

`this.icon()` and `this.child()` already return safe `RawHtml` — no extra
escaping needed. See [Components — Escaping and XSS](docs/components.md#escaping-and-xss).

**Content Security Policy:** the theme, alerts, and fonts plugins inject
`<style>` elements at runtime, so your CSP requires `style-src 'unsafe-inline'`
(or a nonce/hash approach). Stricter CSP support is on the roadmap.

## Browser Support

Modern browsers with ES2020+ support: Chrome 80+, Firefox 72+, Safari 14+, Edge 80+.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full list of completed and planned features.
Recent additions: HTTP plugin, computed signals, navigation guard docs, and CLI `add` subcommands.

Full release history in [CHANGELOG.md](CHANGELOG.md).

## Contributing

Issues and pull requests are welcome. Please run `npm test` and `npm run lint`
before opening a PR.

## License

MIT — see [LICENSE](LICENSE).

---

**Author:** Stephen Musyoka · [GitHub](https://github.com/Steve-GitCodex/vanillaforge) · [Issues](https://github.com/Steve-GitCodex/vanillaforge/issues)
