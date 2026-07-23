/**
 * One extra edge-case test for <dv-confirm> (TASK-003 priority 7, best-effort). The happy-path
 * smoke test lives in `atomic-components.test.js` and is left in place.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-confirm.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('cancel() resets a pending confirmation without emitting dv:confirm', async () => {
  const el = document.createElement('dv-confirm');
  el.setAttribute('data-value', 'account-1');
  document.body.appendChild(el);
  const confirmed = [];
  const cancelled = [];
  el.addEventListener('dv:confirm', (e) => confirmed.push(e.detail));
  el.addEventListener('dv:cancel', () => cancelled.push(1));

  el.querySelector('button').click(); // enters pending state
  await settle();
  assert.equal(el.querySelectorAll('button').length, 2);

  const [, cancelButton] = el.querySelectorAll('button');
  cancelButton.click();
  await settle();

  assert.deepEqual(confirmed, []);
  assert.deepEqual(cancelled, [1]);
  assert.equal(el.querySelectorAll('button').length, 1, 'back to the single initial button');
});
