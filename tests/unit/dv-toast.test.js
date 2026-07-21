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
