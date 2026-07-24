/**
 * Unit tests for the i18n/locale primitive itself (ADR-0019): three-tier resolution order,
 * active-locale switching, and `{placeholder}` substitution — independent of any component.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'document']) globalThis[key] = window[key];

const { t, registerLocales, setLocale, getLocale, onLocaleChange } = await import('../../src/core/i18n.js');

/** @returns {HTMLElement} A bare element with a fresh tag name, so bundle lookups never collide across tests. */
let seq = 0;
function makeEl(tag) {
  const el = document.createElement(tag ?? `dv-i18n-fixture-${++seq}`);
  document.body.appendChild(el);
  return el;
}

test('falls back to the hardcoded default when neither an override nor a locale entry exists', () => {
  const el = makeEl();
  assert.equal(t(el, 'label', 'Dialog'), 'Dialog');
});

test('a registered locale entry for the active locale is used when no data-* override is present', () => {
  const el = makeEl('dv-i18n-locale-case');
  registerLocales('dv-i18n-locale-case', { en: { label: 'Dialog' }, tr: { label: 'Pencere' } });
  setLocale('tr');
  try {
    assert.equal(t(el, 'label', 'Dialog'), 'Pencere');
  } finally {
    setLocale(null);
  }
});

test('a data-* override wins over a registered locale entry (ADR-0005 regression)', () => {
  const el = makeEl('dv-i18n-override-case');
  registerLocales('dv-i18n-override-case', { en: { label: 'Dialog' }, tr: { label: 'Pencere' } });
  el.dataset.label = 'Custom title';
  setLocale('tr');
  try {
    assert.equal(t(el, 'label', 'Dialog'), 'Custom title');
  } finally {
    setLocale(null);
  }
});

test('an inactive locale bundle entry is ignored — only the active locale is consulted', () => {
  const el = makeEl('dv-i18n-inactive-case');
  registerLocales('dv-i18n-inactive-case', { en: { label: 'Dialog' }, tr: { label: 'Pencere' } });
  // No setLocale() call and no <html lang> set on this fixture's document — defaults to 'en'.
  assert.equal(t(el, 'label', 'Dialog'), 'Dialog');
});

test('getLocale() reads document.documentElement.lang by default', () => {
  const original = document.documentElement.lang;
  document.documentElement.lang = 'tr';
  try {
    assert.equal(getLocale(), 'tr');
  } finally {
    document.documentElement.lang = original;
  }
});

test('setLocale() overrides document.documentElement.lang; setLocale(null) clears the override', () => {
  document.documentElement.lang = 'en';
  setLocale('tr');
  try {
    assert.equal(getLocale(), 'tr');
  } finally {
    setLocale(null);
  }
  assert.equal(getLocale(), 'en', 'clearing the override reverts to <html lang>');
});

test('{placeholder} substitution replaces named params', () => {
  const el = makeEl();
  assert.equal(t(el, 'decrease', 'Decrease {name}', { name: 'Keyboard' }), 'Decrease Keyboard');
});

test('substitution calls for different params never cross-contaminate (no shared mutable state)', () => {
  const el = makeEl();
  const a = t(el, 'decrease', 'Decrease {name}', { name: 'Keyboard' });
  const b = t(el, 'decrease', 'Decrease {name}', { name: 'Mouse' });
  assert.equal(a, 'Decrease Keyboard');
  assert.equal(b, 'Decrease Mouse');
});

test('an unmatched {placeholder} is left as-is rather than silently dropped', () => {
  const el = makeEl();
  assert.equal(t(el, 'greet', 'Hello {name}', {}), 'Hello {name}');
});

test('a data-* override string also supports {placeholder} substitution', () => {
  const el = makeEl();
  el.dataset.decrease = '{name} azalt';
  assert.equal(t(el, 'decrease', 'Decrease {name}', { name: 'Klavye' }), 'Klavye azalt');
});

test('onLocaleChange() notifies listeners synchronously on setLocale(); unsubscribe stops delivery', () => {
  const seen = [];
  const unsubscribe = onLocaleChange(() => seen.push(getLocale()));
  try {
    setLocale('tr');
    assert.deepEqual(seen, ['tr']);
    unsubscribe();
    setLocale('en');
    assert.deepEqual(seen, ['tr'], 'no further notifications after unsubscribing');
  } finally {
    setLocale(null);
  }
});
