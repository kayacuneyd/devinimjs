import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/__TAG__.js');

test('__TAG__ upgrades and renders', () => {
  const el = document.createElement('__TAG__');
  document.body.appendChild(el);
  assert.ok(el);
});
