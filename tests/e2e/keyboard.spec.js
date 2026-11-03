const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https:\/\//, r => r.fulfill({ body: 'stub', contentType: 'text/html' }));
  await open(page);
});

const active = page => page.evaluate(() => {
  const a = document.activeElement;
  return { id: a.id, data: a.dataset.id, grid: a.closest('[data-grid]')?.dataset.grid, inDialog: !!a.closest('dialog') };
});

test.describe('palette', () => {
  test('Meta+K opens palette with input focused', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('#palette')).toHaveAttribute('open', '');
    await expect(page.locator('#palette-input')).toBeFocused();
  });

  test('slash opens palette', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.locator('#palette-input')).toBeFocused();
  });

  test('empty query lists favorites as options', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('#palette-list [role=option]').first()).toContainText('Gmail');
  });

  test('typing "planilha" makes Planilhas the active first option', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('planilha');
    const first = page.locator('#palette-list [role=option]').first();
    await expect(first).toContainText('Planilhas');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    const firstId = await first.getAttribute('id');
    await expect(page.locator('#palette-input')).toHaveAttribute('aria-activedescendant', firstId);
  });

  test('ArrowDown moves the active option and wraps', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('goo');
    const opts = page.locator('#palette-list [role=option]');
    const n = await opts.count();
    expect(n).toBeGreaterThan(1);
    await page.keyboard.press('ArrowDown');
    await expect(opts.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(opts.nth(n - 1)).toHaveAttribute('aria-selected', 'true');
  });

  test('Enter opens the active app in a new tab and closes', async ({ page, context }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('planilha');
    const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
    expect(popup.url()).toContain('docs.google.com/spreadsheets');
    await expect(page.locator('#palette')).not.toHaveAttribute('open', '');
  });

  test('no match shows a message', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('zzzz');
    await expect(page.locator('#palette-list [role=option]')).toHaveCount(0);
    await expect(page.locator('#palette-hint')).toHaveText('Nenhum app encontrado');
  });

  test('Escape closes and focus returns to the opener', async ({ page }) => {
    await page.locator('#open-palette').click();
    await expect(page.locator('#palette-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#palette')).not.toHaveAttribute('open', '');
    await expect(page.locator('#open-palette')).toBeFocused();
  });

  test('clicking the backdrop closes', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('#palette')).toHaveAttribute('open', '');
    await page.mouse.click(10, 700);
    await expect(page.locator('#palette')).not.toHaveAttribute('open', '');
  });

  test('background is inert while open', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.evaluate(() => document.querySelector('main .tile').focus());
    expect((await active(page)).inDialog).toBe(true);
  });
});

test.describe('grid navigation', () => {
  test('each grid exposes exactly one tab stop; fav buttons are not tab stops', async ({ page }) => {
    for (const g of ['favoritos', 'trabalho', 'conta'])
      await expect(page.locator(`[data-grid="${g}"] .tile[tabindex="0"]`)).toHaveCount(1);
    await expect(page.locator('.tile-fav[tabindex="0"]')).toHaveCount(0);
  });

  test('arrows, Home and End move focus within a grid', async ({ page }) => {
    const tiles = page.locator('[data-grid="trabalho"] .tile');
    await tiles.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tiles.nth(1)).toBeFocused();
    await expect(tiles.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(tiles.first()).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('End');
    await expect(tiles.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tiles.first()).toBeFocused();
    const cols = await page.evaluate(() =>
      getComputedStyle(document.querySelector('[data-grid="trabalho"]')).gridTemplateColumns.split(' ').length);
    await page.keyboard.press('ArrowDown');
    await expect(tiles.nth(cols)).toBeFocused();
  });

  test('F toggles favorite on the focused tile and announces it', async ({ page }) => {
    const gmail = page.locator('[data-grid="trabalho"] .tile[data-id="gmail"]');
    await gmail.focus();
    await page.keyboard.press('f');
    await expect(page.locator('[data-grid="trabalho"] .tile-fav[data-fav="gmail"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#live')).toContainText('favoritos');
    await expect(page.locator('[data-grid="trabalho"] .tile[data-id="gmail"]')).toBeFocused();
  });

  test('Alt+ArrowRight reorders favorites, keeps focus, persists', async ({ page }) => {
    const order = () => page.locator('[data-grid="favoritos"] .tile').evaluateAll(ts => ts.map(t => t.dataset.id));
    const before = await order();
    await page.locator(`[data-grid="favoritos"] .tile[data-id="${before[0]}"]`).focus();
    await page.keyboard.press('Alt+ArrowRight');
    const after = await order();
    expect(after.slice(0, 2)).toEqual([before[1], before[0]]);
    expect((await active(page)).data).toBe(before[0]);
    await page.reload();
    expect(await order()).toEqual(after);
  });
});
