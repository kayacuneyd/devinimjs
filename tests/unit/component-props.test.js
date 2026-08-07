/**
 * Tests for authoring-API prop descriptors (ADR-0025): `{ type, default, required }` entries,
 * define-time descriptor validation and runtime console.error diagnostics.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { component, html } = await import('../../src/core/authoring.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Captures console.error output for the duration of `fn`. */
async function captureErrors(fn) {
  const errors = [];
  const original = console.error;
  console.error = (msg) => errors.push(String(msg));
  try {
    await fn();
  } finally {
    console.error = original;
  }
  return errors;
}

test('descriptor props coerce by declared type and apply declared defaults', async () => {
  component('acme-desc-counter', {
    props: {
      start: { type: Number, default: 5 },
      label: { type: String, default: 'count' },
      enabled: { type: Boolean, default: false },
      tags: { type: Array, default: [] },
      config: { type: Object, default: {} },
    },
    view() {
      return html`<p>${this.props.start}:${this.props.label}:${String(this.props.enabled)}:${this.props.tags.length}:${Object.keys(this.props.config).length}</p>`;
    },
  });

  const el = document.createElement('acme-desc-counter');
  el.setAttribute('data-start', '10');
  el.setAttribute('data-enabled', 'true');
  el.setAttribute('data-tags', '["a","b"]');
  el.setAttribute('data-config', '{"x":1}');
  document.body.appendChild(el);
  await settle();
  assert.equal(el.textContent.trim(), '10:count:true:2:1');
  el.remove();
});

test('descriptor defaults apply when attributes are absent (implicit defaults per type)', async () => {
  component('acme-desc-implicit', {
    props: {
      count: { type: Number },
      items: { type: Array },
      meta: { type: Object },
      flag: { type: Boolean },
    },
    view() {
      return html`<p>${this.props.count}:${this.props.items.length}:${Object.keys(this.props.meta).length}:${String(this.props.flag)}</p>`;
    },
  });
  const el = document.createElement('acme-desc-implicit');
  document.body.appendChild(el);
  await settle();
  assert.equal(el.textContent.trim(), '0:0:0:false');
  el.remove();
});

test('a missing required prop logs a meaningful console.error naming tag and attribute', async () => {
  component('acme-desc-required', {
    props: { start: { type: Number, required: true } },
    view() {
      return html`<p>${this.props.start}</p>`;
    },
  });
  const errors = await captureErrors(async () => {
    const el = document.createElement('acme-desc-required');
    document.body.appendChild(el);
    await settle();
    el.remove();
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /<acme-desc-required>/);
  assert.match(errors[0], /required prop "start" is missing/);
  assert.match(errors[0], /data-start/);
});

test('an unconvertible attribute value logs a type error and keeps the default', async () => {
  component('acme-desc-mismatch', {
    props: { start: { type: Number, default: 3 } },
    view() {
      return html`<p>${this.props.start}</p>`;
    },
  });
  let el;
  const errors = await captureErrors(async () => {
    el = document.createElement('acme-desc-mismatch');
    el.setAttribute('data-start', 'abc');
    document.body.appendChild(el);
    await settle();
  });
  assert.equal(el.textContent.trim(), '3');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /expected Number/);
  assert.match(errors[0], /data-start="abc"/);
  el.remove();
});

test('invalid descriptors fail at define time with precise messages', () => {
  assert.throws(
    () => component('acme-bad-type', { props: { x: { type: Date } }, view: () => html`` }),
    /prop "x" type must be String, Number, Boolean, Array or Object/,
  );
  assert.throws(
    () => component('acme-bad-default', { props: { x: { type: Number, default: 'abc' } }, view: () => html`` }),
    /prop "x" default does not match its declared Number type/,
  );
  assert.throws(
    () => component('acme-bad-required', { props: { x: { type: String, required: 'yes' } }, view: () => html`` }),
    /prop "x" required must be a boolean/,
  );
});

test('sync hooks still fire for descriptor props on attribute change', async () => {
  component('acme-desc-sync', {
    props: { start: { type: Number, default: 0 } },
    state() {
      return { count: this.props.start };
    },
    sync: {
      start(value) {
        this.state.count = value;
      },
    },
    view() {
      return html`<p>${this.state.count}</p>`;
    },
  });
  const el = document.createElement('acme-desc-sync');
  document.body.appendChild(el);
  await settle();
  assert.equal(el.textContent.trim(), '0');
  el.setAttribute('data-start', '42');
  await settle();
  assert.equal(el.textContent.trim(), '42');
  el.remove();
});

test('plain JSON object defaults stay data, not descriptors', async () => {
  component('acme-desc-json', {
    props: { options: { type: 'a', label: 'x' } }, // has a non-descriptor key → plain default
    view() {
      return html`<p>${this.props.options.type}:${this.props.options.label}</p>`;
    },
  });
  const el = document.createElement('acme-desc-json');
  document.body.appendChild(el);
  await settle();
  assert.equal(el.textContent.trim(), 'a:x');
  el.remove();
});
