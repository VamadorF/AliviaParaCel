import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '8081';
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * E2E sobre Expo web (React Native Web). Ver https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Pixel 5'],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
