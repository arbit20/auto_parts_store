import { defineConfig, devices } from '@playwright/test'

/**
 * Config E2E. La app corre dentro del contenedor `frontend` (Vite en :5174,
 * que ya hace proxy de /api al backend). Los tests se ejecutan dentro del
 * mismo contenedor con `npx playwright test`, por lo que baseURL apunta a
 * localhost:5174. El servidor ya está levantado por docker compose, así que
 * no se usa `webServer`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
