/**
 * E2E: <dv-tabs> keyboard behavior and focus management in a real browser — the layer where
 * happy-dom cannot be the source of truth (ADR-0008 #2).
 */
import { test, expect } from '@playwright/test';

test('tabs render with ARIA wiring and show only the active panel', async ({ page }) => {
  await page.goto('/examples/tabs.html');

  await expect(page.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'false');
  await expect(page.getByRole('tabpanel', { name: 'General' })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'Profile' })).toBeHidden();
});

test('arrow keys move selection AND focus together (automatic activation)', async ({ page }) => {
  await page.goto('/examples/tabs.html');

  await page.getByRole('tab', { name: 'General' }).focus();
  await page.keyboard.press('ArrowRight');

  const profile = page.getByRole('tab', { name: 'Profile' });
  await expect(profile).toBeFocused();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'General' })).toBeHidden();

  // Wrap-around: ArrowLeft from first tab lands on the last.
  await page.getByRole('tab', { name: 'General' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Security' })).toBeFocused();
});

test('roving tabindex survives re-renders in a real browser', async ({ page }) => {
  await page.goto('/examples/tabs.html');

  await page.getByRole('tab', { name: 'General' }).focus();
  await page.keyboard.press('End');

  await expect(page.getByRole('tab', { name: 'Security' })).toHaveAttribute('tabindex', '0');
  await expect(page.getByRole('tab', { name: 'General' })).toHaveAttribute('tabindex', '-1');
});

test('a nested component inside a tab panel keeps working after tab switches', async ({ page }) => {
  await page.goto('/examples/tabs.html');

  await page.getByRole('tab', { name: 'Profile' }).click();
  const nested = page.getByRole('tabpanel', { name: 'Profile' }).locator('dv-counter');
  await expect(nested.locator('output')).toHaveText('3');

  await nested.getByLabel('Increase').click();
  await expect(nested.locator('output')).toHaveText('4');

  // Switch away and back: the nested island's state survives (morph never touches outlets).
  await page.getByRole('tab', { name: 'Security' }).click();
  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(nested.locator('output')).toHaveText('4');
});
