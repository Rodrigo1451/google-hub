const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { open } = require('./helpers');

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https:\/\//, r => r.fulfill({ body: 'stub', contentType: 'text/html' }));
});

test('palette stays open when reopened after a close that timed out (hidden tab)', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#palette')).toHaveAttribute('open', '');
  await page.evaluate(() => { GH.palette.close(); document.getAnimations().forEach(a => a.pause()); });
  await expect(page.locator('#palette')).not.toHaveAttribute('open', '', { timeout: 2000 });
  await page.evaluate(() => document.getAnimations().forEach(a => a.play()));
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(800);
  await expect(page.locator('#palette')).toHaveAttribute('open', '');
});

test('Meta+K right after Escape reopens the palette', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#palette-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(500);
  await expect(page.locator('#palette')).toHaveAttribute('open', '');
  await expect(page.locator('#palette-input')).toBeFocused();
});

test('activating a sidebar link moves keyboard focus into that section', async ({ page }) => {
  await open(page);
  await page.locator('#nav a[data-nav="conta"]').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => document.activeElement.closest('section')?.id)).toBe('sec-conta');
  await page.keyboard.press('Tab');
  // next Tab continues after Conta, not back at the toolbar/top
  expect(await page.evaluate(() => document.activeElement.id)).not.toBe('open-palette');
});

for (const scheme of ['light', 'dark']) {
  test(`no axe violations with increased contrast (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, contrast: 'more' });
    await open(page);
    await page.waitForTimeout(450);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
