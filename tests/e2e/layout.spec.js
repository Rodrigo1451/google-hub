const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

test.beforeEach(async ({ page }) => { await open(page); });

test('gmail tile shows its real logo', async ({ page }) => {
  const img = page.locator('#sec-trabalho .tile[data-id="gmail"] img');
  await expect(img).toHaveAttribute('src', /logos\/gmail\.png$/);
  expect(await img.evaluate(i => i.complete && i.naturalWidth)).toBeGreaterThan(0);
});

test('app with no logo renders the glyph svg', async ({ page }) => {
  const id = await page.evaluate(() => GH.catalog.APPS.find(a => !GH.logos[a.id])?.id);
  test.skip(!id, 'every app has a logo');
  const tile = page.locator(`#content .tile[data-id="${id}"]`).first();
  await expect(tile.locator('svg')).toBeVisible();
  await expect(tile.locator('img')).toHaveCount(0);
});

test('broken logo falls back to the glyph', async ({ page }) => {
  await page.route('**/logos/drive.png', r => r.abort());
  await page.reload();
  const tile = page.locator('#sec-trabalho .tile[data-id="drive"]');
  await expect(tile.locator('svg')).toBeVisible();
  await expect(tile.locator('img')).toHaveCount(0);
});

test('every tile opens in a new tab with a descriptive label', async ({ page }) => {
  const tiles = page.locator('.tile');
  expect(await tiles.count()).toBeGreaterThanOrEqual(37);
  for (const t of await tiles.all()) {
    await expect(t).toHaveAttribute('target', '_blank');
    await expect(t).toHaveAttribute('rel', /noopener/);
    await expect(t).toHaveAttribute('aria-label', /^Abrir .+ em nova aba$/);
  }
});

test('favorite button is not nested inside the link', async ({ page }) => {
  await expect(page.locator('.tile .tile-fav')).toHaveCount(0);
});

test('unfavoriting gmail removes it from Favoritos and persists', async ({ page }) => {
  await page.locator('#sec-favoritos .tile-fav[data-fav="gmail"]').click();
  await expect(page.locator('#sec-favoritos .tile[data-id="gmail"]')).toHaveCount(0);
  await expect(page.locator('#sec-trabalho .tile-fav[data-fav="gmail"]')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('#sec-favoritos .tile[data-id="gmail"]')).toHaveCount(0);
  await page.locator('#sec-trabalho .tile-fav[data-fav="gmail"]').click();
  await expect(page.locator('#sec-favoritos .tile[data-id="gmail"]')).toHaveCount(1);
});

test('sidebar link scrolls its section into view and marks it current', async ({ page }) => {
  const link = page.locator('.sidebar a[href="#sec-negocios-marketing"]');
  await link.click();
  await expect(page.locator('#sec-negocios-marketing h2')).toBeInViewport();
  await expect(link).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.sidebar a[aria-current="true"]')).toHaveCount(1);
});

test('skip link targets main content', async ({ page }) => {
  await page.keyboard.press('Tab');
  const skip = page.locator('a.skip');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute('href', '#content');
});
