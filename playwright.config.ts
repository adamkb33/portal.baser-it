import { defineConfig } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const e2eEnvPath = path.resolve(process.cwd(), '.env.e2e');
if (fs.existsSync(e2eEnvPath)) {
  loadEnv({ path: e2eEnvPath, override: false });
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
