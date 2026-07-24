import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const englishRoutes = [
  '/site-next/',
  '/site-next/about/',
  '/site-next/docs/',
  '/site-next/tutorials/',
  '/site-next/components/',
  '/site-next/examples/',
  '/site-next/contact/',
  '/site-next/security/',
  '/site-next/privacy/',
  '/site-next/terms/',
  '/site-next/license/',
];

const turkishRoutes = [
  '/site-next/tr/',
  '/site-next/tr/about/',
  '/site-next/tr/docs/',
  '/site-next/tr/tutorials/',
  '/site-next/tr/contact/',
  '/site-next/tr/security/',
  '/site-next/tr/privacy/',
  '/site-next/tr/terms/',
  '/site-next/tr/license/',
];

const criticalRoutes = [...englishRoutes, ...turkishRoutes];

async function assertNoBrowserErrors(page, route) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = (error) => pageErrors.push(error.message);

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(150);
  page.off('console', onConsole);
  page.off('pageerror', onPageError);

  expect(consoleErrors, `${route}: browser console errors`).toEqual([]);
  expect(pageErrors, `${route}: uncaught page errors`).toEqual([]);
}

async function assertNoHorizontalOverflow(page, route, viewport) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.scrollWidth,
    `${route} at ${viewport}: document has horizontal overflow (${dimensions.scrollWidth}px > ${dimensions.clientWidth}px)`,
  ).toBeLessThanOrEqual(dimensions.clientWidth);
}

test.describe('site-next route loading', () => {
  test('critical English and Turkish routes load without browser errors', async ({ page }) => {
    for (const route of criticalRoutes) {
      await assertNoBrowserErrors(page, route);
      await expect(page.locator('main'), `${route}: main content`).toBeVisible();
      await expect(page.locator('h1'), `${route}: page heading`).toHaveCount(1);
    }
  });
});

test.describe('site-next responsive shell', () => {
  for (const [viewport, size] of [
    ['mobile', { width: 390, height: 844 }],
    ['desktop', { width: 1440, height: 900 }],
  ]) {
    test(`${viewport} critical routes have no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(size);

      for (const route of criticalRoutes) {
        await assertNoBrowserErrors(page, route);
        await assertNoHorizontalOverflow(page, route, viewport);
      }
    });
  }
});

test('English routes share one stable navigation and footer contract', async ({ page }) => {
  const navigation = ['About', 'Docs', 'Tutorials', 'Components', 'Examples', 'Contact', 'Start building'];
  const footer = ['Privacy', 'Terms', 'License'];

  for (const route of englishRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header .dv-nav a')).toHaveText(navigation);
    await expect(page.locator('footer nav a')).toHaveText(footer);
  }
});

test('responsive navigation opens and closes as an accessible mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/site-next/components/', { waitUntil: 'networkidle' });

  const toggle = page.locator('.dv-nav-toggle');
  const nav = page.locator('header .dv-nav');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).not.toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).not.toBeVisible();
});

test('component cards disclose paste-ready usage code without losing the source', async ({ page }) => {
  await page.goto('/site-next/components/', { waitUntil: 'networkidle' });

  const counterCard = page.locator('[data-component-item]').filter({ has: page.getByRole('heading', { name: 'Counter' }) });
  const toggle = counterCard.locator('.dv-code-toggle');
  const source = counterCard.locator('.dv-code-block pre');
  await expect(toggle).toBeVisible();
  await expect(source).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(source).toBeVisible();
  await expect(source).toContainText('<dv-counter data-start="2" data-step="2">');
  await expect(counterCard.getByRole('button', { name: 'Copy' })).toBeVisible();
});

test('catalog modal opens as an overlay and closes through its labelled icon control', async ({ page }) => {
  await page.goto('/site-next/components/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open modal' }).click();

  const dialog = page.getByRole('dialog', { name: 'Component details' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.dv-modal-backdrop')).toHaveCSS('position', 'fixed');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).not.toBeVisible();
});

test('homepage exposes working DevinimJS interactions', async ({ page }) => {
  const route = '/site-next/';
  await assertNoBrowserErrors(page, route);

  const counter = page.locator('#home-counter');
  await expect(counter, `${route}: counter component`).toBeVisible();
  await expect(counter.locator('output'), `${route}: initial counter output`).toHaveText('0');
  await counter.getByRole('button', { name: 'Increase' }).click();
  await expect(counter.locator('output'), `${route}: counter after increment`).toHaveText('1');
  await expect(page.locator('#home-counter-result'), `${route}: counter change event`).toContainText('Count is 1');

  const search = page.locator('#home-search input');
  await search.fill('DevinimJS');
  await expect(page.locator('#home-search-result'), `${route}: search query event`).toContainText('Query event: DevinimJS');
});

test('component catalog filters its real component cards', async ({ page }) => {
  const route = '/site-next/components/';
  await assertNoBrowserErrors(page, route);

  const search = page.locator('#catalog-search input');
  const cards = page.locator('[data-component-item]');
  await expect(cards, `${route}: component cards before filtering`).toHaveCount(9);

  await search.fill('forms');
  await expect(page.locator('[data-component-item]:not([hidden])'), `${route}: visible cards for forms filter`).toHaveCount(1);
  await expect(page.locator('[data-component-item]:not([hidden]) h2')).toHaveText('Field');
  await expect(page.locator('#catalog-event-log'), `${route}: catalog filter event`).toContainText('Showing 1 component');

  await search.fill('');
  await expect(page.locator('[data-component-item]:not([hidden])'), `${route}: cards after clearing filter`).toHaveCount(9);
});

for (const [route, label] of [
  ['/site-next/', 'homepage'],
  ['/site-next/components/', 'component catalog'],
]) {
  test(`${label} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await assertNoBrowserErrors(page, route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations, `${route}: axe WCAG A/AA violations`).toEqual([]);
  });
}
