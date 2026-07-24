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
const { setLocale } = await import('../../src/core/i18n.js');

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

// TASK-004: sorting used to compare every column's values with
// `String(value).localeCompare(...)`, i.e. always lexicographic — a numeric-looking column
// sorted as text ("10" before "2" ascending). Sorting is now numeric-aware when both sides of a
// comparison parse as finite numbers, falling back to locale-aware text compare otherwise (the
// header-toggle test above covers the still-lexicographic string-column case).
test('a numeric-looking column sorts numerically, not lexicographically', async () => {
  const el = makeTable(['qty'], [{ qty: 2 }, { qty: 10 }, { qty: 3 }]);
  el.querySelector('button[data-key="qty"]').click();
  await settle();
  const values = [...el.querySelectorAll('tbody td')].map((td) => td.textContent);
  assert.deepEqual(values, ['2', '3', '10']);
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

// --- TASK-004: filtering ---------------------------------------------------------------------

test('the filter input narrows visible rows by case-insensitive substring match across all columns', async () => {
  const el = makeTable(['name', 'city'], [
    { name: 'Ada Lovelace', city: 'London' },
    { name: 'Grace Hopper', city: 'New York' },
    { name: 'Mo Farah', city: 'London' },
  ]);
  const input = el.querySelector('input[type="search"]');

  input.value = 'lon'; // lowercase, matches "London" case-insensitively, and only the city column
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();

  assert.deepEqual(
    [...el.querySelectorAll('tbody tr')].map((tr) => tr.children[0].textContent),
    ['Ada Lovelace', 'Mo Farah'],
  );
});

test('an empty-filtered-result state renders zero body rows without throwing', async () => {
  const el = makeTable(['name'], [{ name: 'Ada' }, { name: 'Grace' }]);
  const input = el.querySelector('input[type="search"]');

  input.value = 'zzz-no-match';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();

  assert.equal(el.querySelectorAll('tbody tr').length, 0);
  assert.equal(el.querySelectorAll('thead th').length, 1); // header stays put
});

test('filter and sort compose: sorting only reorders the currently filtered set', async () => {
  const el = makeTable(['name'], [{ name: 'Zoe' }, { name: 'Ada' }, { name: 'Zack' }]);
  const input = el.querySelector('input[type="search"]');

  input.value = 'z'; // matches "Zoe" and "Zack" only
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();

  el.querySelector('button[data-key="name"]').click();
  await settle();

  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['Zack', 'Zoe']);
});

// --- TASK-004: pagination (composes <dv-pagination>, black-box) ------------------------------

test('data-page-size absent preserves current no-pagination behavior (regression)', async () => {
  const el = makeTable(['name'], [{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
  assert.equal(el.querySelectorAll('tbody tr').length, 3);
  assert.equal(el.querySelector('dv-pagination'), null);
});

test('data-page-size="0" preserves current no-pagination behavior (regression)', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'A' }, { name: 'B' }, { name: 'C' }]));
  el.setAttribute('data-page-size', '0');
  document.body.appendChild(el);
  assert.equal(el.querySelectorAll('tbody tr').length, 3);
  assert.equal(el.querySelector('dv-pagination'), null);
});

test('a positive data-page-size slices the filtered/sorted rows and composes <dv-pagination>', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }]));
  el.setAttribute('data-page-size', '2');
  document.body.appendChild(el);
  await settle();

  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['A', 'B']);
  const pagination = el.querySelector('dv-pagination');
  assert.ok(pagination, '<dv-pagination> is composed for page controls');
  assert.equal(pagination.getAttribute('data-total'), '5');
  assert.equal(pagination.getAttribute('data-size'), '2');
  assert.equal(pagination.querySelector('.dv-pagination-status').textContent.trim(), 'Page 1 of 3');

  pagination.querySelector('[aria-label="Next page"]').click(); // dispatched by dv-pagination itself
  await settle();
  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['C', 'D']);
  // Regression guard: a naive `<dv-pagination>` written directly in template() gets its own
  // self-rendered <nav>/buttons wiped out by this component's *next* re-render (morph() only
  // exempts <dv-outlet> from recursive diffing) — the very re-render that dv:page just caused.
  // If dv-pagination's DOM survives this second settle, the private-outlet mount is doing its job.
  assert.equal(el.querySelector('.dv-pagination-status').textContent.trim(), 'Page 2 of 3');
  assert.ok(el.querySelector('[aria-label="Previous page"]'), 'Previous/Next controls are still in the DOM');
});

