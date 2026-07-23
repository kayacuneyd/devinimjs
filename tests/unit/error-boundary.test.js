/**
 * Tests for the component error boundary (ADR-0015): BaseComponent#onError and the
 * component() factory's matching config.onError.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { BaseComponent, html, define } = await import('../../src/core/core.js');
const { component } = await import('../../src/core/authoring.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('BaseComponent#onError default implementation rethrows the original error', () => {
  class AcmePlainDefault extends BaseComponent {
    template() { return html``; }
  }
  define('acme-error-default', AcmePlainDefault);
  const el = document.createElement('acme-error-default');
  const boom = new Error('boom');
  assert.throws(() => el.onError(boom, 'render'), (thrown) => thrown === boom);
});

test('a render-phase throw is routed to onError(error, "render") and contained when overridden', async () => {
  const seen = [];
  class AcmeBreakableRender extends BaseComponent {
    initialState() { return { broken: false }; }
    template() {
      if (this.state.broken) throw new Error('render exploded');
      return html`<output>${this.state.broken ? 'broken' : 'ok'}</output>`;
    }
    onError(error, phase) { seen.push([error.message, phase]); }
  }
  define('acme-error-render', AcmeBreakableRender);
  const el = document.createElement('acme-error-render');
  document.body.appendChild(el);
  assert.equal(el.querySelector('output').textContent, 'ok');

  el.state.broken = true;
  await settle();
  assert.deepEqual(seen, [['render exploded', 'render']]);
  // Containment: the component must still be able to render normally afterward, not be
  // permanently wedged by the earlier throw.
  el.state.broken = false;
  await settle();
  assert.equal(el.querySelector('output').textContent, 'ok');
});

test('an action-phase throw is routed to onError(error, "action") and contained when overridden', async () => {
  const seen = [];
  class AcmeBreakableAction extends BaseComponent {
    initialState() { return { count: 0 }; }
    template() {
      return html`<button type="button" on:click="explode">${this.state.count}</button>`;
    }
    explode() { throw new Error('action exploded'); }
    onError(error, phase) { seen.push([error.message, phase]); }
  }
  define('acme-error-action', AcmeBreakableAction);
  const el = document.createElement('acme-error-action');
  document.body.appendChild(el);

  el.querySelector('button').click();
  assert.deepEqual(seen, [['action exploded', 'action']]);
  // Containment: dispatch must still work for later events on the same component.
  el.state.count = 5;
  await settle();
  assert.equal(el.querySelector('button').textContent, '5');
});

test('component() factory config.onError is invoked with the component instance as `this`', () => {
  const seen = [];
  component('acme-factory-error', {
    actions: {
      explode() { throw new Error('factory action exploded'); },
    },
    onError(error, phase) { seen.push([this.tagName.toLowerCase(), error.message, phase]); },
    view() { return html`<button type="button" on:click="explode">go</button>`; },
  });
  const el = document.createElement('acme-factory-error');
  document.body.appendChild(el);

  el.querySelector('button').click();
  assert.deepEqual(seen, [['acme-factory-error', 'factory action exploded', 'action']]);
});

test('component() factory with no config.onError inherits BaseComponent.prototype.onError (rethrow), not a silent swallow', () => {
  component('acme-factory-error-default', {
    actions: { explode() { throw new Error('unused'); } },
    view() { return html`<button type="button" on:click="explode">go</button>`; },
  });
  const FactoryClass = customElements.get('acme-factory-error-default');
  assert.equal(FactoryClass.prototype.onError, BaseComponent.prototype.onError);
});
