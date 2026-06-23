#!/usr/bin/env node
/**
 * create-vanillaforge — project scaffolder
 *
 * Usage:
 *   npx create-vanillaforge <project-name> [--template=<name>]
 *
 * Templates: minimal | full | todo-app | router-app
 */

import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

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
// File copy
// ---------------------------------------------------------------------------

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rewriteFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { projectName: argName, template: argTemplate } = parseArgs(process.argv);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const projectName = argName || (await promptProjectName(rl));
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
  copyDir(templateDir, targetDir);

  // Patch the app name into the generated files
  const htmlPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(htmlPath)) {
    rewriteFile(htmlPath, [['{{project-name}}', projectName]]);
  }

  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    rewriteFile(pkgPath, [['{{project-name}}', projectName]]);
  }

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
