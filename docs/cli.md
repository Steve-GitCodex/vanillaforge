# create-vanillaforge CLI

Scaffold a new VanillaForge project in seconds — no configuration required.

```
npx create-vanillaforge <project-name> [--template=<name>]
```

---

## Quick start

```bash
npx create-vanillaforge my-app
cd my-app
npm install
npm run dev
```

`npm run dev` starts a local server on port 3000 and opens the browser.
No build step is required for development.

---

## Templates

| Name | Description |
|---|---|
| `minimal` | Counter app. No plugins. Best starting point for a blank project. |
| `full` | Counter app with all five built-in plugins: icons, theme, alerts, fonts, store. |
| `todo-app` | Task list with filtering, localStorage, and confirm-on-delete. |
| `router-app` | Multi-page app: user list + detail view with routing and composition. |

### Choose at the prompt

Running without `--template` shows an interactive menu:

```
Which template would you like to use?

  1)  Minimal      counter app, no plugins — best starting point
  2)  Full         all plugins: icons, theme, alerts, fonts, store
  3)  Todo App     task list with filtering and localStorage
  4)  Router App   multi-page app with routing and composition

Template (1):
```

### Choose with a flag

```bash
npx create-vanillaforge my-app --template=full
npx create-vanillaforge my-app --template=router-app
```

---

## Generated project structure

### Minimal

```
my-app/
  index.html          importmap + <script type="module" src="./src/app.js">
  src/
    app.js            createApp + HomeComponent
  package.json        vanillaforge git dependency + "dev" script
  .gitignore
```

### Full

```
my-app/
  index.html
  src/
    app.js            createApp + all 5 plugins installed
    components/
      home.js         HomeComponent demonstrating icons, theme classes, alerts, store
  package.json
  .gitignore
```

### Todo App

```
my-app/
  index.html
  src/
    app.js
    components/
      todo-app.js     TodoApp: add / toggle / remove / filter / localStorage
  package.json
  .gitignore
```

### Router App

```
my-app/
  index.html
  src/
    app.js            createApp + routes: '/' → UsersList, '/users/:id' → UserDetail
    components/
      users-list.js   lists users; embeds UserCard children via this.child()
      user-card.js    expand/collapse card with confirm-on-remove
      user-detail.js  reads route param, shows user bio
    data/
      users.js        in-memory data source
  package.json
  .gitignore
```

---

## How the framework dependency works

Generated projects install `vanillaforge` from npm:

```json
{
  "dependencies": {
    "vanillaforge": "^1.9.0"
  }
}
```

The generated `index.html` maps the bare specifier `'vanillaforge'` to the
installed source via an [Import Map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap):

```html
<script type="importmap">
{
  "imports": {
    "vanillaforge": "./node_modules/vanillaforge/src/framework.js"
  }
}
</script>
```

This means:
- **No build step** is needed in development.
- The browser resolves all framework modules from `node_modules/` at runtime.
- Supported in Chrome 89+, Firefox 108+, Safari 16.4+.

---

## TypeScript / editor autocomplete

The framework ships a `types/index.d.ts` declaration file. In a plain
JavaScript project, add a `jsconfig.json` to the project root to enable
type-checking and autocomplete:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "moduleResolution": "bundler"
  }
}
```

VS Code picks this up automatically.

---

## Adding files to an existing project

Once you have a project, you can scaffold new files without leaving the
terminal. Run these commands from the **root of your VanillaForge project**:

```bash
# Add a plain component
npx create-vanillaforge add component <name>

# Add a route component (includes loader comment)
npx create-vanillaforge add route <path> <name>

# Add a plugin boilerplate
npx create-vanillaforge add plugin <name>
```

The CLI writes the file, then prints the exact import and registration
snippet you need to paste into `app.js`. It never modifies existing files.

### `add component`

```bash
npx create-vanillaforge add component user-profile
```

Creates `src/components/user-profile-component.js` and prints:

```
Created  src/components/user-profile-component.js

Add it to your app:

  import { UserProfileComponent } from './components/user-profile-component.js';

  // In app.initialize({ components: { ... } }):
  user-profile: UserProfileComponent
```

### `add route`

```bash
npx create-vanillaforge add route /users/:id user-detail
```

Creates `src/components/user-detail-component.js` (a route-aware component
with a `this.props.data` loader comment) and prints the route config snippet:

```
Created  src/components/user-detail-component.js

Add it to your routes in app.js:

  import { UserDetailComponent } from './components/user-detail-component.js';

  // In app.initialize({ routes: { ... } }):
  '/users/:id': {
    component: UserDetailComponent,
    // loader: async ({ params }) => fetchData(params),
  },
```

### `add plugin`

```bash
npx create-vanillaforge add plugin auth
```

Creates `src/plugins/auth/auth-plugin.js` with the standard plugin boilerplate
and prints the install snippet:

```
Created  src/plugins/auth/auth-plugin.js

Register it in app.js:

  import { authPlugin } from './plugins/auth/auth-plugin.js';
  app.use(authPlugin);

Access from a component:
  const svc = this.service('auth');
```

### Name formats

The `<name>` argument is accepted in any casing — kebab-case, PascalCase, or
camelCase. The CLI normalises it internally:

| Input | File | Class |
|-------|------|-------|
| `user-profile` | `user-profile-component.js` | `UserProfileComponent` |
| `UserProfile` | `user-profile-component.js` | `UserProfileComponent` |
| `userProfile` | `user-profile-component.js` | `UserProfileComponent` |

---

## FAQ

**The dev server opens `index.html` but the app is blank.**  
Make sure you ran `npm install` first. The importmap points to
`./node_modules/vanillaforge/...` — if node_modules is missing, the
browser silently fails to load the module.

**Can I use a bundler (esbuild, Vite, Rollup)?**  
Yes. Replace the importmap with your bundler's entry-point configuration
and point it at `src/app.js`. The scaffolded code uses standard ES module
syntax and works with any modern bundler.

**Why http-server and not Vite?**  
VanillaForge is dependency-free. `npx http-server` needs nothing pre-installed
and starts in under a second. Add Vite if you need HMR or a production build.
