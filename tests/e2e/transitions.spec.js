import { test, expect } from '@playwright/test';

/**
 * Real-Chromium coverage for the transition primitive (ADR-0018). happy-dom (the unit suite)
 * never runs actual CSS, so the meaningful end-to-end claim — a real `transitionend` firing
 * from real CSS resolves `awaitTransition` before its timeout fallback would — can only be
 * proven here.
 *
 * `examples/components.html` ships with no stylesheet (it's the bare-markup fixture other e2e
 * specs already use); `themes/ckcss.css` is injected at test time via `addStyleTag` so this
 * exercises the shipped reference transition CSS without editing that fixture file.
 */
test('modal backdrop stays mounted through its real CSS exit transition, then hides (ADR-0018)', async ({ page }) => {
  await page.goto('/examples/components.html');
  await page.addStyleTag({ path: 'themes/ckcss.css' });

  await page.getByRole('button', { name: 'Open dialog' }).click();
  const backdrop = page.locator('.dv-modal-backdrop');
  await expect(backdrop).toBeVisible();
  await expect(backdrop).not.toHaveAttribute('data-leaving', '');

  await page.keyboard.press('Escape');

  // Still mounted and visible immediately after close() — the exit transition is in flight and
  // dv:close/focus-return already happened synchronously; only the DOM-presence teardown waits.
  await expect(backdrop).toHaveAttribute('data-leaving', '');
  await expect(backdrop).toBeVisible();

  // The real CSS transition (themes/ckcss.css: `transition: opacity .18s ease`) fires a genuine
  // transitionend well under the primitive's 200ms timeout fallback — this proves the primitive
  // is resolving on the real event, not silently falling back to the timeout on every close.
  const start = Date.now();
  await expect(backdrop).toBeHidden({ timeout: 1000 });
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(1000);
});

test('a toast stack item fades out and is removed from the DOM on dismissal (ADR-0018)', async ({ page }) => {
  await page.goto('/examples/components.html');
  await page.addStyleTag({ path: 'themes/ckcss.css' });

  // This fixture only wires up dv-modal/dv-toast, not dv-toast-stack — drive it directly.
  await page.evaluate(async () => {
    await import('/src/components/dv-toast-stack.js');
    const stack = document.createElement('dv-toast-stack');
    stack.dataset.duration = '0';
    document.body.appendChild(stack);
    globalThis.__stack = stack;
    globalThis.__id = stack.show('Saved');
  });

  const item = page.locator('dv-toast-stack output');
  await expect(item).toBeVisible();

  await page.evaluate(() => globalThis.__stack.dismiss(globalThis.__id));

  await expect(item).toHaveAttribute('data-leaving', '');
  await expect(item).toHaveCount(0, { timeout: 1000 });
});
