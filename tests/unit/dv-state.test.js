/**
 * One extra edge-case test for <dv-state> (TASK-003 priority 7, best-effort). The happy-path
 * smoke test lives in `atomic-components.test.js` and is left in place.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-state.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('a live data-state change cycles through loading/error/empty and back', async () => {
  const el = document.createElement('dv-state');
  document.body.appendChild(el);
  assert.equal(el.querySelector('p').textContent, 'Nothing to show yet.');
  assert.equal(el.querySelector('[role="alert"]'), null);

  el.setAttribute('data-state', 'loading');
  await settle();
  assert.equal(el.querySelector('[role="status"]').textContent, 'Loading…');
  assert.equal(el.querySelector('button'), null, 'no retry control while loading');

  el.setAttribute('data-state', 'error');
  await settle();
  assert.equal(el.querySelector('[role="alert"] button'), el.querySelector('button'));

  el.setAttribute('data-state', 'empty');
  await settle();
  assert.equal(el.querySelector('p').textContent, 'Nothing to show yet.');
  assert.equal(el.querySelector('button'), null);
});
