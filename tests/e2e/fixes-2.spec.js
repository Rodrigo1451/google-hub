const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https:\/\//, r => r.fulfill({ body: 'stub', contentType: 'text/html' }));
  await open(page);
});

test.describe('Space activates like Enter', () => {
  test('Space on a focused tile opens it in a new tab', async ({ page, context }) => {
    await page.locator('[data-grid="trabalho"] .tile[data-id="drive"]').focus();
    const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Space')]);
    expect(popup.url()).toContain('drive.google.com');
  });
  test('Space on a quick-create chip opens it', async ({ page, context }) => {
    await page.locator('.chip').first().focus();
    const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Space')]);
    expect(popup.url()).toContain('docs.new');
  });
  test('Space on a tile does not scroll the page', async ({ page, context }) => {
    await page.locator('[data-grid="trabalho"] .tile').first().focus();
    const y = await page.evaluate(() => scrollY);
    await Promise.all([context.waitForEvent('page'), page.keyboard.press('Space')]);
    expect(await page.evaluate(() => scrollY)).toBe(y);
  });
});

test.describe('Google account picker', () => {
  const picker = page => page.getByRole('radiogroup', { name: 'Conta Google' });

  test('offers 4 accounts with the default one selected', async ({ page }) => {
    await expect(picker(page).getByRole('radio')).toHaveCount(4);
    await expect(picker(page).getByRole('radio').first()).toBeChecked();
    await expect(page.locator('.tile[data-id="gmail"]').first()).toHaveAttribute('href', 'https://mail.google.com/');
  });

  test('choosing account 2 rewrites tile and chip links and persists', async ({ page }) => {
    await picker(page).getByRole('radio').nth(1).check();
    await expect(page.locator('.tile[data-id="gmail"]').first()).toHaveAttribute('href', 'https://mail.google.com/?authuser=1');
    await expect(page.locator('.chip').first()).toHaveAttribute('href', /authuser=1/);
    await expect(page.locator('#live')).toContainText('conta 2');
    await page.reload();
    await expect(picker(page).getByRole('radio').nth(1)).toBeChecked();
    await expect(page.locator('.tile[data-id="drive"]').first()).toHaveAttribute('href', /authuser=1/);
  });

  test('the palette opens apps in the chosen account', async ({ page, context }) => {
    await picker(page).getByRole('radio').nth(2).check();
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('planilha');
    const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
    expect(popup.url()).toContain('authuser=2');
  });
});
