/**
 * Depth tests for <dv-dropdown> (TASK-003). The one happy-path smoke test in
 * `atomic-components.test.js` is left in place; this file adds Escape-close and
 * roving-keyboard-focus coverage.
 *
 * Note (see handoff): the component has no outside-click-close behavior — there is no
 * document-level listener anywhere in `dv-dropdown.js`, only Escape (via its own
 * `data-on:keydown`) and the trigger button's click toggle. The task's "outside-click close"
 * item is therefore covered below as a documented gap (same treatment the task asks for the
 * dv-modal focus-trap limitation), not as a fabricated passing behavior.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'KeyboardEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-dropdown.js');
const { setLocale } = await import('../../src/core/i18n.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * @returns {Element} A mounted <dv-dropdown> with three menu items.
 */
function makeDropdown() {
  const el = document.createElement('dv-dropdown');
  el.innerHTML = `
    <button role="menuitem">Profile</button>
    <button role="menuitem">Settings</button>
    <button role="menuitem">Sign out</button>
  `;
  document.body.appendChild(el);
  return el;
}

test('keyboard activation: the trigger is a real <button>, natively Enter/Space-operable via its click handler', async () => {
  const el = makeDropdown();
  const trigger = el.querySelector('button:not([role="menuitem"])');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  trigger.click();
  await settle();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(el.querySelector('[role="menu"]').hidden, false);
});

test('Escape closes an open menu', async () => {
  const el = makeDropdown();
  const trigger = el.querySelector('button:not([role="menuitem"])');
  trigger.click();
  await settle();
  // Dispatched from a descendant of the directive element (the trigger), like a real keydown
  // while focus is inside the dropdown — dispatching straight on the host `el` would put
  // event.target === this and short-circuit the directive walk in #dispatch().
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await settle();
  assert.equal(el.querySelector('[role="menu"]').hidden, true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
});

test('ArrowDown/ArrowUp move focus among menu items with wrap-around', async () => {
  const el = makeDropdown();
  el.querySelector('button:not([role="menuitem"])').click();
  await settle();
  const items = [...el.querySelectorAll('[role="menuitem"]')];
  items[0].focus();

  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(document.activeElement, items[1]);

  items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  assert.equal(document.activeElement, items[0]);

  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  assert.equal(document.activeElement, items[2], 'wraps to the last item');
});

test('Home/End jump focus to the first/last menu item', async () => {
  const el = makeDropdown();
  el.querySelector('button:not([role="menuitem"])').click();
  await settle();
  const items = [...el.querySelectorAll('[role="menuitem"]')];
  items[0].focus();

  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(document.activeElement, items[2]);

  items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(document.activeElement, items[0]);
});

test('arrow keys are ignored while the menu is closed', async () => {
  const el = makeDropdown();
  const trigger = el.querySelector('button:not([role="menuitem"])');
  const items = [...el.querySelectorAll('[role="menuitem"]')];
  // Guard is state-based (`if (!this.state.open || ...) return;`), so this exercises the
  // early-return without depending on happy-dom's handling of focus inside a hidden subtree.
  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'the menu never opened');
  assert.equal(el.querySelector('[role="menu"]').hidden, true);
});

test('KNOWN GAP: clicking outside the dropdown does not close it (no outside-click handler exists)', async () => {
  const el = makeDropdown();
  el.querySelector('button:not([role="menuitem"])').click();
  await settle();
  assert.equal(el.querySelector('[role="menu"]').hidden, false);

  const outside = document.createElement('div');
  document.body.appendChild(outside);
  outside.dispatchEvent(new window.Event('click', { bubbles: true }));
  await settle();

  // Documents current behavior: this is a real UX gap consumers must handle themselves.
  assert.equal(el.querySelector('[role="menu"]').hidden, false);
  outside.remove();
});

// i18n primitive reference wiring (ADR-0019).

test('the active locale bundle drives the trigger label when no data-* override is set', async () => {
  const el = makeDropdown();
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('button:not([role="menuitem"])').textContent, 'Menü');
  } finally {
    setLocale(null);
  }
});

test('a data-label override still wins over the active locale bundle (ADR-0005 regression)', async () => {
  const el = makeDropdown();
  el.setAttribute('data-label', 'Actions');
  setLocale('tr');
  try {
    el.requestUpdate();
    await settle();
    assert.equal(el.querySelector('button:not([role="menuitem"])').textContent, 'Actions', 'the explicit override must still win over the tr bundle entry');
  } finally {
    setLocale(null);
  }
});

test('the trigger label falls back to the unchanged hardcoded default with no locale/override set', () => {
  const el = makeDropdown();
  assert.equal(el.querySelector('button:not([role="menuitem"])').textContent, 'Menu');
});
