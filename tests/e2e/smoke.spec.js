const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');
test('page loads all 37 apps without script errors', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('#cats [data-id]')).toHaveCount(37);
  expect(errors).toEqual([]);
});
