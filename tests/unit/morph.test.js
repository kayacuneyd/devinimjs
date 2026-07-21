/**
 * Unit tests for keyed DOM morphing (ADR-0014). A keyed list must keep each item's DOM identity
 * across reorders, insertions and removals; unkeyed siblings retain the positional fallback.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['Element', 'Node', 'document']) globalThis[key] = window[key];

const { morph } = await import('../../src/core/morph.js');

function makeHost(markup) {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host;
}

test('keyed siblings move without losing their DOM identity', () => {
  const host = makeHost(`
    <ul>
      <li data-key="a">Ada</li>
      <li data-key="b">Babbage</li>
    </ul>
  `);
  const ada = host.querySelector('[data-key="a"]');
  ada.localState = { expanded: true };

  morph(host, `
    <ul>
      <li data-key="b">Babbage</li>
      <li data-key="a">Ada Lovelace</li>
    </ul>
  `);

  const items = [...host.querySelectorAll('li')];
  assert.deepEqual(items.map((item) => item.dataset.key), ['b', 'a']);
  assert.equal(items[1], ada);
  assert.deepEqual(items[1].localState, { expanded: true });
  assert.equal(items[1].textContent, 'Ada Lovelace');
});

test('keyed siblings insert and remove only the affected nodes', () => {
  const host = makeHost('<ul><li data-key="a">A</li><li data-key="b">B</li></ul>');
  const a = host.querySelector('[data-key="a"]');

  morph(host, '<ul><li data-key="c">C</li><li data-key="a">A+</li></ul>');

  const items = [...host.querySelectorAll('li')];
  assert.deepEqual(items.map((item) => item.dataset.key), ['c', 'a']);
  assert.equal(items[1], a);
  assert.equal(items[1].textContent, 'A+');
  assert.equal(host.querySelector('[data-key="b"]'), null);
});

test('mixed keyed and unkeyed siblings retain positional fallback behavior', () => {
  const host = makeHost('<ul><li data-key="a">A</li><li>B</li></ul>');
  const first = host.querySelector('li');

  morph(host, '<ul><li data-key="a">A+</li><li>B+</li></ul>');

  assert.equal(host.querySelector('li'), first);
  assert.equal(host.querySelector('li').textContent, 'A+');
});
