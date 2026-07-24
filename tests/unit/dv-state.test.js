/**
 * One extra edge-case test for <dv-state> (TASK-003 priority 7, best-effort). The happy-path
 * smoke test lives in `atomic-components.test.js` and is left in place.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-state.js');
const { setLocale } = await import('../../src/core/i18n.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('a live data-state change cycles through loading/error/empty and back', async () => {
  const el = document.createElement('dv-state');
  document.body.appendChild(el);
  assert.equal(el.querySelector('p').textContent, 'Nothing to show yet.');
  assert.equal(el.querySelector('[role="alert"]'), null);

  el.setAttribute('data-state', 'loading');
  await settle();
  assert.equal(el.querySelector('[role="status"]').textContent, 'Loading…');
  assert.equal(el.querySelector('button'), null, 'no retry control while loading');

  el.setAttribute('data-state', 'error');
  await settle();
  assert.equal(el.querySelector('[role="alert"] button'), el.querySelector('button'));

  el.setAttribute('data-state', 'empty');
  await settle();
  assert.equal(el.querySelector('p').textContent, 'Nothing to show yet.');
  assert.equal(el.querySelector('button'), null);
});

// i18n primitive reference wiring (ADR-0019). Only `loading`/`error`/`retryLabel`/`empty` are
// wired — `state` stays on `this.str()` (selects a render branch, not copy, per
// docs/guides/i18n.md §1). `retryLabel` also fixes a pre-existing bug: the component used to
// call `this.str('retry-label', 'Try again')`, a literal kebab-case dataset key that
// `HTMLElement.dataset` never actually exposes (ADR-0005) — see dv-state.locale.js for detail.

test('the active locale bundle drives loading/error/retry/empty copy across every state when no data-* override is set', async () => {
  const el = document.createElement('dv-state');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('p').textContent, 'Henüz gösterilecek bir şey yok.');

    el.setAttribute('data-state', 'loading');
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('[role="status"]').textContent, 'Yükleniyor…');

    el.setAttribute('data-state', 'error');
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('[role="alert"] p').textContent, 'Bir şeyler ters gitti.');
    assert.equal(el.querySelector('button').textContent, 'Tekrar dene');
  } finally {
    setLocale(null);
  }
});

test('data-* overrides for error/retry-label still win over the active locale bundle (ADR-0005 regression)', async () => {
  const el = document.createElement('dv-state');
  el.setAttribute('data-state', 'error');
  el.setAttribute('data-error', 'Custom failure copy.');
  el.setAttribute('data-retry-label', 'Retry now');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('[role="alert"] p').textContent, 'Custom failure copy.', 'the explicit error override must still win over the tr bundle entry');
    assert.equal(el.querySelector('button').textContent, 'Retry now', 'the explicit retry-label override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('the unchanged fallback copy still applies with no locale override and no data-* override', () => {
  const el = document.createElement('dv-state');
  el.setAttribute('data-state', 'error');
  document.body.appendChild(el);
  assert.equal(el.querySelector('[role="alert"] p').textContent, 'Something went wrong.');
  assert.equal(el.querySelector('button').textContent, 'Try again');
});
