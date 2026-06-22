#!/usr/bin/env node
/**
 * create-vanillaforge — scaffold a new VanillaForge project.
 *
 * Usage:
 *   npx create-vanillaforge <project-name>
 *   npx create-vanillaforge <project-name> --template=full
 *
 * Templates: minimal | full | todo-app | router-app
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

const TEMPLATES = [
  { name: 'minimal',    label: 'Minimal',     desc: 'counter app, no plugins — best starting point' },
  { name: 'full',       label: 'Full',         desc: 'all plugins: icons, theme, alerts, fonts' },
  { name: 'todo-app',   label: 'Todo App',     desc: 'task list with filtering and localStorage' },
  { name: 'router-app', label: 'Router App',   desc: 'multi-page app with routing and composition' },
];

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const projectName = args.find((a) => !a.startsWith('-'));
const templateFlag = (args.find((a) => a.startsWith('--template=')) ?? '').slice('--template='.length) || null;

function die(msg) {
  console.error(`\nError: ${msg}\n`);
  process.exit(1);
}

if (!projectName) {
  console.error('\nUsage: npx create-vanillaforge <project-name> [--template=<name>]');
  console.error(`Templates: ${TEMPLATES.map((t) => t.name).join(' | ')}\n`);
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i.test(projectName)) {
  die('Project name may only contain letters, numbers, and hyphens.');
}

if (templateFlag && !TEMPLATES.find((t) => t.name === templateFlag)) {
  die(`Unknown template "${templateFlag}". Available: ${TEMPLATES.map((t) => t.name).join(', ')}`);
}

// ---------------------------------------------------------------------------
// Interactive template selection
// ---------------------------------------------------------------------------

function askTemplate() {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    console.log('\nWhich template would you like to use?\n');
    const pad = Math.max(...TEMPLATES.map((t) => t.label.length));
    TEMPLATES.forEach((t, i) => {
      console.log(`  ${i + 1})  ${t.label.padEnd(pad)}   ${t.desc}`);
    });
    console.log('');

    rl.question('Template (1): ', (answer) => {
      rl.close();
      const idx = (parseInt(answer, 10) || 1) - 1;
      resolve(TEMPLATES[Math.max(0, Math.min(idx, TEMPLATES.length - 1))].name);
    });
  });
}

// ---------------------------------------------------------------------------
// File copy with token substitution
// ---------------------------------------------------------------------------

function toProjectSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function copyDir(src, dest, tokens) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    // npm strips .gitignore from published packages — store as 'gitignore', restore on copy
    const destName = entry === 'gitignore' ? '.gitignore' : entry;
    const destPath = join(dest, destName);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, tokens);
    } else {
      let content = readFileSync(srcPath, 'utf8');
      for (const [placeholder, value] of Object.entries(tokens)) {
        content = content.replaceAll(placeholder, value);
      }
      writeFileSync(destPath, content);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const templateName = templateFlag ?? (await askTemplate());
  const chosen = TEMPLATES.find((t) => t.name === templateName);

  const projectDir = join(process.cwd(), projectName);
  if (existsSync(projectDir)) {
    die(`Directory "${projectName}" already exists.`);
  }

  const tokens = {
    '{{PROJECT_NAME}}': projectName,
    '{{project-name}}': toProjectSlug(projectName),
  };

  copyDir(join(TEMPLATES_DIR, templateName), projectDir, tokens);

  console.log(`\nCreated ${projectName}  (${chosen.label})\n`);
  console.log('Next steps:\n');
  console.log(`  cd ${projectName}`);
  console.log('  npm install        # installs vanillaforge from GitHub');
  console.log('  npm run dev        # starts a local dev server on port 3000');
  console.log('');
  console.log('Tip: when vanillaforge is published to npm, switch the dependency with:');
  console.log('  npm install vanillaforge');
  console.log('');
}

main().catch((err) => die(err.message));
