import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-pagination.js');

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
