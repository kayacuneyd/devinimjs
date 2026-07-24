/**
 * Depth tests for <dv-autocomplete> (TASK-003). The one happy-path smoke test in
 * `atomic-components.test.js` is left in place; this file adds edge-case, no-match and
 * cleanup-timing coverage modeled on `dv-tabs.test.js`.
 *
 * Note (see handoff): the component has no dedicated keyboard-navigation handler (no
 * `data-on:keydown` anywhere in its template) — arrow/Enter/Escape keys do nothing beyond
 * native `<input>` behavior. Only mouse/click selection and blur-triggered close are real,
 * so "keyboard nav" from the task description is covered here as a documented gap, not as
 * passing keyboard-activation tests that would misrepresent the component.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of [
  'HTMLElement', 'Element', 'Node', 'CustomEvent', 'KeyboardEvent', 'document', 'customElements',
]) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-autocomplete.js');
const { setLocale } = await import('../../src/core/i18n.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * @param {string[]} items - Local suggestion items.
 * @returns {Element} A mounted <dv-autocomplete>.
 */
function makeAutocomplete(items) {
  const el = document.createElement('dv-autocomplete');
  el.setAttribute('data-items', JSON.stringify(items));
  document.body.appendChild(el);
  return el;
}

/**
 * @param {Element} el - Autocomplete host.
 * @param {string} value - Text to type.
 */
function type(el, value) {
  const input = el.querySelector('input');
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

test('no-match query renders an empty, visible listbox (no options)', async () => {
  const el = makeAutocomplete(['Keyboard', 'Mouse']);
  type(el, 'zzz-no-match');
  await settle();
  const list = el.querySelector('ul[role="listbox"]');
  assert.equal(list.hidden, false);
  assert.equal(list.querySelectorAll('[role="option"]').length, 0);
});

test('filtering is case-insensitive on the current query', async () => {
  const el = makeAutocomplete(['Keyboard', 'Mouse']);
  type(el, 'KEY');
  await settle();
  const options = [...el.querySelectorAll('[role="option"]')];
  assert.deepEqual(options.map((o) => o.textContent), ['Keyboard']);
});

test('selecting via mouse click emits dv:select, sets query and closes the list', async () => {
  const el = makeAutocomplete(['Keyboard', 'Mouse']);
  type(el, 'mou');
  await settle();
  const seen = [];
  el.addEventListener('dv:select', (event) => seen.push(event.detail.value));
  el.querySelector('[role="option"] button').click();
  await settle();
  assert.deepEqual(seen, ['Mouse']);
  assert.equal(el.querySelector('input').getAttribute('value'), 'Mouse');
  assert.equal(el.querySelector('ul[role="listbox"]').hidden, true);
});

test('close()\'s setTimeout is cleared by onCleanup when the component disconnects first (ADR-0015)', async () => {
  const el = makeAutocomplete(['Keyboard']);
  type(el, 'key'); // opens the list
  await settle();
  assert.equal(el.state.open, true);

  el.close(); // simulates the blur-triggered close: schedules setTimeout(() => open=false, 0)
  el.remove(); // disconnect BEFORE the 0ms timer's macrotask runs — onCleanup must fire
  await settle();

  // If the cleanup had not cleared the timer, the deferred callback would still try to flip
  // `open` back to false on a disconnected element. Re-attach and confirm state was left
  // untouched by the (cleared) timer, i.e. the cleanup actually fired.
  document.body.appendChild(el);
  assert.equal(el.state.open, true, 'the disconnect-time cleanup must have cancelled the pending close()');
});

test('close() still closes the list normally when the component stays connected', async () => {
  const el = makeAutocomplete(['Keyboard']);
  type(el, 'key');
  await settle();
  assert.equal(el.state.open, true);
  el.close();
  await settle();
  assert.equal(el.state.open, false);
});

test('a live data-items change replaces the suggestion pool', async () => {
  const el = makeAutocomplete(['Keyboard']);
  el.setAttribute('data-items', JSON.stringify(['Monitor', 'Mouse']));
  type(el, 'mo');
  await settle();
  const options = [...el.querySelectorAll('[role="option"]')].map((o) => o.textContent);
  assert.deepEqual(options, ['Monitor', 'Mouse']);
});

test('multiple instances get unique listbox ids', () => {
  const a = makeAutocomplete(['A']);
  const b = makeAutocomplete(['B']);
  const idA = a.querySelector('input').getAttribute('aria-controls');
  const idB = b.querySelector('input').getAttribute('aria-controls');
  assert.notEqual(idA, idB);
});

// i18n primitive reference wiring (ADR-0019).

test('the active locale bundle drives the label when no data-* override is set', async () => {
  const el = makeAutocomplete(['Keyboard']);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('label').textContent, 'Ara');
  } finally {
    setLocale(null);
  }
});

test('a data-label override still wins over the active locale bundle (ADR-0005 regression)', async () => {
  const el = makeAutocomplete(['Keyboard']);
  el.setAttribute('data-label', 'Find');
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('label').textContent, 'Find', 'the explicit override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('the label falls back to the unchanged hardcoded default with no locale/override set', () => {
  const el = makeAutocomplete(['Keyboard']);
  assert.equal(el.querySelector('label').textContent, 'Search');
});
