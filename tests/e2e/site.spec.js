import { test, expect } from '@playwright/test';

test('marketing site loads CDN components and links its learning paths', async ({ page }) => {
  await page.goto('/site/index.html');
  await expect(page).toHaveTitle(/DevinimJS/);
  await expect(page.getByRole('heading', { name: /Reactive UI/ })).toBeVisible();

  const counter = page.locator('dv-counter');
  await expect(counter.locator('output')).toHaveText('3');
  await counter.getByLabel('Increase').click();
  await expect(counter.locator('output')).toHaveText('4');

  await page.getByRole('link', { name: 'Docs' }).first().click();
  await expect(page).toHaveURL(/\/site\/en\/docs\/$/);
  await expect(page.getByRole('heading', { name: /Small APIs/ })).toBeVisible();
});

test('component catalog loads atomic components from the pinned CDN release', async ({ page }) => {
  await page.goto('/site/en/components/');
  await expect(page.getByRole('heading', { name: /Small building blocks/ })).toBeVisible();

  const search = page.locator('dv-search input');
  await search.fill('product');
  await expect(page.locator('[data-component-item]:visible')).toHaveCount(1);
  await search.fill('');

  await page.locator('dv-product-card').getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('#cart-result')).toContainText('Mechanical Keyboard added');

  await page.locator('dv-field input').fill('hello@example.com');
  await page.locator('dv-field input').press('Tab');

  const confirm = page.locator('dv-confirm');
  await confirm.getByRole('button', { name: 'Delete draft' }).click();
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('#form-result')).toHaveText('Confirmed: draft-12');

  await page.locator('dv-autocomplete input').fill('key');
  await page.locator('dv-autocomplete').getByRole('button', { name: 'Keyboard' }).click();
  await expect(page.locator('#autocomplete-result')).toHaveText('Selected: Keyboard');

  await page.locator('dv-data-table').getByRole('button', { name: 'Product' }).click();
  await expect(page.locator('dv-data-table tbody tr').first()).toContainText('Keyboard');
});
