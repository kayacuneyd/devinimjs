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
  assert.deepEqual(events, ['open', 'close'], 'dv:close fires immediately, not deferred to the exit transition');
  assert.equal(backdrop.hidden, false, 'still mounted/visible mid-exit-transition (ADR-0018)');
  assert.equal(backdrop.hasAttribute('data-leaving'), true);

  // happy-dom never runs real CSS, so a genuine transitionend never fires — simulate the
  // browser having finished the exit transition (see tests/unit/transition.test.js for the
  // primitive's own timeout-fallback coverage, exercised when nothing dispatches this at all).
  backdrop.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  await settle();
  assert.equal(backdrop.hidden, true);
});

test('a consumer with no CSS transition still reaches hidden, via the primitive\'s timeout fallback (ADR-0018)', async () => {
  const el = document.createElement('dv-modal');
  document.body.appendChild(el);
  el.open();
  await settle();
  const backdrop = el.querySelector('.dv-modal-backdrop');
  assert.equal(backdrop.hidden, false);

  el.close();
  await settle();
  assert.equal(backdrop.hidden, false, 'not yet — nothing dispatched a transitionend and the fallback has not elapsed');

  // No transitionend is ever dispatched here (unlike the other close tests) — this exercises
  // the primitive's own 200ms default timeout fallback end to end through the component.
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(backdrop.hidden, true, 'the timeout fallback must still hide it — never a stuck/broken UI (ADR-0018)');
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
  assert.equal(document.activeElement, opener, 'focus returns to the opener immediately, independent of the exit transition');
  const backdrop = el.querySelector('.dv-modal-backdrop');
  backdrop.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  await settle();
  assert.equal(backdrop.hidden, true);
  opener.remove();
});

test('a live data-open attribute change opens/closes the dialog (ADR-0005 sync)', async () => {
  const el = document.createElement('dv-modal');
  document.body.appendChild(el);
  el.setAttribute('data-open', 'true');
  await settle();
  const backdrop = el.querySelector('.dv-modal-backdrop');
  assert.equal(backdrop.hidden, false);
  el.setAttribute('data-open', 'false');
  await settle();
  assert.equal(backdrop.hidden, false, 'still visible mid-exit-transition (ADR-0018)');
  backdrop.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  await settle();
  assert.equal(backdrop.hidden, true);
});

// WAI-ARIA APG focus trap (docs/roadmap.md P1, closed by TASK-006). Focusable order inside the
// dialog is DOM order: the header's close (×) button always comes first (it precedes
// `.dv-modal-content` in the template), then whatever the dialog's light-DOM content contributes.

test('Tab from the last focusable element in the dialog wraps focus to the first (WAI-ARIA APG focus trap)', async () => {
  const outsideAfter = document.createElement('button');
  outsideAfter.textContent = 'Outside, after the modal in DOM order';
  document.body.appendChild(outsideAfter);

  const el = document.createElement('dv-modal');
  el.innerHTML = '<button id="last-field">Last field in the dialog</button>';
  document.body.appendChild(el);
  el.open();
  await settle();

  const closeButton = el.querySelector('[aria-label="Close"]');
  const lastField = el.querySelector('#last-field');
  lastField.focus();
  assert.equal(document.activeElement, lastField);

  const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  lastField.dispatchEvent(tabEvent);
  assert.equal(tabEvent.defaultPrevented, true, 'the trap must intercept Tab at the last focusable element');
  assert.equal(document.activeElement, closeButton, 'focus must wrap to the first focusable element (the close button)');

  el.close();
  await settle();
  outsideAfter.remove();
});

test('Shift+Tab from the first focusable element (the close button) wraps focus to the last', async () => {
  const el = document.createElement('dv-modal');
  el.innerHTML = '<button id="last-field">Last field in the dialog</button>';
  document.body.appendChild(el);
  el.open();
  await settle();

  const closeButton = el.querySelector('[aria-label="Close"]');
  const lastField = el.querySelector('#last-field');
  closeButton.focus();
  assert.equal(document.activeElement, closeButton);

  const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
  closeButton.dispatchEvent(shiftTabEvent);
  assert.equal(shiftTabEvent.defaultPrevented, true, 'the trap must intercept Shift+Tab at the first focusable element');
  assert.equal(document.activeElement, lastField, 'focus must wrap to the last focusable element');

  el.close();
  await settle();
});

test('Tab away from the edges of the dialog is left alone (only the wrap points are intercepted)', async () => {
  const el = document.createElement('dv-modal');
  el.innerHTML = '<input id="middle-field"><button id="last-field">Last field</button>';
  document.body.appendChild(el);
  el.open();
  await settle();

  const middleField = el.querySelector('#middle-field');
  middleField.focus();
  const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  middleField.dispatchEvent(tabEvent);
  assert.equal(tabEvent.defaultPrevented, false, 'Tab from a non-edge focusable element must not be intercepted');

  el.close();
  await settle();
});

test('nested modals: the trap applies to the topmost open modal and reverts when it closes', async () => {
  const modalA = document.createElement('dv-modal');
  modalA.innerHTML = '<button id="a-last">A last field</button>';
  document.body.appendChild(modalA);
  modalA.open();
  await settle();

  const aCloseButton = modalA.querySelector('[aria-label="Close"]');
  const aLastField = modalA.querySelector('#a-last');

  // Open a second modal while the first is still open (e.g. a confirmation dialog launched from
  // within a form dialog) — the opener is an element inside modal A.
  const modalB = document.createElement('dv-modal');
  modalB.innerHTML = '<button id="b-last">B last field</button>';
  document.body.appendChild(modalB);
  modalB.open(new window.Event('click'), aLastField);
  await settle();

  const bCloseButton = modalB.querySelector('[aria-label="Close"]');
  const bLastField = modalB.querySelector('#b-last');
  assert.equal(document.activeElement, modalB.querySelector('[role="dialog"]'), 'opening modal B auto-focuses its own dialog');

  // The topmost modal (B) owns the Tab trap: Tab from B's last field wraps inside B.
  bLastField.focus();
  const tabInB = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  bLastField.dispatchEvent(tabInB);
  assert.equal(tabInB.defaultPrevented, true, 'the topmost modal (B) must own the Tab trap while both are open');
  assert.equal(document.activeElement, bCloseButton, 'Tab wraps within B, not out to A or the page');

  // A's trap must not fight B's while B is open: even if focus strays back into the background
  // dialog (A), A defers to whichever modal is topmost in the open-modal stack.
  aLastField.focus();
  const tabInA = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  aLastField.dispatchEvent(tabInA);
  assert.equal(tabInA.defaultPrevented, false, "a background modal's trap must not compete with the topmost modal's");

  // Closing B returns focus to its recorded opener (inside A) and hands the trap back to A.
  modalB.close();
  await settle();
  assert.equal(document.activeElement, aLastField, 'closing B returns focus to its opener inside A');

  const tabInAAfterBCloses = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  aLastField.dispatchEvent(tabInAAfterBCloses);
  assert.equal(tabInAAfterBCloses.defaultPrevented, true, "A's trap resumes once B closes");
  assert.equal(document.activeElement, aCloseButton, 'Tab wraps within A again after B closes');

  modalA.close();
  await settle();
});
