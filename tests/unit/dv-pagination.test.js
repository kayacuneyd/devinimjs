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

test('data-page beyond the last page clamps down, and Next is disabled on the last page', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10'); // 3 pages
  document.body.appendChild(el);

  el.setAttribute('data-page', '99');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('[aria-current="page"]').textContent.trim(), 'Page 3 of 3');
  const buttons = el.querySelectorAll('button');
  assert.equal(buttons[1].disabled, true, 'Next is disabled on the last page');
  assert.equal(buttons[0].disabled, false, 'Previous is enabled once past page 1');
});

test('data-page below 1 clamps up to page 1', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);

  el.setAttribute('data-page', '-5');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('[aria-current="page"]').textContent.trim(), 'Page 1 of 3');
});
