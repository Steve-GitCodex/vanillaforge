# VanillaForge Documentation

Simple, zero-dependency JavaScript framework for building SPAs.

## Quick Navigation

- [API Reference](API.md) - Complete API guide with examples
- [Components](components.md) - How to build components
- [Composition](composition.md) - Nesting components inside other components
- [Plugins](plugins.md) - Plugin system, built-in icons, writing your own plugin
- [Routing](router.md) - URL routing and navigation
- [Events](event-bus.md) - Component communication
- [Build System](build-system.md) - Development and deployment
- [Roadmap](roadmap.md) - What's planned next

## Quick Start

```javascript
import { createApp, BaseComponent, iconsPlugin } from './src/framework.js';

class HomeComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'home-component';
    this.state = { count: 0 };
  }

  getTemplate() {
    return `
      <div class="home">
        <h1>Count: ${this.state.count}</h1>
        <button data-action="inc">${this.icon('plus', { size: 18 })} Add</button>
      </div>`;
  }

  getMethods() {
    return {
      inc: () => this.setState({ count: this.state.count + 1 })
    };
  }
}

const app = createApp({ appName: 'My App' });
app.use(iconsPlugin);
await app.initialize({ routes: { '/': HomeComponent } });
await app.start();
```

## Key Features

- **Zero dependencies** - No external libraries required
- **Plugin system** - Built-in icons; CSS/theming and alerts coming next
- **Component composition** - Nest components inside other components
- **Focus-preserving DOM morph** - Updates only what changed; no input flicker
- **Declarative events** - `data-action`, `data-input`, `data-change` wiring
- **Client routing** - SPA navigation with route params and guards
- **Event bus** - Loose coupling between components
- **Small bundle** - ~14.5 KB min+gzip

## Browser Support

Modern browsers: Chrome 80+, Firefox 72+, Safari 14+, Edge 80+

---

See [DEVELOPMENT.md](../DEVELOPMENT.md) (repo root) for the maintainer guide and architecture overview.
