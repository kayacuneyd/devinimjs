/**
 * Tests for composition (ADR-0009) and the event-ownership rule (ADR-0004 #5) on happy-dom.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window({ url: 'https://localhost/' });
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { BaseComponent, html, define } = await import('../../src/core/core.js');

// Flushes the microtask queue so batched renders settle.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('outlet preserves initial light-DOM children (ADR-0009)', () => {
  class DvCard extends BaseComponent {
    template() {
      return html`<div class="card">${this.outlet}</div>`;
    }
  }
  define('dv-card', DvCard);

  const el = document.createElement('dv-card');
  el.innerHTML = '<p class="from-php">server content</p>';
  document.body.appendChild(el);

  const outlet = el.querySelector('dv-outlet');
  assert.ok(outlet, 'outlet element exists');
  assert.equal(outlet.querySelector('.from-php').textContent, 'server content');
  assert.equal(outlet.style.display, 'contents');
});

test('outlet content survives subsequent state-driven re-renders', async () => {
  class DvTog extends BaseComponent {
    initialState() {
      return { on: false };
    }
    flip() {
      this.state.on = !this.state.on;
    }
    template() {
      return html`<div>${this.state.on ? 'ON' : 'OFF'} ${this.outlet}</div>`;
    }
  }
  define('dv-tog', DvTog);

  const el = document.createElement('dv-tog');
  el.innerHTML = '<span class="keep">x</span>';
  document.body.appendChild(el);

  el.state.on = true;
  await settle();

  assert.ok(el.querySelector('.keep'), 'outlet child still present after re-render');
  assert.ok(el.textContent.includes('ON'));
});

test('data-on directives inside outlet content delegate to the outlet owner', () => {
  let calls = 0;
  class DvShell extends BaseComponent {
    handle() {
      calls++;
    }
    template() {
      return html`<section>${this.outlet}</section>`;
    }
  }
  define('dv-shell', DvShell);

  const el = document.createElement('dv-shell');
  el.innerHTML = '<button data-on:click="handle">go</button>';
  document.body.appendChild(el);

  const outlet = el.querySelector('dv-outlet');
  assert.ok(outlet, 'outlet element exists');
  const btn = outlet.querySelector('button');
  assert.ok(btn, 'directive button was moved into the outlet');
  btn.click();
  assert.equal(calls, 1);
});

test('nested component owns its own directive; outer component skips it (ADR-0004 #5)', () => {
  let innerCalls = 0;
  let outerCalls = 0;

  class DvInner extends BaseComponent {
    inner() {
      innerCalls++;
    }
    template() {
      return html`<button data-on:click="inner">i</button>`;
    }
  }
  class DvOuter extends BaseComponent {
    outer() {
      outerCalls++;
    }
    template() {
      return html`<section data-on:click="outer">${this.outlet}</section>`;
    }
  }
  define('dv-inner', DvInner);
  define('dv-outer', DvOuter);

  const outer = document.createElement('dv-outer');
  outer.innerHTML = '<dv-inner></dv-inner>';
  document.body.appendChild(outer);

  outer.querySelector('dv-inner button').click();
  assert.equal(innerCalls, 1);
  assert.equal(outerCalls, 0);
});
