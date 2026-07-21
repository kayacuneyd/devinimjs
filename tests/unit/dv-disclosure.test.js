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
