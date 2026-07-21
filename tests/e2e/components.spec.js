import { test, expect } from '@playwright/test';

test('disclosure and pagination provide usable native controls', async ({ page }) => {
  await page.goto('/examples/components.html');
  const disclosure = page.locator('dv-disclosure');
  await expect(disclosure.getByText('Disclosure content')).toBeHidden();
  await disclosure.getByRole('button', { name: 'More details' }).click();
  await expect(disclosure.getByText('Disclosure content')).toBeVisible();

  const pagination = page.locator('dv-pagination');
  await pagination.getByRole('button', { name: 'Next' }).click();
  await expect(pagination.getByText('Page 2 of 3')).toBeVisible();
});

test('modal closes with Escape and toast announces its message', async ({ page }) => {
  await page.goto('/examples/components.html');
  await page.getByRole('button', { name: 'Open dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Example dialog' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Show toast' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved');
});
