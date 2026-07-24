import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-toast.js');

/** happy-dom never runs real CSS — simulate the browser having finished the exit transition. */
const finishExit = (el) => el.dispatchEvent(new window.Event('transitionend', { bubbles: true }));

test('toast exposes an accessible message and auto-dismisses', async () => {
  const el = document.createElement('dv-toast');
  el.setAttribute('data-duration', '10');
  document.body.appendChild(el);
  el.show('Saved');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').textContent, 'Saved');
  assert.equal(el.querySelector('output').hidden, false);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(el.querySelector('output').hidden, false, 'still mounted/visible mid-exit-transition (ADR-0018)');
  assert.equal(el.querySelector('output').hasAttribute('data-leaving'), true);
  finishExit(el.querySelector('output'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').hidden, true);
});

test('calling show() again restarts the auto-dismiss timer instead of stacking a second one', async () => {
  const el = document.createElement('dv-toast');
  el.setAttribute('data-duration', '60');
  document.body.appendChild(el);
  el.show('First');
  await new Promise((resolve) => setTimeout(resolve, 20)); // well within the first 60ms window
  el.show('Second'); // restarts the 60ms window from here
  await new Promise((resolve) => setTimeout(resolve, 50)); // past the original 60ms mark, not the new one
  assert.equal(el.querySelector('output').hidden, false, 'the stale first timer must not have fired');
  assert.equal(el.querySelector('output').textContent, 'Second');
  await new Promise((resolve) => setTimeout(resolve, 30)); // now past the restarted timer too
  assert.equal(el.querySelector('output').hidden, false, 'still mounted/visible mid-exit-transition (ADR-0018)');
  finishExit(el.querySelector('output'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').hidden, true);
});

test('a consumer with no CSS transition still reaches hidden, via the primitive\'s timeout fallback (ADR-0018)', async () => {
  const el = document.createElement('dv-toast');
  document.body.appendChild(el);
  el.show('Saved');
  await new Promise((resolve) => setTimeout(resolve, 0));
  el.hide();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(el.querySelector('output').hidden, false, 'not yet — no transitionend dispatched and the fallback has not elapsed');

  // No transitionend is ever dispatched here — this exercises the primitive's own 200ms
  // default timeout fallback end to end through the component.
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(el.querySelector('output').hidden, true, 'the timeout fallback must still hide it — never a stuck/broken UI (ADR-0018)');
});

test('hide() while already closed is a no-op (no duplicate dv:hide)', async () => {
  const el = document.createElement('dv-toast');
  document.body.appendChild(el);
  const seen = [];
  el.addEventListener('dv:hide', () => seen.push(1));
  el.hide();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(seen, []);
});
