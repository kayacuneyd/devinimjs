import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-disclosure.js');

test('disclosure preserves light-DOM content and updates ARIA state', async () => {
  const el = document.createElement('dv-disclosure');
  el.setAttribute('data-summary', 'More details');
  el.innerHTML = '<p>Server rendered content</p>';
  document.body.appendChild(el);

  const button = el.querySelector('button');
  const panel = el.querySelector('[id$="-panel"]');
  assert.equal(button.textContent.trim(), 'More details');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true);
  assert.equal(panel.querySelector('p').textContent, 'Server rendered content');

  const events = [];
  el.addEventListener('dv:toggle', (event) => events.push(event.detail.open));
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.hidden, false);
  assert.deepEqual(events, [true]);
});

test('a live data-open attribute change opens/closes the panel (ADR-0005 sync)', async () => {
  const el = document.createElement('dv-disclosure');
  document.body.appendChild(el);
  const button = el.querySelector('button');
  const panel = el.querySelector('[id$="-panel"]');
  assert.equal(panel.hidden, true);

  el.setAttribute('data-open', 'true');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(panel.hidden, false);
  assert.equal(button.getAttribute('aria-expanded'), 'true');

  el.setAttribute('data-open', 'false');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(panel.hidden, false, 'still mounted/visible mid-collapse-transition (ADR-0018)');
  assert.equal(panel.hasAttribute('data-leaving'), true);

  // happy-dom never runs real CSS — simulate the browser having finished the collapse
  // transition (tests/unit/transition.test.js covers the primitive's own timeout fallback).
  panel.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(panel.hidden, true);
});

test('a consumer with no CSS transition still reaches hidden, via the primitive\'s timeout fallback (ADR-0018)', async () => {
  const el = document.createElement('dv-disclosure');
  el.setAttribute('data-open', 'true');
  document.body.appendChild(el);
  const panel = el.querySelector('[id$="-panel"]');
  assert.equal(panel.hidden, false);

  el.querySelector('button').click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(panel.hidden, false, 'not yet — nothing dispatched a transitionend and the fallback has not elapsed');

  // No transitionend is ever dispatched here — this exercises the primitive's own 200ms
  // default timeout fallback end to end through the component.
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(panel.hidden, true, 'the timeout fallback must still hide it — never a stuck/broken UI (ADR-0018)');
});
