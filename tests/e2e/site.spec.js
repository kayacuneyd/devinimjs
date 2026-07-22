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

test('component catalog loads atomic components from the pinned CDN release', async ({ page }) => {
  await page.goto('/site/components/index.html');
  await expect(page.getByRole('heading', { name: /Small building blocks/ })).toBeVisible();

  const dropdown = page.locator('dv-dropdown');
  await dropdown.getByRole('button', { name: 'Account' }).click();
  await expect(dropdown.getByRole('menu')).toBeVisible();

  const search = page.locator('dv-search input');
  await search.fill('keyboard');
  await expect(page.locator('#search-result')).toContainText('keyboard');

  await page.locator('dv-product-card').getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('#cart-result')).toContainText('Cart: 1');

  await page.locator('dv-field input').fill('hello@example.com');
  await page.locator('dv-field input').press('Tab');
  await expect(page.locator('#field-result')).toHaveText('Email saved.');

  const confirm = page.locator('dv-confirm');
  await confirm.getByRole('button', { name: 'Delete draft' }).click();
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('#confirm-result')).toHaveText('Deleted draft-12.');

  await page.locator('dv-autocomplete input').fill('key');
  await page.locator('dv-autocomplete').getByRole('button', { name: 'Keyboard' }).click();
  await expect(page.locator('#autocomplete-result')).toHaveText('Selected Keyboard.');

  await page.locator('dv-data-table').getByRole('button', { name: 'Product' }).click();
  await expect(page.locator('dv-data-table tbody tr').first()).toContainText('Keyboard');
});
