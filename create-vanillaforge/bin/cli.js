#!/usr/bin/env node
/**
 * create-vanillaforge CLI
 *
 * Scaffold a new project:
 *   npx create-vanillaforge <project-name> [--template=<name>]
 *
 * Add files to an existing project:
 *   npx create-vanillaforge add component <name>
 *   npx create-vanillaforge add route <path> <name>
 *   npx create-vanillaforge add plugin <name>
 *
 * Templates: minimal | full | todo-app | router-app
 */

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const FRAGMENTS_DIR = path.join(TEMPLATES_DIR, 'fragments');

const TEMPLATES = [
  {
    name: 'minimal',
    label: 'Minimal',
    description: 'counter app, no plugins — best starting point',
  },
  {
    name: 'full',
    label: 'Full',
    description: 'all plugins: icons, theme, alerts, fonts, store',
  },
  {
    name: 'todo-app',
    label: 'Todo App',
    description: 'task list with filtering and localStorage',
  },
  {
    name: 'router-app',
    label: 'Router App',
    description: 'multi-page app with routing and composition',
  },
];

// ---------------------------------------------------------------------------
// Name conversion helpers
// ---------------------------------------------------------------------------

/** 'UserProfile' | 'userProfile' | 'user-profile' -> 'user-profile' */
function toKebab(name) {
  return name
    .replace(/([A-Z])/g, (c, _, i) => (i > 0 ? '-' : '') + c.toLowerCase())
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** 'user-profile' | 'UserProfile' | 'userProfile' -> 'UserProfile' */
function toPascal(name) {
  return toKebab(name)
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/** 'UserProfile' -> 'userProfile' */
function toCamel(name) {
  const pascal = toPascal(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  let projectName = null;
  let template = null;

  for (const arg of args) {
    if (arg.startsWith('--template=')) {
      template = arg.slice('--template='.length);
    } else if (!arg.startsWith('--')) {
      projectName = arg;
    }
  }

  return { projectName, template };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateProjectName(name) {
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i.test(name)) {
    console.error('Error: project name may only contain letters, numbers, and hyphens.');
    process.exit(1);
  }
}

function validateIdentifier(name, label) {
  if (!name || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) {
    console.error(`Error: ${label} must start with a letter and contain only letters, numbers, and hyphens.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function promptProjectName(rl) {
  const answer = await ask(rl, 'Project name: ');
  const name = answer.trim();
  if (!name) {
    console.error('Error: project name is required.');
    process.exit(1);
  }
  return name;
}

async function promptTemplate(rl) {
  console.log('\nWhich template would you like to use?\n');
  TEMPLATES.forEach((t, i) => {
    const num = String(i + 1).padStart(2);
    console.log(`  ${num})  ${t.label.padEnd(12)} ${t.description}`);
  });
  console.log('');
  const answer = await ask(rl, 'Template (1): ');
  const index = (parseInt(answer.trim(), 10) || 1) - 1;
  if (index < 0 || index >= TEMPLATES.length) {
    console.error(`Error: invalid selection "${answer.trim()}".`);
    process.exit(1);
  }
  return TEMPLATES[index].name;
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

/**
 * Recursively copy a directory, substituting {{token}} placeholders in every file.
 * Renames 'gitignore' -> '.gitignore' (npm strips dotfiles from published packages).
 */
function copyDir(src, dest, tokens) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destName = entry.name === 'gitignore' ? '.gitignore' : entry.name;
    const destPath = path.join(dest, destName);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, tokens);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      for (const [from, to] of Object.entries(tokens)) {
        content = content.split(from).join(to);
      }
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}

/** Write a single fragment template with token substitution. */
function writeFragment(tplName, destPath, tokens) {
  const tplPath = path.join(FRAGMENTS_DIR, tplName);
  let content = fs.readFileSync(tplPath, 'utf8');
  for (const [from, to] of Object.entries(tokens)) {
    content = content.split(from).join(to);
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
}

/** Check that cwd looks like a VanillaForge project. */
function assertVanillaForgeProject() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('Error: no package.json found in the current directory.');
    console.error('Run this command from the root of a VanillaForge project.');
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!deps['vanillaforge']) {
    console.error('Error: vanillaforge is not listed as a dependency in package.json.');
    console.error('Are you inside a VanillaForge project?');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// add subcommands
// ---------------------------------------------------------------------------

function addComponent(name) {
  assertVanillaForgeProject();
  validateIdentifier(name, 'component name');

  const kebab = toKebab(name);
  const pascal = toPascal(name);
  const fileName = `${kebab}-component.js`;
  const destPath = path.join(process.cwd(), 'src', 'components', fileName);

  if (fs.existsSync(destPath)) {
    console.error(`Error: ${destPath} already exists.`);
    process.exit(1);
  }

  writeFragment('component.js.tpl', destPath, {
    '{{ComponentName}}': pascal,
    '{{component-name}}': kebab,
  });

  console.log(`\nCreated  src/components/${fileName}\n`);
  console.log('Add it to your app:\n');
  console.log(`  import { ${pascal}Component } from './components/${fileName}';`);
  console.log('');
  console.log('  // In app.initialize({ components: { ... } }):');
  console.log(`  ${kebab}: ${pascal}Component`);
  console.log('');
}

function addRoute(routePath, name) {
  assertVanillaForgeProject();
  if (!routePath || !routePath.startsWith('/')) {
    console.error('Error: route path must start with /  (e.g. /users/:id)');
    process.exit(1);
  }
  validateIdentifier(name, 'component name');

  const kebab = toKebab(name);
  const pascal = toPascal(name);
  const fileName = `${kebab}-component.js`;
  const destPath = path.join(process.cwd(), 'src', 'components', fileName);

  if (fs.existsSync(destPath)) {
    console.error(`Error: ${destPath} already exists.`);
    process.exit(1);
  }

  writeFragment('route-component.js.tpl', destPath, {
    '{{ComponentName}}': pascal,
    '{{component-name}}': kebab,
  });

  console.log(`\nCreated  src/components/${fileName}\n`);
  console.log('Add it to your routes in app.js:\n');
  console.log(`  import { ${pascal}Component } from './components/${fileName}';`);
  console.log('');
  console.log('  // In app.initialize({ routes: { ... } }):');
  console.log(`  '${routePath}': {`);
  console.log(`    component: ${pascal}Component,`);
  console.log('    // loader: async ({ params }) => fetchData(params),');
  console.log('  },');
  console.log('');
}

function addPlugin(name) {
  assertVanillaForgeProject();
  validateIdentifier(name, 'plugin name');

  const kebab = toKebab(name);
  const pascal = toPascal(name);
  const camel = toCamel(name);
  const fileName = `${kebab}-plugin.js`;
  const destPath = path.join(process.cwd(), 'src', 'plugins', kebab, fileName);

  if (fs.existsSync(destPath)) {
    console.error(`Error: ${destPath} already exists.`);
    process.exit(1);
  }

  writeFragment('plugin.js.tpl', destPath, {
    '{{PluginName}}': pascal,
    '{{pluginName}}': camel,
    '{{plugin-name}}': kebab,
  });

  console.log(`\nCreated  src/plugins/${kebab}/${fileName}\n`);
  console.log('Register it in app.js:\n');
  console.log(`  import { ${camel}Plugin } from './plugins/${kebab}/${fileName}';`);
  console.log(`  app.use(${camel}Plugin);`);
  console.log('');
  console.log('Access from a component:');
  console.log(`  const svc = this.service('${kebab}');`);
  console.log('');
}

function runAdd(args) {
  const [type, ...rest] = args;

  switch (type) {
    case 'component': {
      const [name] = rest;
      if (!name) {
        console.error('Usage: npx create-vanillaforge add component <name>');
        process.exit(1);
      }
      addComponent(name);
      break;
    }
    case 'route': {
      const [routePath, name] = rest;
      if (!routePath || !name) {
        console.error('Usage: npx create-vanillaforge add route <path> <name>');
        console.error('Example: npx create-vanillaforge add route /users/:id user-detail');
        process.exit(1);
      }
      addRoute(routePath, name);
      break;
    }
    case 'plugin': {
      const [name] = rest;
      if (!name) {
        console.error('Usage: npx create-vanillaforge add plugin <name>');
        process.exit(1);
      }
      addPlugin(name);
      break;
    }
    default:
      console.error(`Error: unknown add type "${type}".`);
      console.error('Available types: component, route, plugin');
      process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  // Dispatch 'add' subcommand
  if (args[0] === 'add') {
    runAdd(args.slice(1));
    return;
  }

  // Default: scaffold a new project
  const { projectName: argName, template: argTemplate } = parseArgs(process.argv);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const projectName = argName || (await promptProjectName(rl));
  validateProjectName(projectName);

  const template = argTemplate || (await promptTemplate(rl));

  rl.close();

  if (!TEMPLATES.find((t) => t.name === template)) {
    console.error(`Error: unknown template "${template}". Choose from: ${TEMPLATES.map((t) => t.name).join(', ')}`);
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: directory "${projectName}" already exists.`);
    process.exit(1);
  }

  const templateDir = path.join(TEMPLATES_DIR, template);
  const tokens = { '{{project-name}}': projectName };
  copyDir(templateDir, targetDir, tokens);

  console.log(`\nScaffolded "${projectName}" with the "${template}" template.\n`);
  console.log('Next steps:\n');
  console.log(`  cd ${projectName}`);
  console.log('  npm install');
  console.log('  npm run dev\n');
  console.log('No build step needed for development. Open http://localhost:3000\n');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
