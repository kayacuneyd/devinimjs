/**
 * Tests for createStore + BaseComponent.useStore/requestUpdate (ADR-0011) on happy-dom.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { BaseComponent, html, define, createStore } = await import('../../src/core/core.js');

// Flushes the microtask queue so batched renders settle.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('store subscribers are notified with the changed path; unsubscribe works', () => {
  const store = createStore({ user: { name: 'Ada' }, count: 0 });
  const paths = [];
  const unsubscribe = store.subscribe((p) => paths.push(p));

  store.state.count = 5;
  store.state.user.name = 'Grace';
  assert.deepEqual(paths, ['count', 'user.name']);

  unsubscribe();
  store.state.count = 6;
  assert.equal(paths.length, 2);
});

test('useStore re-renders subscribed components on store change', async () => {
  const store = createStore({ count: 0 });

  class DvBadge extends BaseComponent {
    connected() {
      this.useStore(store);
    }
    template() {
      return html`<span class="badge">${store.state.count}</span>`;
    }
  }
  define('dv-badge', DvBadge);

  const a = document.createElement('dv-badge');
  const b = document.createElement('dv-badge');
  document.body.append(a, b);

  store.state.count = 7;
  await settle();

  assert.equal(a.querySelector('.badge').textContent, '7');
  assert.equal(b.querySelector('.badge').textContent, '7');
});

test('disconnect unsubscribes: detached components no longer re-render', async () => {
  const store = createStore({ count: 0 });

  class DvChip extends BaseComponent {
    connected() {
      this.useStore(store);
    }
    template() {
      return html`<span>${store.state.count}</span>`;
    }
  }
  define('dv-chip', DvChip);

  const el = document.createElement('dv-chip');
  document.body.appendChild(el);
  store.state.count = 1;
  await settle();
  assert.equal(el.querySelector('span').textContent, '1');

  el.remove();
  store.state.count = 2;
  await settle();
  assert.equal(el.querySelector('span').textContent, '1'); // frozen after disconnect
});

test('requestUpdate re-renders without a state change and reports <external>', async () => {
  let external = 0;
  const seen = [];

  class DvClock extends BaseComponent {
    tick() {
      external++;
      this.requestUpdate();
    }
    updated(keys) {
      seen.push(keys);
    }
    template() {
      return html`<span>${external}</span>`;
    }
  }
  define('dv-clock', DvClock);

  const el = document.createElement('dv-clock');
  document.body.appendChild(el);
  assert.equal(el.querySelector('span').textContent, '0');

  el.tick();
  await settle();
  assert.equal(el.querySelector('span').textContent, '1');
  assert.deepEqual(seen, [['<external>']]);
});
