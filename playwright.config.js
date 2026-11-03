const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/e2e',
  reporter: 'line',
  use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 860 } },
});
