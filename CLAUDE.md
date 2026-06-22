# VanillaForge — Project Instructions

Guidance for working in this repository.

## Coding standards

- **No emojis in code.** Do not use emoji characters anywhere in source code,
  including JavaScript, CSS, HTML, console/log output, comments, identifiers,
  commit messages, or UI copy. Use plain text or inline SVG icons instead.
  Markdown documentation under `docs/` may use emojis sparingly only where there
  is no clean alternative; everything else stays emoji-free.
- Match the surrounding code style (2-space indentation, single quotes in JS).
- Keep the framework runtime dependency-free. Dev-only tooling is fine.

## Architecture quick reference

- Components extend `BaseComponent` and implement `getTemplate()`; wire events
  declaratively via `getMethods()` + `data-action` / `data-change` / `data-input`
  / `data-keydown` / `data-submit`. Do not attach manual DOM listeners in
  components.
- `setState()` re-renders through the DOM morph in `src/core/dom-morph.js`
  (focus-preserving, `data-key` list reconciliation). Don't reintroduce
  `innerHTML` replacement for updates.
- Route components mount into the configurable container id (`mountId`, default
  `main-content`).

## Before committing

Run and keep green:

```bash
npm test        # Vitest + happy-dom
npm run lint    # ESLint (0 errors)
npm run build   # esbuild bundle
```
