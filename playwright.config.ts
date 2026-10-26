import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: ['**/home-webgl.spec.ts', '**/lab-webgl.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      testIgnore: ['**/home-webgl.spec.ts', '**/lab-webgl.spec.ts'],
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'chromium-webgl',
      testMatch: ['**/home-webgl.spec.ts', '**/lab-webgl.spec.ts'],
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] },
      },
    },
  ],
});
