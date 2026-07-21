/**
 * Unit tests for core/html.js — the escape-by-default template tag (ADR-0002, ADR-0003).
 * DOM-free: pure string assertions.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, unsafe, HtmlString, escapeHtml } from '../../src/core/html.js';

test('escapeHtml escapes the five significant characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'</a>`), `&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;`);
});

test('primitive interpolations are escaped by default (ADR-0003 #1)', () => {
  const evil = '<img src=x onerror=alert(1)>';
  assert.equal(
    html`<p>${evil}</p>`.toString(),
    '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
  );
});

test('numbers interpolate (escaped, i.e. as-is for digits)', () => {
  assert.equal(html`<output>${42}</output>`.toString(), '<output>42</output>');
});

test('nested html templates pass through unescaped exactly once (ADR-0002 #2)', () => {
  const inner = html`<b>${'<safe>'}</b>`;
  assert.equal(html`<div>${inner}</div>`.toString(), '<div><b>&lt;safe&gt;</b></div>');
});

test('arrays are joined item-wise for list rendering', () => {
  const items = ['<a>', 'b'].map((n) => html`<li>${n}</li>`);
  assert.equal(html`<ul>${items}</ul>`.toString(), '<ul><li>&lt;a&gt;</li><li>b</li></ul>');
});

test('null, undefined and false render as empty string (conditionals)', () => {
  assert.equal(html`<p>${null}${undefined}${false}!</p>`.toString(), '<p>!</p>');
  const flag = false; // variable, not a literal — exercises the runtime branch
  assert.equal(html`${flag && html`<b>x</b>`}`.toString(), '');
});

test('sole-value attribute: true emits the bare attribute (ADR-0002 #5)', () => {
  assert.equal(html`<button disabled="${true}">x</button>`.toString(), '<button disabled>x</button>');
});

test('sole-value attribute: false/null/undefined omit the attribute', () => {
  assert.equal(html`<button disabled="${false}">x</button>`.toString(), '<button>x</button>');
  assert.equal(html`<button disabled="${null}">x</button>`.toString(), '<button>x</button>');
  assert.equal(html`<input value="${undefined}">`.toString(), '<input>');
});

test('sole-value attribute: real values are emitted escaped', () => {
  assert.equal(
    html`<input value="${'a"b'}">`.toString(),
    '<input value="a&quot;b">',
  );
});

test('partial attribute interpolations are always emitted and escaped', () => {
  assert.equal(html`<div class="btn ${'x"y'}"></div>`.toString(), '<div class="btn x&quot;y"></div>');
});

test('unsafe() passes raw HTML through as trusted', () => {
  assert.equal(html`<div>${unsafe('<span>raw</span>')}</div>`.toString(), '<div><span>raw</span></div>');
});

test('html returns an HtmlString instance', () => {
  assert.ok(html`` instanceof HtmlString);
});
