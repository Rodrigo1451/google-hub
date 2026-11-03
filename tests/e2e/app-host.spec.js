const { test, expect } = require('@playwright/test');
const { URL } = require('./helpers');

// The native macOS app loads index.html?host=app; the page flags itself before first paint.
test.beforeEach(async ({ page }) => { await page.goto(URL + '?host=app'); });

test('host flag is set on <html> before body renders', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('data-host', 'app');
});

test('page background is transparent so the window vibrancy shows through', async ({ page }) => {
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});

test('decorative wallpaper is hidden (the real desktop is the wallpaper)', async ({ page }) => {
  await expect(page.locator('.wallpaper')).toBeHidden();
});

test('traffic lights get room: brand and toolbar clear the 28px title bar', async ({ page }) => {
  const brandTop = await page.locator('.brand').evaluate(el => el.getBoundingClientRect().top);
  const searchTop = await page.locator('#open-palette').evaluate(el => el.getBoundingClientRect().top);
  expect(brandTop).toBeGreaterThanOrEqual(40);
  expect(searchTop).toBeGreaterThanOrEqual(30);
});

test('browser mode is unchanged', async ({ browser }) => {
  const p = await browser.newPage();
  await p.goto(URL);
  expect(await p.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await expect(p.locator('.wallpaper')).toBeVisible();
  await p.close();
});
