import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-pagination.js');

test('pagination emits one-based page changes and disables boundary controls', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  const events = [];
  el.addEventListener('dv:page', (event) => events.push(event.detail.page));

  const buttons = el.querySelectorAll('button');
  assert.equal(buttons[0].disabled, true);
  buttons[1].click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(el.querySelector('[aria-current="page"]').textContent.trim(), 'Page 2 of 3');
  assert.deepEqual(events, [2]);
});
