/**
 * E2E: axe-core accessibility scans of the example pages (ADR-0008 #3, constitution §5.3 —
 * WCAG AA minimum). Any violation fails the build.
 */
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

for (const pagePath of ['/examples/counter.html', '/examples/tabs.html']) {
  test(`${pagePath} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(pagePath);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}
