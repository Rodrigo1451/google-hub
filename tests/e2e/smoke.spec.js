const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');
test('page loads all 37 apps without script errors', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('.section:not(#sec-favoritos) .tile')).toHaveCount(37);
  expect(errors).toEqual([]);
});
