#!/usr/bin/env node
/**
 * Scaffolds a minimal, build-free DevinimJS starter project (static HTML or PHP-fed) from the
 * committed dist/ artifacts — no bundler runs at generation time or in the generated project.
 * Usage: npm run create:project -- ./my-app [--format=static|php] [--dry-run] [--force]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

/** @type {Record<string, string[]>} Kit name -> extra dist/modules/*.js files a <script> tag in
 *  its index.html doesn't reference directly but are still required at runtime — e.g.
 *  dv-data-table.js imports dv-pagination.js as an external sibling file (ADR-0020/#0020). */
const KIT_HIDDEN_MODULE_DEPS = { 'admin-dashboard': ['dv-pagination'] };
/** @type {Record<string, string[]>} Kit name -> dist/modules/*.js files its index.html loads
 *  directly via a <script type="module"> tag. */
const KIT_MODULES = { 'admin-dashboard': ['dv-data-table', 'dv-modal', 'dv-field', 'dv-confirm', 'dv-toast-stack', 'dv-state'] };

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const formatArg = args.find((arg) => arg.startsWith('--format='))?.slice('--format='.length);
const kit = args.find((arg) => arg.startsWith('--kit='))?.slice('--kit='.length);

if (!target) {
  console.error('Usage: npm run create:project -- <target-dir> [--format=static|php] [--dry-run] [--force]');
  console.error('   or: npm run create:project -- <target-dir> --kit=<name> [--dry-run] [--force]');
  process.exit(1);
}
if (kit && formatArg) {
  console.error('Pass either --kit or --format, not both — a kit is always a static, build-free page.');
  process.exit(1);
}
if (kit && !(kit in KIT_MODULES)) {
  console.error(`Unknown kit "${kit}". Available kits: ${Object.keys(KIT_MODULES).join(', ')}.`);
  process.exit(1);
}
const format = formatArg ?? 'static';
if (!kit && !['static', 'php'].includes(format)) {
  console.error('The project format must be "static" or "php".');
  process.exit(1);
}

const targetDir = resolve(target);

const HTML_ENTRY = `<!doctype html>
<!--
  DevinimJS starter (static). Serve this folder with any static file server — no build step.
  Example: npx serve .   (or "python3 -m http.server", or any shared host that serves plain files)
  See docs/guides/starter-kit.md in the DevinimJS repo for the full walkthrough.
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevinimJS starter</title>
  <!-- CKCSS does the styling; DevinimJS only brings the motion. Swap the pinned version as needed. -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kayacuneyd/ckcss@v0.1.0-beta.1/dist/ckcss.min.css">
  <style>
    body { max-width: 40rem; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    dv-counter { display: inline-flex; align-items: center; gap: .5rem; }
    dv-counter button { min-width: 2.25rem; min-height: 2.25rem; }
    dv-counter output { min-width: 3ch; text-align: center; font-variant-numeric: tabular-nums; font-size: 1.25rem; }
  </style>
</head>
<body>
  <h1>Hello, DevinimJS</h1>
  <p>This starter ships one component, configured entirely through <code>data-*</code> attributes:</p>

  <dv-counter data-start="0" data-step="1"></dv-counter>

  <!-- One module script tag per component family is the whole installation. -->
  <script type="module" src="./assets/devinim/components/dv-counter.js"></script>
</body>
</html>
`;

