import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'KeyboardEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
await import('../../src/components/dv-modal.js');

test('modal opens, closes with Escape and preserves its light-DOM children', async () => {
  const el = document.createElement('dv-modal');
  el.setAttribute('data-label', 'Confirm deletion');
  el.innerHTML = '<p>Delete this record?</p>';
  document.body.appendChild(el);

  const backdrop = el.querySelector('.dv-modal-backdrop');
  assert.equal(backdrop.hidden, true);
  assert.equal(el.querySelector('h2').textContent, 'Confirm deletion');
  assert.equal(el.querySelector('.dv-modal-content p').textContent, 'Delete this record?');

  const events = [];
  el.addEventListener('dv:open', () => events.push('open'));
  el.addEventListener('dv:close', () => events.push('close'));
  el.open();
  await settle();
  assert.equal(backdrop.hidden, false);
  assert.equal(document.activeElement, el.querySelector('[role="dialog"]'));

  el.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await settle();
  assert.equal(backdrop.hidden, true);
  assert.deepEqual(events, ['open', 'close']);
});
