/**
 * Depth tests for <dv-field> (TASK-003). The two happy-path smoke tests in
 * `atomic-components.test.js` are left in place; this file adds validity-state coverage per
 * control type and a regression test for the "render field boolean attributes correctly" fix
 * (commit bcdfa04).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-field.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Fires input+change together, like a real user edit finishing on blur.
 *
 * @param {HTMLElement} input - The field control.
 */
function fireInputAndChange(input) {
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
}

test('required input: invalid while empty, valid once filled (validity per control type — input)', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-required', 'true');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:change', (e) => seen.push(e.detail.valid));
  const input = el.querySelector('input');

  input.value = '';
  fireInputAndChange(input);
  await settle();
  assert.equal(input.getAttribute('aria-invalid'), 'true');

  input.value = 'Ada';
  fireInputAndChange(input);
  await settle();
  assert.equal(input.getAttribute('aria-invalid'), 'false');
  assert.deepEqual(seen, [false, true]);
});

test('required textarea reports the same validity contract (validity per control type — textarea)', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-control', 'textarea');
  el.setAttribute('data-required', 'true');
  document.body.appendChild(el);
  const textarea = el.querySelector('textarea');

  textarea.value = '';
  fireInputAndChange(textarea);
  await settle();
  assert.equal(textarea.getAttribute('aria-invalid'), 'true');

  textarea.value = 'Notes';
  fireInputAndChange(textarea);
  await settle();
  assert.equal(textarea.getAttribute('aria-invalid'), 'false');
});

test('required select reports the same validity contract (validity per control type — select)', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-control', 'select');
  el.setAttribute('data-required', 'true');
  el.setAttribute('data-options', JSON.stringify(['', 'Small', 'Large']));
  document.body.appendChild(el);
  const select = el.querySelector('select');

  select.value = '';
  fireInputAndChange(select);
  await settle();
  assert.equal(select.getAttribute('aria-invalid'), 'true');

  select.value = 'Large';
  fireInputAndChange(select);
  await settle();
  assert.equal(select.getAttribute('aria-invalid'), 'false');
});

test('regression (commit bcdfa04): required/disabled render as bare boolean attributes, not "true"/"false" strings', () => {
  const required = document.createElement('dv-field');
  required.setAttribute('data-required', 'true');
  document.body.appendChild(required);
  const input = required.querySelector('input');
  assert.equal(input.hasAttribute('required'), true);
  assert.notEqual(input.getAttribute('required'), 'false');

  const notRequired = document.createElement('dv-field');
  document.body.appendChild(notRequired);
  assert.equal(notRequired.querySelector('input').hasAttribute('required'), false);

  const disabled = document.createElement('dv-field');
  disabled.setAttribute('data-disabled', 'true');
  document.body.appendChild(disabled);
  assert.equal(disabled.querySelector('input').hasAttribute('disabled'), true);
});

test('regression (commit bcdfa04): boolean attributes render correctly for textarea and select too', () => {
  const textarea = document.createElement('dv-field');
  textarea.setAttribute('data-control', 'textarea');
  textarea.setAttribute('data-required', 'true');
  textarea.setAttribute('data-disabled', 'true');
  document.body.appendChild(textarea);
  const ta = textarea.querySelector('textarea');
  assert.equal(ta.hasAttribute('required'), true);
  assert.equal(ta.hasAttribute('disabled'), true);

  const select = document.createElement('dv-field');
  select.setAttribute('data-control', 'select');
  select.setAttribute('data-required', 'true');
  document.body.appendChild(select);
  assert.equal(select.querySelector('select').hasAttribute('required'), true);
});

// SUSPECTED REAL BUG (reported in the handoff, not fixed here — out of scope for a test-only
// task): the inline error <p> uses UNQUOTED `hidden=${!this.state.invalid}` (dv-field.js line
// 49), unlike every other boolean attribute in this codebase, which always writes the quoted
// `attr="${value}"` form the `html` tag's boolean-omission rule (ADR-0002 #5) actually requires.
// Consequence, verified directly against `html()`'s output: when the interpolated value is
// `false` (i.e. exactly when the field IS invalid and the message should become visible), the
// tag function has no sole-attribute match, so it falls through to plain string rendering.
// `false` renders as '', producing the raw fragment `<p hidden= role="alert">…`, which an HTML
// parser reads as `hidden="role"` plus a stray `alert=""` attribute — `role="alert"` is
// destroyed and the element stays `hidden` even though it should now be visible. Net effect: a
// required field's validation message never actually appears to sighted users, and never carries
// `role="alert"` for assistive tech either. This test pins the current (broken) behavior so a
// future fix flips it, rather than silently asserting around the bug.
test('KNOWN BUG: the invalid-state error message never becomes visible or keeps role="alert" (unquoted hidden=${…} in dv-field.js)', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-required', 'true');
  document.body.appendChild(el);
  const input = el.querySelector('input');

  input.value = '';
  fireInputAndChange(input);
  await settle();

  assert.equal(input.getAttribute('aria-invalid'), 'true', 'the input itself does correctly report invalid');
  // What SHOULD be true once fixed: el.querySelector('[role="alert"]') is non-null and .hidden
  // is false. What IS actually true today:
  assert.equal(el.querySelector('[role="alert"]'), null, 'role="alert" is lost due to the malformed attribute string');
  assert.equal(el.querySelector('p').hidden, true, 'the error message stays hidden even though the field is invalid');
});

test('a live data-value change resets the field value (ADR-0005 sync)', async () => {
  const el = document.createElement('dv-field');
  el.setAttribute('data-value', 'first');
  document.body.appendChild(el);
  assert.equal(el.querySelector('input').getAttribute('value'), 'first');
  el.setAttribute('data-value', 'second');
  await settle();
  assert.equal(el.querySelector('input').getAttribute('value'), 'second');
});
