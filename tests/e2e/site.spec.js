import { test, expect } from '@playwright/test';

test('marketing site loads CDN components and links its learning paths', async ({ page }) => {
  await page.goto('/site/index.html');
  await expect(page).toHaveTitle(/DevinimJS/);
  await expect(page.getByRole('heading', { name: /Modern interaction/ })).toBeVisible();

  const counter = page.locator('dv-counter');
  await expect(counter.locator('output')).toHaveText('3');
  await counter.getByLabel('Increase').click();
  await expect(counter.locator('output')).toHaveText('4');

  await page.getByRole('link', { name: 'Docs' }).first().click();
  await expect(page).toHaveURL(/docs\.html$/);
  await expect(page.getByRole('heading', { name: /Small APIs/ })).toBeVisible();
});
