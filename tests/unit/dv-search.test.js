import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-search.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('search emits a query event, clears state and honours a live data-query prop', async () => {
  const el = document.createElement('dv-search');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:query', (event) => seen.push(event.detail.query));
  const input = el.querySelector('input');
  input.value = 'Keyboard';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();
  el.querySelector('button').click();
  await settle();
  el.setAttribute('data-query', 'Mouse');
  await settle();

  assert.deepEqual(seen, ['Keyboard', '']);
  assert.equal(el.querySelector('input').value, 'Mouse');
});
