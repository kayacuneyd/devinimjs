/**
 * Tests for the dev-only debug hook (ADR-0026): __DEVINIM_DEBUG__ exposes defined tags,
 * live components with state snapshots and created stores.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { BaseComponent, html, define, createStore } = await import('../../src/core/core.js');
const { installDebug } = await import('../../src/core/debug.js');

test('installDebug exposes tags, live components with state, and stores', async () => {
  class DvProbe extends BaseComponent {
    initialState() {
      return { count: 3 };
    }
    template() {
      return html`<p>${this.state.count}</p>`;
    }
  }
  define('dv-probe', DvProbe);

  const host = {};
  const debug = installDebug(host);
  assert.equal(host.__DEVINIM_DEBUG__, debug);

  createStore({ cart: { items: 2 } });
  const el = document.createElement('dv-probe');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.ok(debug.tags().includes('dv-probe'));
  const live = debug.components().filter((entry) => entry.tag === 'dv-probe');
  assert.equal(live.length, 1);
  assert.deepEqual(live[0].state, { count: 3 });
  assert.ok(debug.stores().some((state) => state?.cart?.items === 2));

  el.remove();
  assert.equal(debug.components().filter((entry) => entry.tag === 'dv-probe').length, 0);
});
