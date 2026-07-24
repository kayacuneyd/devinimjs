/**
 * Depth tests for <dv-toast-stack> (TASK-003). The one happy-path smoke test in
 * `atomic-components.test.js` is left in place; this file adds the ADR-0015 timer/onCleanup
 * regression coverage and multi-toast behavior.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-toast-stack.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** happy-dom never runs real CSS — simulate the browser having finished an item's exit transition. */
const finishExit = (el) => el.dispatchEvent(new window.Event('transitionend', { bubbles: true }));

test('multiple concurrent toasts render independently and keep insertion order', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '0');
  document.body.appendChild(el);

  const first = el.show('Saved');
  const second = el.show('Uploading…');
  const third = el.show('Synced');
  await settle();

  assert.deepEqual(
    [...el.querySelectorAll('output')].map((o) => o.textContent),
    ['Saved×', 'Uploading…×', 'Synced×'],
  );

  el.dismiss(second);
  await settle();
  // The dismissed item stays mounted (ADR-0018) through its exit transition — still 3 items,
  // the middle one now marked leaving — instead of vanishing from the array instantly.
  const midLeave = [...el.querySelectorAll('output')];
  assert.deepEqual(midLeave.map((o) => o.textContent), ['Saved×', 'Uploading…×', 'Synced×']);
  assert.equal(midLeave[1].hasAttribute('data-leaving'), true);

  finishExit(midLeave[1]);
  await settle();
  assert.deepEqual(
    [...el.querySelectorAll('output')].map((o) => o.textContent),
    ['Saved×', 'Synced×'],
  );
  assert.notEqual(first, third);
});

test('dismissing one toast auto-dismisses independently of the others\' timers', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '15');
  document.body.appendChild(el);

  el.show('short-lived'); // locks in duration=15 for this toast at call time
  el.setAttribute('data-duration', '9999'); // only affects toasts shown from this point on
  el.show('long-lived');
  await settle();
  assert.equal(el.querySelectorAll('output').length, 2);

  await new Promise((resolve) => setTimeout(resolve, 25)); // past the first toast's 15ms duration
  assert.equal(el.querySelectorAll('output').length, 2, 'the auto-dismissed item lingers mid-exit-transition (ADR-0018)');
  const leaving = el.querySelector('output[data-leaving]');
  assert.ok(leaving, 'the short-lived toast is the one mid-leave');
  finishExit(leaving);
  await settle();
  const remaining = [...el.querySelectorAll('output')].map((o) => o.textContent);
  assert.deepEqual(remaining, ['long-lived×']);
});

test('dismiss-before-timeout is idempotent-safe and does not re-fire dv:hide when the original timer would have elapsed (ADR-0015)', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '20');
  document.body.appendChild(el);
  const id = el.show('Saved');
  await settle();

  const hides = [];
  el.addEventListener('dv:hide', (e) => hides.push(e.detail.id));
  el.dismiss(id); // well before the 20ms auto-dismiss would fire
  await settle();
  assert.deepEqual(hides, [id]);
  finishExit(el.querySelector(`[data-key="${id}"]`));
  await settle();
  assert.equal(el.querySelectorAll('output').length, 0, 'removed once its (simulated) exit transition completes');

  // Wait past the original duration: if the pending setTimeout/onCleanup pairing were not
  // cleared correctly, a stale timer could still invoke dismiss(id) again.
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.deepEqual(hides, [id], 'no duplicate/stale dv:hide from the already-cleared timer');
  assert.equal(el.querySelectorAll('output').length, 0);
});

test('a leaving item is never re-dismissed (no duplicate dv:hide, no duplicate exit wait)', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '0');
  document.body.appendChild(el);
  const id = el.show('Saved');
  await settle();

  const hides = [];
  el.addEventListener('dv:hide', (e) => hides.push(e.detail.id));
  el.dismiss(id);
  el.dismiss(id); // already leaving — must be a no-op, not a second dv:hide/exit-transition wait
  await settle();
  assert.deepEqual(hides, [id]);

  finishExit(el.querySelector(`[data-key="${id}"]`));
  await settle();
  assert.equal(el.querySelectorAll('output').length, 0);
});

test('a consumer with no CSS transition still removes the item, via the primitive\'s timeout fallback (ADR-0018)', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '0');
  document.body.appendChild(el);
  const id = el.show('Saved');
  await settle();

  el.dismiss(id);
  await settle();
  assert.equal(el.querySelectorAll('output').length, 1, 'not yet — no transitionend dispatched and the fallback has not elapsed');

  // No transitionend is ever dispatched here — this exercises the primitive's own 200ms
  // default timeout fallback end to end through the component.
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(el.querySelectorAll('output').length, 0, 'the timeout fallback must still remove it — never a stuck/broken UI (ADR-0018)');
});

test('duration=0 disables the auto-dismiss timer entirely', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '0');
  document.body.appendChild(el);
  el.show('Persistent');
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(el.querySelectorAll('output').length, 1, 'still present — no timer was ever scheduled');
});

test('the × button dismisses only the toast it belongs to', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '0');
  document.body.appendChild(el);
  el.show('First');
  el.show('Second');
  await settle();

  const buttons = el.querySelectorAll('button[aria-label="Dismiss"]');
  buttons[0].click();
  await settle();
  finishExit(el.querySelector('output[data-leaving]'));
  await settle();
  assert.deepEqual([...el.querySelectorAll('output')].map((o) => o.textContent), ['Second×']);
});

test('disconnecting the stack clears all pending timers without throwing (ADR-0015 disconnect cleanup)', async () => {
  const el = document.createElement('dv-toast-stack');
  el.setAttribute('data-duration', '10');
  document.body.appendChild(el);
  el.show('One');
  el.show('Two');
  await settle();
  assert.doesNotThrow(() => el.remove());
  await new Promise((resolve) => setTimeout(resolve, 20)); // past the timers — must not error
});
