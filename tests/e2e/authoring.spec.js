import { test, expect } from '@playwright/test';

test('.dv.js files load directly in the browser and use concise event directives', async ({ page }) => {
  await page.goto('/examples/authoring-counter.html');
  const counter = page.locator('acme-authoring-counter');

  await expect(counter.getByRole('button')).toHaveText('Count: 4');
  await counter.getByRole('button').click();
  await expect(counter.getByRole('button')).toHaveText('Count: 6');
  await expect(page.locator('#result')).toHaveText('Changed to 6');
});

test('technical docs present and run the browser-direct AI-first authoring path', async ({ page }) => {
  await page.goto('/site/en/docs/');
  await expect(page.getByRole('heading', { name: /One component object/i })).toBeVisible();

  const counter = page.locator('dv-doc-counter');
  await expect(counter.getByRole('button')).toHaveText('Count 4');
  await counter.getByRole('button').click();
  await expect(counter.getByRole('button')).toHaveText('Count 6');
  await expect(page.locator('#authoring-result')).toHaveText('Count changed to 6.');
});
