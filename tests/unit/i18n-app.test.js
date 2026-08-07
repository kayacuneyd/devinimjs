/**
 * Tests for createI18n (ADR-0024): catalog resolution with fallback, interpolation,
 * pipe pluralization and locale switching that notifies primitive subscribers.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'document']) globalThis[key] = window[key];

const { createI18n, onLocaleChange, setLocale } = await import('../../src/core/i18n.js');

const messages = {
  tr: { save: 'Kaydet', hello: 'Merhaba {name}', post_count: '{count} yazı' },
  en: { save: 'Save', hello: 'Hello {name}', post_count: '{count} post|{count} posts' },
};

test('t resolves active-locale entries, falls back, then returns the key itself', () => {
  const i18n = createI18n({ locale: 'tr', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('save'), 'Kaydet');
  assert.equal(i18n.t('missing', undefined), 'missing');

  const german = createI18n({ locale: 'de', fallbackLocale: 'en', messages });
  assert.equal(german.t('save'), 'Save'); // whole locale missing → fallback bundle
  assert.equal(german.t('missing-key'), 'missing-key');
});

test('interpolation substitutes {placeholder} tokens', () => {
  const i18n = createI18n({ locale: 'tr', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('hello', { name: 'Ahmet' }), 'Merhaba Ahmet');
});

test('two-form pipes select one/other by count; pipe-free entries ignore count', () => {
  const i18n = createI18n({ locale: 'en', fallbackLocale: 'en', messages });
  assert.equal(i18n.t('post_count', { count: 1 }), '1 post');
  assert.equal(i18n.t('post_count', { count: 5 }), '5 posts');

  const tr = createI18n({ locale: 'tr', fallbackLocale: 'en', messages });
  assert.equal(tr.t('post_count', { count: 1 }), '1 yazı');
  assert.equal(tr.t('post_count', { count: 5 }), '5 yazı');
});

test('three-form pipes select zero/one/other', () => {
  const i18n = createI18n({
    locale: 'en',
    messages: { en: { items: 'no items|one item|{count} items' } },
  });
  assert.equal(i18n.t('items', { count: 0 }), 'no items');
  assert.equal(i18n.t('items', { count: 1 }), 'one item');
  assert.equal(i18n.t('items', { count: 7 }), '7 items');
});

test('setLocale switches the catalog and notifies onLocaleChange subscribers', () => {
  const i18n = createI18n({ locale: 'en', fallbackLocale: 'en', messages });
  const seen = [];
  const unsubscribe = onLocaleChange(() => seen.push(i18n.locale));
  try {
    assert.equal(i18n.t('save'), 'Save');
    i18n.setLocale('tr');
    assert.equal(i18n.t('save'), 'Kaydet');
    assert.deepEqual(seen, ['tr']);
  } finally {
    unsubscribe();
    i18n.setLocale('en');
    setLocale(null); // leave no module-level override behind for other tests
  }
});

test('locale getter defers to <html lang> when no override is set', () => {
  document.documentElement.lang = 'tr';
  const i18n = createI18n({ fallbackLocale: 'en', messages });
  try {
    assert.equal(i18n.locale, 'tr');
    assert.equal(i18n.t('save'), 'Kaydet');
  } finally {
    document.documentElement.lang = '';
  }
});
