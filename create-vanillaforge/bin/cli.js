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
// Validation
// ---------------------------------------------------------------------------

function validateProjectName(name) {
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i.test(name)) {
    console.error('Error: project name may only contain letters, numbers, and hyphens.');
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
// File copy — renames gitignore -> .gitignore and substitutes tokens in all files
// (npm strips .gitignore from published packages, so templates store it as 'gitignore')
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
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
