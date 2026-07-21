/**
 * E2E: <dv-counter> behavior in a real browser (ADR-0008 #2).
 */
import { test, expect } from '@playwright/test';

test('counter upgrades from data-* and increments/decrements by step', async ({ page }) => {
  await page.goto('/examples/counter.html');

  const configured = page.locator('dv-counter').nth(1); // data-start="10" data-step="5"
  await expect(configured.locator('output')).toHaveText('10');

  await configured.getByLabel('Increase').click();
  await expect(configured.locator('output')).toHaveText('15');

  await configured.getByLabel('Decrease').click();
  await expect(configured.locator('output')).toHaveText('10');
});

test('dv:change events reach page-level listeners', async ({ page }) => {
  await page.goto('/examples/counter.html');

  const observed = page.locator('#observed');
  await observed.getByLabel('Increase').click();

  await expect(page.locator('#log')).toHaveText('events: dv:change → count = 1');
});

test('multiple counters stay independent', async ({ page }) => {
  await page.goto('/examples/counter.html');

  const plain = page.locator('dv-counter').nth(0);
  const configured = page.locator('dv-counter').nth(1);

  await plain.getByLabel('Increase').click();
  await expect(plain.locator('output')).toHaveText('1');
  await expect(configured.locator('output')).toHaveText('10'); // untouched
});
