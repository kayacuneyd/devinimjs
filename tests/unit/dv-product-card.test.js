/**
 * One extra edge-case test for <dv-product-card> (TASK-003 priority 7, best-effort). The
 * happy-path smoke test lives in `atomic-components.test.js` and is left in place.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-product-card.js');
const { setLocale } = await import('../../src/core/i18n.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('missing data attributes fall back to defaults (name "Product", price 0) and still emit', async () => {
  const el = document.createElement('dv-product-card');
  document.body.appendChild(el);
  assert.equal(el.querySelector('h3').textContent, 'Product');
  assert.equal(el.querySelector('p').textContent, '0');

  const seen = [];
  el.addEventListener('dv:add-to-cart', (e) => seen.push(e.detail));
  el.querySelector('button').click();
  await settle();
  assert.deepEqual(seen, [{ id: '', name: 'Product', price: 0 }]);
});

// i18n primitive reference wiring (ADR-0019). Only the add-to-cart button's `action` text is
// wired — `name`'s 'Product' fallback is a deliberately unwired placeholder default, see
// `dv-product-card.locale.js` and the TASK-011 handoff for the judgment call.

test('the active locale bundle drives the add-to-cart button text when no data-* override is set', async () => {
  const el = document.createElement('dv-product-card');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('button').textContent, 'Sepete ekle');
  } finally {
    setLocale(null);
  }
});

test('a data-action override still wins over the active locale bundle (ADR-0005 regression)', async () => {
  const el = document.createElement('dv-product-card');
  el.setAttribute('data-action', 'Buy now');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('button').textContent, 'Buy now', 'the explicit override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('the add-to-cart button text falls back to the unchanged hardcoded default with no locale/override set', () => {
  const el = document.createElement('dv-product-card');
  document.body.appendChild(el);
  assert.equal(el.querySelector('button').textContent, 'Add to cart');
});
