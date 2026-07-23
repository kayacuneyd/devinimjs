import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-toast.js');

test('toast exposes an accessible message and auto-dismisses', async () => {
  const el = document.createElement('dv-toast');
  el.setAttribute('data-duration', '10');
  document.body.appendChild(el);
  el.show('Saved');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').textContent, 'Saved');
  assert.equal(el.querySelector('output').hidden, false);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(el.querySelector('output').hidden, true);
});

test('calling show() again restarts the auto-dismiss timer instead of stacking a second one', async () => {
  const el = document.createElement('dv-toast');
  el.setAttribute('data-duration', '60');
  document.body.appendChild(el);
  el.show('First');
  await new Promise((resolve) => setTimeout(resolve, 20)); // well within the first 60ms window
  el.show('Second'); // restarts the 60ms window from here
  await new Promise((resolve) => setTimeout(resolve, 50)); // past the original 60ms mark, not the new one
  assert.equal(el.querySelector('output').hidden, false, 'the stale first timer must not have fired');
  assert.equal(el.querySelector('output').textContent, 'Second');
  await new Promise((resolve) => setTimeout(resolve, 30)); // now past the restarted timer too
  assert.equal(el.querySelector('output').hidden, true);
});

test('hide() while already closed is a no-op (no duplicate dv:hide)', async () => {
  const el = document.createElement('dv-toast');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:hide', () => seen.push(1));
  el.hide();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(seen, []);
});