test('changing the sort while on page 2+ resets to page 1 so it never strands on an empty page', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'C' }, { name: 'A' }, { name: 'E' }, { name: 'B' }, { name: 'D' }]));
  el.setAttribute('data-page-size', '2');
  document.body.appendChild(el);
  await settle();

  el.querySelector('[aria-label="Next page"]').click(); // -> page 2
  await settle();
  assert.equal(el.querySelector('.dv-pagination-status').textContent.trim(), 'Page 2 of 3');

  el.querySelector('button[data-key="name"]').click(); // sort ascending, must reset to page 1
  await settle();

  assert.equal(el.querySelector('.dv-pagination-status').textContent.trim(), 'Page 1 of 3');
  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['A', 'B']);
});

test('changing the filter while on page 2+ resets to page 1 so it never strands on an empty page', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'A1' }, { name: 'A2' }, { name: 'A3' }, { name: 'A4' }, { name: 'A5' }]));
  el.setAttribute('data-page-size', '2');
  document.body.appendChild(el);
  await settle();

  el.querySelector('[aria-label="Next page"]').click(); // -> page 2
  await settle();
  assert.equal(el.querySelector('.dv-pagination-status').textContent.trim(), 'Page 2 of 3');

  const input = el.querySelector('input[type="search"]');
  input.value = 'A4'; // narrows to a single row; staying on page 2 would strand on an empty page
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await settle();

  assert.equal(el.querySelector('.dv-pagination-status').textContent.trim(), 'Page 1 of 1');
  assert.deepEqual([...el.querySelectorAll('tbody td')].map((td) => td.textContent), ['A4']);
});

// --- i18n primitive reference wiring (ADR-0019) -----------------------------------------------

test('the active locale bundle drives the filter label and table caption when no data-* override is set', async () => {
  const el = makeTable(['name'], [{ name: 'Ada' }]);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('.dv-data-table-filter').textContent, 'Filtrele');
    assert.equal(el.querySelector('caption').textContent, 'Veri tablosu');
  } finally {
    setLocale(null);
  }
});

test('data-filter-label and data-label overrides still win over the active locale bundle (ADR-0005 regression)', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'Ada' }]));
  el.setAttribute('data-filter-label', 'Ara');
  el.setAttribute('data-label', 'Kayıtlar');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('.dv-data-table-filter').textContent, 'Ara', 'the explicit filter-label override must still win over the tr bundle entry');
    assert.equal(el.querySelector('caption').textContent, 'Kayıtlar', 'the explicit label override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('setLocale() switching re-renders an already-mounted table via onLocaleChange', async () => {
  const el = makeTable(['name'], [{ name: 'Ada' }]);
  await settle();
  assert.equal(el.querySelector('caption').textContent, 'Data table');
  setLocale('tr');
  try {
    await settle();
    assert.equal(el.querySelector('caption').textContent, 'Veri tablosu', 'the mounted instance re-renders on its own once setLocale() fires');
  } finally {
    setLocale(null);
  }
});

// Composition test (see the task's Goal note): dv-data-table resolves its own `pagination-label`
// copy via t(), then forwards the *resolved* string as dv-pagination's `data-label` override —
// its own top-priority tier. This proves that forwarding chain still resolves correctly end to
// end once both sides go through t(), under a non-English active locale.
test('the forwarded pagination-label reaches the composed <dv-pagination> correctly under a non-English active locale', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'A' }, { name: 'B' }, { name: 'C' }]));
  el.setAttribute('data-page-size', '2');
  document.body.appendChild(el);
  await settle();

  setLocale('tr');
  try {
    await settle();
    const pagination = el.querySelector('dv-pagination');
    assert.ok(pagination, '<dv-pagination> is composed for page controls');
    assert.equal(
      pagination.querySelector('nav').getAttribute('aria-label'),
      'Sayfalama',
      "dv-data-table's own tr paginationLabel is forwarded and wins as dv-pagination's data-label override",
    );
    // dv-pagination's own bundle also switched to tr independently (each component resolves its
    // own copy) — Previous/Next text prove the composed child re-rendered under the same locale,
    // not just that the forwarded label attribute changed.
    assert.equal(pagination.querySelector('[data-page="0"]').textContent, 'Önceki');
  } finally {
    setLocale(null);
  }
});

test('a data-pagination-label override on <dv-data-table> is forwarded and still wins on the composed <dv-pagination> (ADR-0005 regression)', async () => {
  const el = document.createElement('dv-data-table');
  el.setAttribute('data-columns', JSON.stringify(['name']));
  el.setAttribute('data-rows', JSON.stringify([{ name: 'A' }, { name: 'B' }, { name: 'C' }]));
  el.setAttribute('data-page-size', '2');
  el.setAttribute('data-pagination-label', 'Custom pager');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    const pagination = el.querySelector('dv-pagination');
    assert.equal(pagination.querySelector('nav').getAttribute('aria-label'), 'Custom pager');
  } finally {
    setLocale(null);
  }
});
