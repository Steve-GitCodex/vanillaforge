# Changelog

All notable changes to VanillaForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
