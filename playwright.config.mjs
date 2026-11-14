import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/system',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: 'test-results/system',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/system', open: 'never' }],
    ['json', { outputFile: 'test-results/system/results.json' }],
    ['junit', { outputFile: 'test-results/system/results.xml' }],
  ],
  use: {
    baseURL: process.env.ROMS_WEB_URL || 'http://127.0.0.1:5173',
    browserName: 'chromium',
    ...(process.env.ROMS_BROWSER_CHANNEL ? { channel: process.env.ROMS_BROWSER_CHANNEL } : {}),
    // Traces can contain login requests. Enable only in a controlled test environment.
    trace: process.env.ROMS_TRACE === '1' ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  // Start the frontend separately; never start an unconfigured backend/database here.
});
