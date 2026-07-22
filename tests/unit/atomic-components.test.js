import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) globalThis[key] = window[key];
await import('../../src/components/dv-dropdown.js');
await import('../../src/components/dv-product-card.js');
await import('../../src/components/dv-field.js');
await import('../../src/components/dv-confirm.js');
await import('../../src/components/dv-autocomplete.js');
await import('../../src/components/dv-data-table.js');
await import('../../src/components/dv-cart.js');
await import('../../src/components/dv-toast-stack.js');
await import('../../src/components/dv-state.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('dropdown toggles its consumer-owned menu', async () => {
  const el = document.createElement('dv-dropdown');
  el.innerHTML = '<button role="menuitem">Profile</button>';
  document.body.appendChild(el);
  const trigger = el.querySelector('button');
  trigger.click();
  await settle();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(el.querySelector('[role="menu"]').hidden, false);
});

test('product card emits its configured product', async () => {
  const el = document.createElement('dv-product-card');
  el.setAttribute('data-id', 'keyboard');
  el.setAttribute('data-name', 'Keyboard');
  el.setAttribute('data-price', '99');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:add-to-cart', (event) => seen.push(event.detail));
  el.querySelector('button').click();
  await settle();
  assert.deepEqual(seen, [{ id: 'keyboard', name: 'Keyboard', price: 99 }]);
});

test('field reports value and native validity', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-required', 'true');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:input', (event) => seen.push(event.detail));
  const input = el.querySelector('input');
  input.value = 'Ada';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();
  assert.equal(seen[0].value, 'Ada');
  assert.equal(seen[0].valid, true);
});

test('confirm requires a second activation before emitting', async () => {
  const el = document.createElement('dv-confirm');
  el.setAttribute('data-value', 'account-1');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:confirm', (event) => seen.push(event.detail));
  el.querySelector('button').click();
  await settle();
  assert.equal(el.querySelectorAll('button').length, 2);
  el.querySelector('button').click();
  await settle();
  assert.deepEqual(seen, [{ value: 'account-1' }]);
});

test('autocomplete filters local items and emits a selected value', async () => {
  const el = document.createElement('dv-autocomplete');
  el.setAttribute('data-items', '["Keyboard", "Mouse"]');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:select', (event) => seen.push(event.detail.value));
  const input = el.querySelector('input');
  input.value = 'key';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();
  assert.equal(el.querySelectorAll('[role="option"]').length, 1);
  el.querySelector('[role="option"] button').click();
  await settle();
  assert.deepEqual(seen, ['Keyboard']);
});

test('data table sorts rows and emits its ordering', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', '["name"]');
  el.setAttribute('data-rows', '[{"name":"Zoe"},{"name":"Ada"}]');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:sort', (event) => seen.push(event.detail));
  el.querySelector('button').click();
  await settle();
  assert.equal(el.querySelector('tbody td').textContent, 'Ada');
  assert.deepEqual(seen, [{ key: 'name', direction: 'asc' }]);
});

test('field renders select options and retains native control semantics', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-control', 'select');
  el.setAttribute('data-options', '["Small", "Large"]');
  el.setAttribute('data-value', 'Large');
  document.body.appendChild(el);
  assert.equal(el.querySelector('select').value, 'Large');
});

test('cart changes quantities and emits current total', async () => {
  const el = document.createElement('dv-cart');
  el.setAttribute('data-items', '[{"id":"keyboard","name":"Keyboard","price":99}]');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:change', (event) => seen.push(event.detail.total));
  el.querySelector('[aria-label="Increase Keyboard"]').click();
  await settle();
  assert.equal(el.querySelector('output').textContent, '2');
  assert.deepEqual(seen, [198]);
});

test('toast stack queues and dismisses messages', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '0');
  document.body.appendChild(el);
  const id = el.show('Saved');
  await settle();
  assert.equal(el.querySelector('output').textContent, 'Saved×');
  el.dismiss(id);
  await settle();
  assert.equal(el.querySelector('output'), null);
});

test('state emits retry in its error state', async () => {
  const el = document.createElement('dv-state');
  el.setAttribute('data-state', 'error');
  document.body.appendChild(el);
  let retried = false;
  el.addEventListener('dv:retry', () => { retried = true; });
  el.querySelector('button').click();
  await settle();
  assert.equal(retried, true);
});
