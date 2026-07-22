import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

test('component validator accepts a manifest-backed factory component', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-component.mjs', 'dv-counter'], {
    cwd: process.cwd(), encoding: 'utf8',
  });
  assert.match(output, /component contract is complete/);
});
