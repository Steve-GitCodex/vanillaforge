# create-vanillaforge

Scaffold a new [VanillaForge](https://github.com/Steve-GitCodex/vanillaforge) project with one command.

## Usage

```bash
npx create-vanillaforge my-app
```

The CLI prompts for a project name (if omitted) and a template, then generates a
ready-to-run project directory.

```bash
# Skip the prompts:
npx create-vanillaforge my-app --template=minimal
```

After scaffolding:

```bash
cd my-app
npm install
npm run dev
```

Open http://localhost:3000. No build step is needed during development.

## Templates

| Name | Description |
| --- | --- |
| `minimal` | Counter app. No plugins. Best starting point. |
| `full` | Counter app with all five built-in plugins: icons, theme, alerts, fonts, store. |
| `todo-app` | Task list with filtering, localStorage, and confirm-on-delete. |
| `router-app` | Multi-page app: user list and detail view with routing and composition. |

The default template is `minimal`.

## Generated project structure

Each template generates a self-contained project that installs `vanillaforge` from npm:

```
my-app/
  index.html          importmap + <script type="module" src="./src/app.js">
  src/
    app.js
    components/       (present in full, todo-app, router-app templates)
  package.json        vanillaforge npm dependency + "dev" script
  .gitignore
```

The `index.html` uses an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap)
to resolve the `'vanillaforge'` bare specifier directly from `node_modules/`, so the
browser loads the framework modules with no build step.

## TypeScript / editor autocomplete

The framework ships a full `types/index.d.ts` declaration file. Add a `jsconfig.json`
to the project root to enable type checking and autocomplete in VS Code:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "moduleResolution": "bundler"
  }
}
```

## Requirements

Node.js 18 or later.

## Documentation

- [Full CLI reference](../docs/cli.md)
- [Components Guide](../docs/components.md)
- [Plugin System](../docs/plugins.md)
- [Routing System](../docs/router.md)
- [API Reference](../docs/API.md)

## License

MIT — see [LICENSE](../LICENSE).
