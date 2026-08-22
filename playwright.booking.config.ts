import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const workspaceRoot = process.cwd();
const backendRoot = path.resolve(process.env.E2E_BACKEND_ROOT ?? path.join(workspaceRoot, '..', 'pitell'));
const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 5173);
const backendPort = Number(process.env.E2E_BACKEND_PORT ?? 8010);
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: './tests/e2e-booking',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/booking' }]],
  outputDir: 'test-results/booking',
  webServer: [
    {
      name: 'backend',
      command: './gradlew :src:app:bootRun',
      cwd: backendRoot,
      url: `${backendUrl}/actuator/health`,
      reuseExistingServer: false,
      // A cold CI machine needs longer than a warm developer one.
      timeout: Number(process.env.E2E_BACKEND_TIMEOUT_MS ?? 240_000),
      stdout: 'pipe',
      stderr: 'pipe',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    },
    {
      name: 'frontend',
      command: `./node_modules/.bin/react-router dev --host 127.0.0.1 --port ${frontendPort}`,
      cwd: workspaceRoot,
      url: `${frontendUrl}/booking/public/appointment`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    },
  ],
  use: {
    baseURL: frontendUrl,
    ...devices['Pixel 5'],
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'environment',
      testMatch: /environment\.setup\.ts/,
    },
    {
      name: 'booking-flow',
      testIgnore: /environment\.setup\.ts/,
      dependencies: ['environment'],
    },
  ],
});
