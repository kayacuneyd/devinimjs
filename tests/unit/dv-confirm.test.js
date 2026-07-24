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
const { setLocale } = await import('../../src/core/i18n.js');
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

// i18n primitive reference wiring (ADR-0019).

test('the tr locale bundle drives the button, message and both action labels when no data-* override is set', async () => {
  const el = document.createElement('dv-confirm');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('button').textContent, 'Sil');

    el.querySelector('button').click();
    await settle();
    const [confirmButton, cancelButton] = el.querySelectorAll('button');
    assert.equal(el.querySelector('.dv-confirm').getAttribute('aria-label'), 'İşlemi onayla');
    assert.equal(el.querySelector('span > span').textContent, 'Emin misiniz?');
    assert.equal(confirmButton.textContent, 'Onayla');
    assert.equal(cancelButton.textContent, 'Vazgeç');
  } finally {
    setLocale(null);
  }
});

test('a data-confirm-label override still wins over the active locale bundle (ADR-0005 regression)', async () => {
  const el = document.createElement('dv-confirm');
  el.setAttribute('data-confirm-label', 'Evet, sil');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    el.querySelector('button').click();
    await settle();
    const [confirmButton] = el.querySelectorAll('button');
    assert.equal(confirmButton.textContent, 'Evet, sil', 'the explicit override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});
