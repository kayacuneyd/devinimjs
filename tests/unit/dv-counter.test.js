/**
 * Component tests for <dv-counter> and BaseComponent behavior, running on happy-dom
 * (ADR-0008). Globals are installed BEFORE importing component modules, because
 * `class BaseComponent extends HTMLElement` evaluates at import time.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { BaseComponent, html, define } = await import('../../src/core/core.js');
await import('../../src/components/dv-counter.js'); // side effect: registers <dv-counter>

// Flushes the microtask queue so batched renders settle.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

before(() => {
  document.body.innerHTML = '';
});

test('counter upgrades and renders its PHP-provided initial state', () => {
  const el = document.createElement('dv-counter');
  el.setAttribute('data-start', '5');
  el.setAttribute('data-step', '2');
  document.body.appendChild(el);
  assert.equal(el.querySelector('output').textContent.trim(), '5');
});

test('clicking + increments by step, re-renders, and emits dv:change', async () => {
  const el = document.createElement('dv-counter');
  el.setAttribute('data-start', '5');
  el.setAttribute('data-step', '2');
  document.body.appendChild(el);

  const events = [];
  el.addEventListener('dv:change', (e) => events.push(e.detail.count));

  el.querySelector('button[aria-label="Increase"]').click();
  await settle();

  assert.equal(el.querySelector('output').textContent.trim(), '7');
  assert.deepEqual(events, [7]);
});

test('clicking − decrements by step', async () => {
  const el = document.createElement('dv-counter');
  el.setAttribute('data-start', '5');
  el.setAttribute('data-step', '2');
  document.body.appendChild(el);

  el.querySelector('button[aria-label="Decrease"]').click();
  await settle();

  assert.equal(el.querySelector('output').textContent.trim(), '3');
});

test('live attribute change syncs into state via onAttribute (ADR-0005)', async () => {
  const el = document.createElement('dv-counter');
  document.body.appendChild(el);
  el.setAttribute('data-start', '41');
  await settle();
  assert.equal(el.querySelector('output').textContent.trim(), '41');
});

test('state containing markup is escaped on render (ADR-0003)', async () => {
  class DvEcho extends BaseComponent {
    initialState() {
      return { msg: '<img src=x onerror=alert(1)>' };
    }
    template() {
      return html`<p>${this.state.msg}</p>`;
    }
  }
  define('dv-echo', DvEcho);

  const el = document.createElement('dv-echo');
  document.body.appendChild(el);
  assert.equal(el.querySelector('img'), null);
  assert.ok(el.querySelector('p').textContent.includes('<img'));
});

test('unrelated renders preserve a focused input value and selection', async () => {
  class DvFormState extends BaseComponent {
    initialState() {
      return { label: 'Initial', tick: 0 };
    }
    template() {
      return html`<label>${this.state.label}<input value="${this.state.label}"></label><output>${this.state.tick}</output>`;
    }
  }
  define('dv-form-state', DvFormState);

  const el = document.createElement('dv-form-state');
  document.body.appendChild(el);
  const input = el.querySelector('input');
  input.value = 'Draft value';
  input.focus();
  input.setSelectionRange(2, 5);

  el.state.tick++;
  await settle();

  assert.equal(el.querySelector('input'), input);
  assert.equal(input.value, 'Draft value');
  assert.equal(document.activeElement, input);
  assert.equal(input.selectionStart, 2);
  assert.equal(input.selectionEnd, 5);
});

test('a changed template value synchronizes the live input value', async () => {
  class DvControlledInput extends BaseComponent {
    initialState() {
      return { value: 'A' };
    }
    template() {
      return html`<input value="${this.state.value}">`;
    }
  }
  define('dv-controlled-input', DvControlledInput);

  const el = document.createElement('dv-controlled-input');
  document.body.appendChild(el);
  const input = el.querySelector('input');
  input.value = 'Draft';
  el.state.value = 'B';
  await settle();

  assert.equal(input.value, 'B');
});
