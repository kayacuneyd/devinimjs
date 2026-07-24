import { test, expect } from '@playwright/test';

/**
 * Real-Chromium coverage for the i18n/locale primitive (ADR-0019), exercised through
 * `examples/i18n.html`. The unit suite (`tests/unit/i18n.test.js`, `dv-modal.test.js`,
 * `dv-confirm.test.js`, `atomic-components.test.js`) already covers the three-tier resolution
 * order and substitution logic in isolation — this proves a real locale switch actually changes
 * rendered copy across all three reference components together, in a real browser.
 */
test('switching the locale toggle re-renders dv-modal, dv-confirm and dv-cart with tr copy, and back', async ({ page }) => {
  await page.goto('/examples/i18n.html');

  // Starting state: en (both the default fallback strings and <html lang="en">).
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Open dialog' }).click();
  await expect(page.locator('.dv-modal h2')).toHaveText('Dialog');
  await expect(page.locator('dv-confirm button')).toHaveText('Delete');
  await expect(page.locator('dv-cart [data-amount="-1"]').first()).toHaveAttribute('aria-label', 'Decrease Keyboard');
  await expect(page.locator('dv-cart [data-amount="-1"]').nth(1)).toHaveAttribute('aria-label', 'Decrease Mouse');

  await page.getByRole('button', { name: 'Türkçe' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('.dv-modal h2')).toHaveText('Pencere');
  await expect(page.locator('.dv-modal [aria-label]').filter({ hasText: '×' })).toHaveAttribute('aria-label', 'Kapat');
  await expect(page.locator('dv-confirm button')).toHaveText('Sil');
  // Two distinct cart rows prove per-row parameterized substitution isn't cross-contaminated.
  await expect(page.locator('dv-cart [data-amount="-1"]').first()).toHaveAttribute('aria-label', 'Keyboard azalt');
  await expect(page.locator('dv-cart [data-amount="-1"]').nth(1)).toHaveAttribute('aria-label', 'Mouse azalt');

  await page.getByRole('button', { name: 'English' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.dv-modal h2')).toHaveText('Dialog');
  await expect(page.locator('dv-cart [data-amount="-1"]').first()).toHaveAttribute('aria-label', 'Decrease Keyboard');
});

test('a data-* override still wins over the active locale after switching (ADR-0005 regression)', async ({ page }) => {
  await page.goto('/examples/i18n.html');
  await page.evaluate(() => document.querySelector('dv-confirm').setAttribute('data-label', 'Custom label'));

  await page.getByRole('button', { name: 'Türkçe' }).click();
  await expect(page.locator('dv-confirm button')).toHaveText('Custom label');
});
