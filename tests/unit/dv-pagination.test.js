import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-pagination.js');
const { setLocale } = await import('../../src/core/i18n.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** @returns {HTMLElement} Previous-page button, found by role rather than DOM position. */
function prevButton(el) {
  return el.querySelector('[aria-label="Previous page"]');
}

/** @returns {HTMLElement} Next-page button, found by role rather than DOM position. */
function nextButton(el) {
  return el.querySelector('[aria-label="Next page"]');
}

/** @returns {HTMLElement} The visible "Page X of Y" status text. */
function status(el) {
  return el.querySelector('.dv-pagination-status');
}

test('pagination emits one-based page changes and disables boundary controls', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  const events = [];
  el.addEventListener('dv:page', (event) => events.push(event.detail.page));

  // Previous/Next are now selected by aria-label, not button index: the page-number list and
  // jump-to-page control (TASK-005) sit between them, so index 1 is no longer guaranteed to be
  // "Next".
  assert.equal(prevButton(el).disabled, true);
  nextButton(el).click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(status(el).textContent.trim(), 'Page 2 of 3');
  assert.deepEqual(events, [2]);
});

test('data-page beyond the last page clamps down, and Next is disabled on the last page', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10'); // 3 pages
  document.body.appendChild(el);

  el.setAttribute('data-page', '99');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(status(el).textContent.trim(), 'Page 3 of 3');
  assert.equal(nextButton(el).disabled, true, 'Next is disabled on the last page');
  assert.equal(prevButton(el).disabled, false, 'Previous is enabled once past page 1');
});

test('data-page below 1 clamps up to page 1', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);

  el.setAttribute('data-page', '-5');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(status(el).textContent.trim(), 'Page 1 of 3');
});

test('page-number list renders every page when the count is small', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '30'); // 3 pages at size 10
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const pageButtons = [...el.querySelectorAll('.dv-pagination-list button')].map((b) => b.textContent.trim());
  assert.deepEqual(pageButtons, ['1', '2', '3']);
  assert.equal(el.querySelectorAll('.dv-pagination-ellipsis').length, 0);
});

test('page-number list truncates with ellipsis markers at large page counts', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200'); // 20 pages at size 10
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);

  el.setAttribute('data-page', '10');
  await new Promise((resolve) => setTimeout(resolve, 0));

  const pageButtons = [...el.querySelectorAll('.dv-pagination-list button')].map((b) => b.textContent.trim());
  assert.deepEqual(pageButtons, ['1', '8', '9', '10', '11', '12', '20']);
  assert.equal(el.querySelectorAll('.dv-pagination-ellipsis').length, 2);
});

test('page-number list truncates from the start when the current page is near page 1', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200'); // 20 pages
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const pageButtons = [...el.querySelectorAll('.dv-pagination-list button')].map((b) => b.textContent.trim());
  assert.deepEqual(pageButtons, ['1', '2', '3', '20']);
  assert.equal(el.querySelectorAll('.dv-pagination-ellipsis').length, 1);
});

test('clicking a page-number button emits dv:page with that page and navigates', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const events = [];
  el.addEventListener('dv:page', (event) => events.push(event.detail.page));

  const buttons = [...el.querySelectorAll('.dv-pagination-list button')];
  const page3 = buttons.find((b) => b.textContent.trim() === '3');
  page3.click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(events, [3]);
  assert.equal(status(el).textContent.trim(), 'Page 3 of 20');
});

test('aria-current="page" lands on the active page-number button only', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);

  el.setAttribute('data-page', '9');
  await new Promise((resolve) => setTimeout(resolve, 0));

  const current = el.querySelectorAll('[aria-current="page"]');
  assert.equal(current.length, 1, 'exactly one control is marked as the current page');
  assert.equal(current[0].textContent.trim(), '9');
});

test('jump-to-page with a valid value navigates to that page', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200'); // 20 pages
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const events = [];
  el.addEventListener('dv:page', (event) => events.push(event.detail.page));

  const input = el.querySelector('[data-pagination-jump-input]');
  const form = el.querySelector('form');
  input.value = '15';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(events, [15]);
  assert.equal(status(el).textContent.trim(), 'Page 15 of 20');
});

