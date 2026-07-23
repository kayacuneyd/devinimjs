/**
 * Depth tests for <dv-data-table> (TASK-003). The one happy-path smoke test in
 * `atomic-components.test.js` is left in place; this file adds sort-toggling, column-type and
 * empty-state coverage.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-data-table.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * @param {Array<string|object>} columns - Column definitions.
 * @param {object[]} rows - Row data.
 * @returns {Element} A mounted <dv-data-table>.
 */
function makeTable(columns, rows) {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(columns));
  el.setAttribute('data-rows', JSON.stringify(rows));
  document.body.appendChild(el);
  return el;
}

test('clicking the same column header toggles sort direction back and forth', async () => {
  const el = makeTable(['name'], [{ name: 'Zoe' }, { name: 'Ada' }, { name: 'Mo' }]);
  const events = [];
  el.addEventListener('dv:sort', (e) => events.push(e.detail));
  const header = el.querySelector('button[data-key="name"]');

  header.click();
  await settle();
  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['Ada', 'Mo', 'Zoe']);
  assert.equal(el.querySelector('th').getAttribute('aria-sort'), 'ascending');

  header.click();
  await settle();
  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['Zoe', 'Mo', 'Ada']);
  assert.equal(el.querySelector('th').getAttribute('aria-sort'), 'descending');

  assert.deepEqual(events, [
    { key: 'name', direction: 'asc' },
    { key: 'name', direction: 'desc' },
  ]);
});

test('switching to a different column resets direction to ascending', async () => {
  const el = makeTable(['name', 'age'], [{ name: 'Zoe', age: '9' }, { name: 'Ada', age: '30' }]);
  const [nameHeader, ageHeader] = el.querySelectorAll('button');
  nameHeader.click();
  await settle();
  nameHeader.click(); // now descending on "name"
  await settle();
  assert.equal(el.querySelectorAll('th')[0].getAttribute('aria-sort'), 'descending');

  ageHeader.click(); // switching column must restart at ascending, not continue descending
  await settle();
  assert.equal(el.querySelectorAll('th')[1].getAttribute('aria-sort'), 'ascending');
  assert.equal(el.querySelectorAll('th')[0].getAttribute('aria-sort'), 'none');
});

// KNOWN GAP (report in handoff, not fixed here — this task does not modify src/): sorting
// compares every column's values with `String(value).localeCompare(...)`, i.e. always
// lexicographic. A numeric-looking column sorts as text, not by numeric value — "10" sorts
// before "2" ascending. This test documents the actual current behavior rather than asserting
// around it silently.
test('a numeric-looking column sorts lexicographically, not numerically (documents a real gap)', async () => {
  const el = makeTable(['qty'], [{ qty: 2 }, { qty: 10 }, { qty: 3 }]);
  el.querySelector('button[data-key="qty"]').click();
  await settle();
  const values = [...el.querySelectorAll('tbody td')].map((td) => td.textContent);
  // Numeric ascending would be ['2', '3', '10']; string/localeCompare ascending is not that.
  assert.deepEqual(values, ['10', '2', '3']);
});

test('empty rows render a header with zero body rows and no error', () => {
  const el = makeTable(['name'], []);
  assert.equal(el.querySelectorAll('thead th').length, 1);
  assert.equal(el.querySelectorAll('tbody tr').length, 0);
});

test('string-shorthand columns use the same string for key and label', () => {
  const el = makeTable(['sku'], [{ sku: 'ABC' }]);
  const header = el.querySelector('th button');
  assert.equal(header.getAttribute('data-key'), 'sku');
  assert.equal(header.textContent, 'sku');
});

test('a live data-rows change re-renders the body without a sort applied yet', async () => {
  const el = makeTable(['name'], [{ name: 'Ada' }]);
  el.setAttribute('data-rows', JSON.stringify([{ name: 'Zoe' }, { name: 'Mo' }]));
  await settle();
  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['Zoe', 'Mo']);
});