const PHP_ENTRY = `<?php
/**
 * DevinimJS starter (PHP-fed). Initial state is printed server-side via data-* attributes —
 * no JavaScript build step, no API endpoint, no hydration payload. The HTML *is* the API.
 * Run: php -S localhost:8000
 * See docs/guides/php-integration.md in the DevinimJS repo for the full data-* contract.
 */

// In a real app these come from your database / session / request:
$start = 0;
$step  = 1;
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevinimJS starter</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kayacuneyd/ckcss@v0.1.0-beta.1/dist/ckcss.min.css">
  <style>
    body { max-width: 40rem; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    dv-counter { display: inline-flex; align-items: center; gap: .5rem; }
    dv-counter output { min-width: 3ch; text-align: center; font-size: 1.25rem; }
    code { background: #f4f4f4; padding: .1em .3em; }
  </style>
</head>
<body>
  <h1>Hello, DevinimJS</h1>
  <p>This counter's initial state was printed by PHP:
     <code>data-start="<?= (int)$start ?>"</code>, <code>data-step="<?= (int)$step ?>"</code>.</p>

  <!-- The complete PHP integration contract: print the element with data-* attributes. -->
  <dv-counter data-start="<?= (int)$start ?>" data-step="<?= (int)$step ?>"></dv-counter>

  <script type="module" src="./assets/devinim/components/dv-counter.js"></script>

  <noscript>
    <p><em>This interactive widget needs JavaScript. The value above is
    <?= (int)$start ?> (see ADR-0001 for the deliberate no-JS scope decision).</em></p>
  </noscript>
</body>
</html>
`;

/**
 * Builds the [content, targetRelativePath] pairs for one starter format. Component and runtime
 * files are read from this repo's own committed dist/ artifacts (never rebuilt), so the
 * generated project is a plain copy — build-free in and build-free out.
 *
 * @param {string} projectFormat - "static" or "php".
 * @returns {[() => string, string][]} Lazy content producers paired with their target path.
 */
function starterFiles(projectFormat) {
  const entry = projectFormat === 'php'
    ? [() => PHP_ENTRY, 'index.php']
    : [() => HTML_ENTRY, 'index.html'];
  return [
    entry,
    [() => readFileSync(resolve('dist/authoring.min.js'), 'utf8'), 'assets/devinim/authoring.min.js'],
    [() => readFileSync(resolve('dist/modules/dv-counter.js'), 'utf8'), 'assets/devinim/components/dv-counter.js'],
  ];
}

/**
 * Builds the [content, targetRelativePath] pairs for one starter kit (ADR-0020). Like
 * starterFiles(), everything is read from this repo's own committed dist/ artifacts and the
 * kit's own committed HTML — nothing is rebuilt or bundled at generation time.
 *
 * @param {string} kitName - A key of KIT_MODULES.
 * @returns {[() => string, string][]} Lazy content producers paired with their target path.
 */
function kitFiles(kitName) {
  const moduleNames = new Set([...KIT_MODULES[kitName], ...(KIT_HIDDEN_MODULE_DEPS[kitName] ?? [])]);
  return [
    [() => readFileSync(resolve(`kits/${kitName}/index.html`), 'utf8'), 'index.html'],
    [() => readFileSync(resolve('dist/core.min.js'), 'utf8'), 'assets/devinim/core.min.js'],
    [() => readFileSync(resolve('dist/devinim-ckcss.css'), 'utf8'), 'assets/devinim/devinim-ckcss.css'],
    ...[...moduleNames].map((name) => (
      /** @type {[() => string, string]} */ ([() => readFileSync(resolve(`dist/modules/${name}.js`), 'utf8'), `assets/devinim/components/${name}.js`])
    )),
  ];
}

for (const [content, relativePath] of (kit ? kitFiles(kit) : starterFiles(format))) {
  const destination = join(targetDir, relativePath);
  if (existsSync(destination) && !force) {
    console.error(`Refusing to overwrite ${relativePath}; use --force only when intentional.`);
    process.exit(1);
  }
  if (dryRun) {
    console.log(`create ${relativePath}`);
    continue;
  }
  mkdirSync(resolve(destination, '..'), { recursive: true });
  writeFileSync(destination, content());
  console.log(`created ${relativePath}`);
}

if (!dryRun) {
  const entryFile = format === 'php' ? 'index.php' : 'index.html';
  const runCommand = format === 'php' ? 'php -S localhost:8000' : 'npx serve .';
  console.log(`\nNext: cd ${target} && ${runCommand}, then open ${entryFile === 'index.php' ? 'http://localhost:8000/' : entryFile} in a browser.`);
}
