/**
 * Script-level tests for scripts/create-project.mjs (TASK-001): shells out exactly the way a
 * consumer would (`node scripts/create-project.mjs ...`), matching the existing
 * component-validator.test.js pattern, and asserts on the generated starter's real DOM behavior
 * under happy-dom to substantiate the "renders a working dv-counter" acceptance criterion without
 * requiring a live browser in this environment.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Window } from 'happy-dom';

const dirs = [];

/** @returns {string} A fresh temp directory that gets cleaned up after the suite runs. */
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'dv-create-project-'));
  dirs.push(dir);
  return dir;
}

/**
 * @param {string[]} scriptArgs - Arguments passed to scripts/create-project.mjs.
 * @returns {import('node:child_process').SpawnSyncReturns<string>} Process result.
 */
function run(scriptArgs) {
  return spawnSync(process.execPath, ['scripts/create-project.mjs', ...scriptArgs], {
    cwd: process.cwd(), encoding: 'utf8',
  });
}

after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

test('static format scaffolds an index.html plus a self-contained component + runtime', () => {
  const target = tempDir();
  const output = execFileSync(process.execPath, ['scripts/create-project.mjs', target, '--format=static'], {
    cwd: process.cwd(), encoding: 'utf8',
  });
  assert.match(output, /created index\.html/);
  assert.match(output, /created assets\/devinim\/authoring\.min\.js/);
  assert.match(output, /created assets\/devinim\/components\/dv-counter\.js/);

  const html = readFileSync(join(target, 'index.html'), 'utf8');
  assert.match(html, /<dv-counter/);
  assert.match(html, /<script type="module" src="\.\/assets\/devinim\/components\/dv-counter\.js">/);

  for (const file of ['assets/devinim/authoring.min.js', 'assets/devinim/components/dv-counter.js']) {
    const contents = readFileSync(join(target, file), 'utf8');
    assert.ok(contents.length > 0, `${file} should be non-empty`);
  }
});

test('php format scaffolds an index.php consistent with examples/counter.php', () => {
  const target = tempDir();
  execFileSync(process.execPath, ['scripts/create-project.mjs', target, '--format=php'], {
    cwd: process.cwd(), encoding: 'utf8',
  });

  const php = readFileSync(join(target, 'index.php'), 'utf8');
  assert.match(php, /^<\?php/);
  assert.match(php, /\$start = 0;/);
  assert.match(php, /data-start="<\?= \(int\)\$start \?>"/);
  assert.match(php, /<script type="module" src="\.\/assets\/devinim\/components\/dv-counter\.js">/);
  assert.match(php, /<noscript>/);
});

test('the generated static starter renders and updates a real <dv-counter>', async () => {
  const target = tempDir();
  execFileSync(process.execPath, ['scripts/create-project.mjs', target, '--format=static'], {
    cwd: process.cwd(), encoding: 'utf8',
  });

  const window = new Window({ url: 'http://localhost/' });
  for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
    globalThis[key] = window[key];
  }
  await import(`file://${join(target, 'assets/devinim/components/dv-counter.js')}`);

  const el = document.createElement('dv-counter');
  el.setAttribute('data-start', '3');
  el.setAttribute('data-step', '2');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').textContent.trim(), '3');

  const [, increment] = el.querySelectorAll('button');
  increment.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').textContent.trim(), '5');
});

test('--dry-run reports intended files without writing them', () => {
  const target = tempDir();
  const result = run([target, '--format=static', '--dry-run']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /create index\.html/);
  assert.equal(existsSync(join(target, 'index.html')), false);
});

test('refuses to overwrite an existing file without --force, and --force allows it', () => {
  const target = tempDir();
  const first = run([target, '--format=static']);
  assert.equal(first.status, 0);

  const second = run([target, '--format=static']);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /Refusing to overwrite/);

  const forced = run([target, '--format=static', '--force']);
  assert.equal(forced.status, 0);
});

test('--kit=admin-dashboard scaffolds a working page with every component it uses', () => {
  const target = tempDir();
  const output = execFileSync(process.execPath, ['scripts/create-project.mjs', target, '--kit=admin-dashboard'], {
    cwd: process.cwd(), encoding: 'utf8',
  });
  assert.match(output, /created index\.html/);
  assert.match(output, /created assets\/devinim\/core\.min\.js/);
  assert.match(output, /created assets\/devinim\/devinim-ckcss\.css/);

  const html = readFileSync(join(target, 'index.html'), 'utf8');
  assert.match(html, /<dv-data-table/);
  assert.match(html, /<dv-modal/);
  assert.match(html, /<dv-confirm/);
  assert.match(html, /<dv-toast-stack/);

  // dv-data-table composes <dv-pagination> as a real sibling file (ADR-0020), not a bundled
  // copy — the CLI must ship it even though no <script> tag in index.html names it directly.
  for (const file of [
    'assets/devinim/core.min.js',
    'assets/devinim/devinim-ckcss.css',
    'assets/devinim/components/dv-data-table.js',
    'assets/devinim/components/dv-pagination.js',
    'assets/devinim/components/dv-modal.js',
    'assets/devinim/components/dv-field.js',
    'assets/devinim/components/dv-confirm.js',
    'assets/devinim/components/dv-toast-stack.js',
    'assets/devinim/components/dv-state.js',
  ]) {
    const contents = readFileSync(join(target, file), 'utf8');
    assert.ok(contents.length > 0, `${file} should be non-empty`);
  }
});

test('--kit and --format are mutually exclusive', () => {
  const result = run(['/tmp/dv-create-project-unused', '--kit=admin-dashboard', '--format=static']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Pass either --kit or --format, not both/);
});

test('rejects an unknown --kit', () => {
  const result = run(['/tmp/dv-create-project-unused', '--kit=bogus']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown kit "bogus"/);
});

test('rejects an unknown --format and a missing target directory', () => {
  const badFormat = run(['/tmp/dv-create-project-unused', '--format=bogus']);
  assert.notEqual(badFormat.status, 0);
  assert.match(badFormat.stderr, /must be "static" or "php"/);

  const missingTarget = run(['--format=static']);
  assert.notEqual(missingTarget.status, 0);
  assert.match(missingTarget.stderr, /Usage: npm run create:project/);
});
