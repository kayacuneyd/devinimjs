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

test('an initially-open modal (data-open) focuses the dialog on connect', async () => {
  const el = document.createElement('dv-modal');
  el.setAttribute('data-open', 'true');
  el.setAttribute('data-label', 'Welcome');
  document.body.appendChild(el);
  assert.equal(el.querySelector('.dv-modal-backdrop').hidden, false);
  await settle(); // #focusDialog() queues focus with queueMicrotask
  assert.equal(document.activeElement, el.querySelector('[role="dialog"]'));
});

test('opener-focus-return: closing the dialog restores focus to the element that opened it', async () => {
  const opener = document.createElement('button');
  opener.textContent = 'Delete';
  document.body.appendChild(opener);

  const el = document.createElement('dv-modal');
  document.body.appendChild(el);

  // Real usage: a page wires a trigger button with data-on:click="open" on the <dv-modal>, so
  // `open(event, el)` receives the opener element as its second argument.
  el.open(new window.Event('click'), opener);
  await settle();
  assert.equal(document.activeElement, el.querySelector('[role="dialog"]'));

  el.close();
  await settle();
  assert.equal(document.activeElement, opener, 'focus must return to the recorded opener, not just anywhere');
  opener.remove();
});

test('the close (×) button also closes the dialog and returns focus to the opener', async () => {
  const opener = document.createElement('button');
  document.body.appendChild(opener);
  const el = document.createElement('dv-modal');
  document.body.appendChild(el);

  el.open(new window.Event('click'), opener);
  await settle();
  el.querySelector('[aria-label="Close"]').click();
  await settle();
  assert.equal(el.querySelector('.dv-modal-backdrop').hidden, true);
  assert.equal(document.activeElement, opener);
  opener.remove();
});

test('a live data-open attribute change opens/closes the dialog (ADR-0005 sync)', async () => {
  const el = document.createElement('dv-modal');
  document.body.appendChild(el);
  el.setAttribute('data-open', 'true');
  await settle();
  assert.equal(el.querySelector('.dv-modal-backdrop').hidden, false);
  el.setAttribute('data-open', 'false');
  await settle();
  assert.equal(el.querySelector('.dv-modal-backdrop').hidden, true);
});

// KNOWN LIMITATION (docs/roadmap.md P1 — "dv-modal has no real focus-trap cycling or
// nested-modal handling"). This test documents the current gap rather than silently asserting
// around it: Tab from the last focusable element inside the dialog is expected (by the WAI-ARIA
// APG dialog pattern) to cycle back to the first one, but nothing in dv-modal.js intercepts Tab,
// so focus is free to leave the dialog into the rest of the page. When a real focus trap ships,
// this test should start failing and can be rewritten to assert the cycling behavior instead.
test('KNOWN GAP: Tab is not trapped inside the dialog — focus can leave it (docs/roadmap.md P1)', async () => {
  const outsideAfter = document.createElement('button');
  outsideAfter.textContent = 'Outside, after the modal in DOM order';
  document.body.appendChild(outsideAfter);

  const el = document.createElement('dv-modal');
  el.innerHTML = '<button id="last-field">Last field in the dialog</button>';
  document.body.appendChild(el);
  el.open();
  await settle();

  const lastFieldInDialog = el.querySelector('#last-field');
  lastFieldInDialog.focus();
  assert.equal(document.activeElement, lastFieldInDialog);

  // No keydown handler for Tab exists in dv-modal.js (only Escape is handled), so dispatching
  // Tab here has no framework-level effect at all — a real focus trap would call
  // preventDefault() and move focus back to the dialog's first focusable element instead.
  // happy-dom does not simulate the browser's native Tab-traversal default action, so this test
  // demonstrates the *absence* of interception, not an actual escape of focus in this harness —
  // documented explicitly rather than asserted as if it were verified end-to-end (that requires
  // the real-browser Playwright layer, ADR-0008).
  const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  lastFieldInDialog.dispatchEvent(tabEvent);
  assert.equal(tabEvent.defaultPrevented, false, 'no focus-trap code path calls preventDefault() on Tab');
  outsideAfter.remove();
});
