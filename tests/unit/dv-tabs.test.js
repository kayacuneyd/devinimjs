/**
 * Tests for <dv-tabs> — WAI-ARIA APG tabs pattern on happy-dom.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of [
  'HTMLElement', 'Element', 'Node', 'CustomEvent', 'KeyboardEvent', 'document', 'customElements',
]) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-tabs.js'); // side effect: registers <dv-tabs>
const { setLocale } = await import('../../src/core/i18n.js');

// Flushes the microtask queue so batched renders settle.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Builds a mounted <dv-tabs> with three PHP-style panels.
 *
 * @param {string} [attrs] - Extra attributes for the element tag.
 * @returns {{ el: Element, tabs: Element[], panels: Element[] }} The element, tab buttons, panels.
 */
function makeTabs(attrs = '') {
  const el = document.createElement('dv-tabs');
  if (attrs.includes('data-active')) {
    el.setAttribute('data-active', /data-active="(\d+)"/.exec(attrs)[1]);
  }
  el.innerHTML = `
    <div data-tab="General"><p>panel A</p></div>
    <div data-tab="Profile"><p>panel B</p></div>
    <div data-tab="Security"><p>panel C</p></div>
  `;
  document.body.appendChild(el);
  return {
    el,
    tabs: [...el.querySelectorAll('[role="tab"]')],
    panels: [...el.querySelector('dv-outlet').children],
  };
}

test('renders one tab per child, labeled from data-tab attributes', () => {
  const { tabs } = makeTabs();
  assert.equal(tabs.length, 3);
  assert.deepEqual(tabs.map((t) => t.textContent.trim()), ['General', 'Profile', 'Security']);
});

test('first tab is selected by default; inactive panels are hidden', () => {
  const { tabs, panels } = makeTabs();
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[1].getAttribute('aria-selected'), 'false');
  assert.equal(tabs[2].getAttribute('aria-selected'), 'false');
  assert.ok(!panels[0].hasAttribute('hidden'));
  assert.ok(panels[1].hasAttribute('hidden'));
  assert.ok(panels[2].hasAttribute('hidden'));
});

test('data-active selects the initial tab (clamped)', () => {
  const { tabs, panels } = makeTabs('data-active="1"');
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.ok(!panels[1].hasAttribute('hidden'));
  assert.ok(panels[0].hasAttribute('hidden'));
});

test('ARIA wiring: tab aria-controls ↔ panel id, panel aria-labelledby ↔ tab id', () => {
  const { el, tabs, panels } = makeTabs();
  assert.equal(el.querySelector('[role="tablist"]').getAttribute('aria-label'), 'Tabs');
  tabs.forEach((tab, i) => {
    assert.equal(tab.getAttribute('aria-controls'), panels[i].id);
    assert.equal(panels[i].getAttribute('aria-labelledby'), tab.id);
    assert.equal(panels[i].getAttribute('role'), 'tabpanel');
  });
});

test('roving tabindex: active tab 0, others -1', () => {
  const { tabs } = makeTabs();
  assert.deepEqual(tabs.map((t) => t.getAttribute('tabindex')), ['0', '-1', '-1']);
});

test('click activates a tab, updates panels and emits dv:tab', async () => {
  const { el, tabs, panels } = makeTabs();
  const events = [];
  el.addEventListener('dv:tab', (e) => events.push(e.detail.index));

  tabs[2].click();
  await settle();

  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'false');
  assert.ok(!panels[2].hasAttribute('hidden'));
  assert.ok(panels[0].hasAttribute('hidden'));
  assert.deepEqual(events, [2]);
});

test('ArrowRight/ArrowLeft move selection with wrap-around (APG)', async () => {
  const { tabs } = makeTabs();
  tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await settle();
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');

  tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await settle();
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');

  tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await settle();
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true'); // wrapped to last
});

test('Home/End jump to first/last tab', async () => {
  const { tabs } = makeTabs();
  tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  await settle();
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');

  tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await settle();
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
});

test('automatic activation moves focus to the selected tab', async () => {
  const { tabs } = makeTabs();
  tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await settle();
  assert.equal(document.activeElement, tabs[1]);
});

test('focusin on a tab activates it (APG automatic activation sync)', async () => {
  const { tabs } = makeTabs();
  tabs[1].focus();
  await settle();
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'false');
});

test('live data-active change syncs selection (ADR-0005)', async () => {
  const { el, tabs } = makeTabs();
  el.setAttribute('data-active', '2');
  await settle();
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
});

test('multiple instances get unique ARIA ids', () => {
  const a = makeTabs();
  const b = makeTabs();
  const idsA = a.tabs.map((t) => t.id);
  const idsB = b.tabs.map((t) => t.id);
  assert.ok(idsA.every((id) => !idsB.includes(id)), 'no id collisions across instances');
});

// i18n primitive reference wiring (ADR-0019). Only the tablist's aria-label is wired — tab
// activation, keyboard nav and panel/aria-selected logic are untouched by this task.

test('the active locale bundle drives the tablist aria-label when no data-* override is set', async () => {
  const { el } = makeTabs();
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('[role="tablist"]').getAttribute('aria-label'), 'Sekmeler');
  } finally {
    setLocale(null);
  }
});

test('a data-label override still wins over the active locale bundle (ADR-0005 regression)', async () => {
  const { el } = makeTabs();
  el.setAttribute('data-label', 'Account settings');
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('[role="tablist"]').getAttribute('aria-label'), 'Account settings', 'the explicit override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('the tablist aria-label falls back to the unchanged hardcoded default with no locale/override set', () => {
  const { el } = makeTabs();
  assert.equal(el.querySelector('[role="tablist"]').getAttribute('aria-label'), 'Tabs');
});
