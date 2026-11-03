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

// Native title bar with a unified toolbar is 52px tall; traffic lights sit inside the floating sidebar.
test('brand sits below the traffic lights inside the sidebar', async ({ page }) => {
  const sb = await page.locator('.sidebar').evaluate(el => el.getBoundingClientRect().toJSON());
  const brandTop = await page.locator('.brand').evaluate(el => el.getBoundingClientRect().top);
  expect(sb.top).toBeLessThanOrEqual(10);
  expect(brandTop).toBeGreaterThanOrEqual(52);
});

test('web search button is hidden (the native toolbar has it) and the toolbar band matches the title bar', async ({ page }) => {
  await expect(page.locator('#open-palette')).toBeHidden();
  const h = await page.locator('.toolbar').evaluate(el => el.getBoundingClientRect().height);
  expect(h).toBeGreaterThanOrEqual(52);
  expect(h).toBeLessThanOrEqual(64);
});

test('skip link is fully off-screen until focused (app mode)', async ({ page }) => {
  const r = await page.locator('a.skip').evaluate(el => el.getBoundingClientRect().toJSON());
  expect(r.bottom).toBeLessThanOrEqual(0);
});

test('browser mode is unchanged', async ({ browser }) => {
  const p = await browser.newPage();
  await p.goto(URL);
  expect(await p.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await expect(p.locator('.wallpaper')).toBeVisible();
  await p.close();
});

test('skip link is fully off-screen until focused (browser mode)', async ({ browser }) => {
  const p = await browser.newPage();
  await p.goto(URL);
  const r = await p.locator('a.skip').evaluate(el => el.getBoundingClientRect().toJSON());
  expect(r.bottom).toBeLessThanOrEqual(0);
  await p.close();
});
