import { defineConfig, devices } from '@playwright/test';

// Acceptance journeys. The app is built for a GitHub Pages project subpath (/sinara/) and points its
// optional live coach at a local FIXTURE server (simulated provider; no real model is called).
const chrome = process.env.CHROME_PATH;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/sinara/',
    locale: 'ar-IQ',
    launchOptions: chrome ? { executablePath: chrome } : {},
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'], launchOptions: chrome ? { executablePath: chrome } : {} } }],
  webServer: [
    { command: 'npx tsx tests/e2e/coach-server.ts', port: 8787, reuseExistingServer: false },
    {
      command: 'BASE_PATH=/sinara/ VITE_LIVE_COACH_URL=http://localhost:8787 npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort --base /sinara/',
      url: 'http://localhost:4173/sinara/',
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
});
