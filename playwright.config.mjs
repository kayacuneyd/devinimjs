import { defineConfig } from '@playwright/test';

/**
 * E2E layer (ADR-0008 #2/#3): real-Chromium behavioral tests + axe-core accessibility scans
 * against the statically served examples. The dev server starts automatically.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 20000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8899',
    headless: true,
  },
  webServer: {
    command: 'node scripts/serve.mjs --port 8899',
    port: 8899,
    reuseExistingServer: !process.env.CI,
  },
  // channel 'chromium': force the full Chrome-for-Testing build — the stripped-down
  // headless shell crashes (SIGSEGV) on some Linux desktops; the full build is reliable.
  projects: [{ name: 'chromium', use: { browserName: 'chromium', channel: 'chromium' } }],
});