test('jump-to-page with an out-of-range value clamps to the last page without throwing', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200'); // 20 pages
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const events = [];
  el.addEventListener('dv:page', (event) => events.push(event.detail.page));

  const input = el.querySelector('[data-pagination-jump-input]');
  const form = el.querySelector('form');
  input.value = '9999';
  assert.doesNotThrow(() => {
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(events, [20]);
  assert.equal(status(el).textContent.trim(), 'Page 20 of 20');
});

test('jump-to-page with non-numeric text is clamped to page 1 without throwing or crashing', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200'); // 20 pages
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);

  el.setAttribute('data-page', '5');
  await new Promise((resolve) => setTimeout(resolve, 0));

  const events = [];
  el.addEventListener('dv:page', (event) => events.push(event.detail.page));

  const input = el.querySelector('[data-pagination-jump-input]');
  const form = el.querySelector('form');
  input.value = 'abc';
  assert.doesNotThrow(() => {
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(events, [1]);
  assert.equal(status(el).textContent.trim(), 'Page 1 of 20');
});

// i18n primitive reference wiring (ADR-0019).

test('the active locale bundle drives the nav label, Previous/Next text and aria-labels, jump copy and the Go button when no data-* override is set', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25'); // 3 pages
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('nav').getAttribute('aria-label'), 'Sayfalama');
    // Direct `<nav>` button children only — the page-number buttons live inside the nested
    // `<ul>` and would otherwise collide on `data-page` (e.g. the "2" page button also carries
    // `data-page="2"`, same as the Next button when the current page is 1).
    const [prev, next] = el.querySelectorAll('nav > button');
    assert.equal(prev.textContent, 'Önceki');
    assert.equal(prev.getAttribute('aria-label'), 'Önceki sayfa');
    assert.equal(next.textContent, 'Sonraki');
    assert.equal(next.getAttribute('aria-label'), 'Sonraki sayfa');
    assert.equal(el.querySelector('label').textContent.trim(), 'Sayfaya git');
    assert.equal(el.querySelector('[data-pagination-jump-input]').getAttribute('aria-label'), 'Sayfaya git, 1 ile 3 arası');
    assert.equal(el.querySelector('button[type="submit"]').textContent, 'Git');
    assert.equal(el.querySelector('[aria-current="page"]').getAttribute('aria-label'), '1. sayfa');
  } finally {
    setLocale(null);
  }
});

test('a data-label override still wins over the active locale bundle (ADR-0005 regression)', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10');
  el.setAttribute('data-label', 'Custom pagination');
  document.body.appendChild(el);
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('nav').getAttribute('aria-label'), 'Custom pagination', 'the explicit override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('setLocale() switching re-renders an already-mounted pagination via onLocaleChange', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '25');
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  await settle();
  assert.equal(el.querySelector('nav').getAttribute('aria-label'), 'Pagination');
  setLocale('tr');
  try {
    await settle();
    assert.equal(el.querySelector('nav').getAttribute('aria-label'), 'Sayfalama', 'the mounted instance re-renders on its own once setLocale() fires');
  } finally {
    setLocale(null);
  }
});

// Page-number aria-labels are parameterized (`{page}`) — this proves each button's own number is
// substituted independently, not the same interpolated string bleeding across buttons.
test('parameterized page-number aria-labels substitute each button\'s own page number, without cross-contamination', async () => {
  const el = document.createElement('dv-pagination');
  el.setAttribute('data-total', '200'); // 20 pages
  el.setAttribute('data-size', '10');
  document.body.appendChild(el);
  el.setAttribute('data-page', '10');
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    const pageButtons = [...el.querySelectorAll('.dv-pagination-list button')];
    const labels = pageButtons.map((button) => [button.textContent.trim(), button.getAttribute('aria-label')]);
    assert.deepEqual(labels, [
      ['1', '1. sayfa'],
      ['8', '8. sayfa'],
      ['9', '9. sayfa'],
      ['10', '10. sayfa'],
      ['11', '11. sayfa'],
      ['12', '12. sayfa'],
      ['20', '20. sayfa'],
    ]);
  } finally {
    setLocale(null);
  }
});
