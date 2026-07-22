import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { component, html } = await import('../../src/core/authoring.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

before(() => { document.body.innerHTML = ''; });

component('acme-factory-counter', {
  props: { start: 0, step: 1, enabled: true, items: [] },
  state() { return { count: this.props.start }; },
  sync: {
    start(value) { this.state.count = value; },
  },
  actions: {
    increment() {
      if (this.props.enabled) this.state.count += this.props.step;
    },
  },
  view() {
    return html`<button type="button" on:click="increment">${this.state.count}:${this.props.items.length}</button>`;
  },
});

const lifecycle = [];
component('acme-factory-lifecycle', {
  props: { value: 'ready' },
  state() { return { value: this.props.value }; },
  sync: { value(value) { this.state.value = value; } },
  connected() { lifecycle.push(`connected:${this.props.value}`); },
  updated(keys) { lifecycle.push(`updated:${keys.join(',')}`); },
  disconnected() { lifecycle.push('disconnected'); },
  view() { return html`<output>${this.state.value}</output>`; },
});

test('component() registers a typed data-* props component', () => {
  const el = document.createElement('acme-factory-counter');
  el.setAttribute('data-start', '4');
  el.setAttribute('data-step', '3');
  el.setAttribute('data-enabled', 'false');
  el.setAttribute('data-items', '["one", "two"]');
  document.body.appendChild(el);

  assert.deepEqual(el.props, { start: 4, step: 3, enabled: false, items: ['one', 'two'] });
  assert.equal(el.querySelector('button').textContent, '4:2');
});

test('on:* dispatches factory actions and preserves legacy delegated behavior', async () => {
  const el = document.createElement('acme-factory-counter');
  el.setAttribute('data-start', '4');
  el.setAttribute('data-step', '3');
  document.body.appendChild(el);

  el.querySelector('button').click();
  await settle();
  assert.equal(el.querySelector('button').textContent, '7:0');
});

test('live props update and sync state through data-* attributes', async () => {
  const el = document.createElement('acme-factory-counter');
  document.body.appendChild(el);

  el.setAttribute('data-start', '12');
  await settle();

  assert.equal(el.props.start, 12);
  assert.equal(el.querySelector('button').textContent, '12:0');
});

test('props are read-only snapshots and documented lifecycle hooks retain BaseComponent semantics', async () => {
  lifecycle.length = 0;
  const el = document.createElement('acme-factory-lifecycle');
  document.body.appendChild(el);
  assert.deepEqual(lifecycle, ['connected:ready']);
  assert.throws(() => { el.props.value = 'mutated'; }, TypeError);

  el.setAttribute('data-value', 'changed');
  await settle();
  assert.equal(el.querySelector('output').textContent, 'changed');
  assert.deepEqual(lifecycle, ['connected:ready', 'updated:value']);

  el.remove();
  assert.equal(lifecycle.at(-1), 'disconnected');
});

test('factory rejects invalid contracts before registration', () => {
  assert.throws(() => component('invalid', { view() { return html``; } }), /hyphenated/);
  assert.throws(() => component('acme-invalid', {}), /config.view/);
  assert.throws(() => component('acme-invalid-actions', {
    actions: { state() {} },
    view() { return html``; },
  }), /invalid action/);
  assert.throws(() => component('acme-invalid-prop', {
    props: { 'not-valid': 0 }, view() { return html``; },
  }), /prop "not-valid"/);
  assert.throws(() => component('acme-invalid-default', {
    props: { date: new Date() }, view() { return html``; },
  }), /must default/);
  assert.throws(() => component('acme-invalid-lifecycle', {
    connected: true, view() { return html``; },
  }), /connected must be a function/);
});
