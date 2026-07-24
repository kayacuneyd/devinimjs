/**
 * Regression test for a bug found while building the admin-dashboard starter kit (TASK-020):
 * `dist/modules/<name>.js` files that use i18n/transition helpers or their own locale bundle
 * left `../core/i18n.js`, `../core/transition.js` and `./<name>.locale.js` as unresolved
 * relative imports — fine inside this repo's own dist/ tree, but a 404 the moment the file is
 * copied elsewhere (exactly what `scripts/create-project.mjs` and `docs/guides/starter-kit.md`'s
 * "copy further dist/modules/*.js files" guidance both do). Every dist/modules/<name>.js must
 * import only `../core.min.js`, `../authoring.min.js`, or another dist/modules/*.js sibling file
 * (dv-data-table's dv-pagination composition) — never a path that only exists inside src/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { Window } from 'happy-dom';

const moduleFiles = readdirSync('dist/modules').filter((name) => name.endsWith('.js'));

test('every dist/modules/*.js file only imports dist-relative paths', () => {
  const importPattern = /from\s*["']([^"']+)["']/g;
  for (const file of moduleFiles) {
    const code = readFileSync(`dist/modules/${file}`, 'utf8');
    for (const [, specifier] of code.matchAll(importPattern)) {
      const allowed = specifier === '../core.min.js'
        || specifier === '../authoring.min.js'
        || (specifier.startsWith('./') && moduleFiles.includes(specifier.slice(2)));
      assert.ok(allowed, `${file} imports "${specifier}", which does not resolve once copied outside dist/`);
    }
  }
});

test('every dist/modules/*.js component resolves and defines its custom element standalone', async () => {
  const window = new Window({ url: 'http://localhost/' });
  for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
    globalThis[key] = window[key];
  }
  for (const file of moduleFiles) {
    await assert.doesNotReject(
      import(`file://${process.cwd()}/dist/modules/${file}`),
      `dist/modules/${file} should import without a module-resolution error`,
    );
  }
});
