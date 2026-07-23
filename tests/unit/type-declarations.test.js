import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import process from 'node:process';

/**
 * Regression check for ADR-0017: proves `npm run build:types` keeps generating accurate `.d.ts`
 * output for the primary public API surface, so a silent generator break (bad tsconfig edit,
 * upstream `typescript` bump, a renamed export) is caught here instead of downstream in a
 * consumer's editor.
 */

test('build:types generates declarations for the public API surface', () => {
  // Force a clean run so this test proves generation itself works, not stale output on disk.
  rmSync('types', { recursive: true, force: true });

  const output = execFileSync(process.execPath, ['scripts/build-types.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.match(output, /\[build:types\] OK/);

  const core = readFileSync('types/core/core.d.ts', 'utf8');
  for (const symbol of ['BaseComponent', 'html', 'define', 'createReactive', 'createStore', 'morph', 'safeUrl', 'HtmlString', 'unsafe', 'escapeHtml']) {
    assert.ok(core.includes(symbol), `types/core/core.d.ts should re-export "${symbol}"`);
  }

  const baseComponent = readFileSync('types/core/base-component.d.ts', 'utf8');
  assert.match(baseComponent, /export class BaseComponent extends HTMLElement/);
  assert.match(baseComponent, /get state\(\): object;/, 'BaseComponent#state should resolve to a real type, not any');

  const authoring = readFileSync('types/core/authoring.d.ts', 'utf8');
  assert.ok(authoring.includes('component'), 'types/core/authoring.d.ts should re-export "component"');

  const app = readFileSync('types/core/app.d.ts', 'utf8');
  for (const symbol of ['createAsyncState', 'fetchJson', 'HttpError', 'createForm', 'createHashRouter']) {
    assert.ok(app.includes(symbol), `types/core/app.d.ts should re-export "${symbol}"`);
  }
});
