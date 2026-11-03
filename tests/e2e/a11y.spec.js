const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { open } = require('./helpers');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const violations = async page => {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
};
const settle = page => page.waitForTimeout(450); // let entrance/palette transitions finish before measuring contrast

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} mode`, () => {
    test.beforeEach(async ({ page }) => { await page.emulateMedia({ colorScheme: scheme }); await open(page); await settle(page); });

    test('no axe violations', async ({ page }) => {
      expect(await violations(page)).toEqual([]);
    });

    test('no axe violations with palette open', async ({ page }) => {
      await page.keyboard.press('Meta+k');
      await page.keyboard.type('go');
      await settle(page);
      expect(await violations(page)).toEqual([]);
    });

    test('no axe violations with reduced transparency', async ({ page }) => {
      await page.evaluate(() => { document.documentElement.dataset.a11yTest = 'reduced-transparency'; });
      expect(await violations(page)).toEqual([]);
    });
  });
}

test.describe('materials', () => {
  test.beforeEach(async ({ page }) => { await open(page); });
  const blur = (page, sel) => page.locator(sel).first().evaluate(el => getComputedStyle(el).webkitBackdropFilter || getComputedStyle(el).backdropFilter);

  test('toolbar, sidebar and tiles are glass', async ({ page }) => {
    for (const sel of ['.toolbar', '.sidebar', '.tile']) expect(await blur(page, sel), sel).toContain('blur');
  });

  test('reduced transparency makes glass solid', async ({ page }) => {
    await page.evaluate(() => { document.documentElement.dataset.a11yTest = 'reduced-transparency'; });
    for (const sel of ['.toolbar', '.sidebar', '.tile']) expect(await blur(page, sel), sel).toBe('none');
    const bg = await page.locator('.sidebar').first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/^rgb\(/); // fully opaque, no alpha channel
  });

  test('palette is a thick glass sheet', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    expect(await blur(page, '#palette')).toContain('blur');
  });
});

test('every interactive target is at least 44x44', async ({ page }) => {
  await open(page);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.tile, .chip, #nav a, .tile-fav, #open-palette')]
      .map(el => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width < 44 || r.height < 44)
      .map(({ el, r }) => `${el.className || el.id} ${Math.round(r.width)}x${Math.round(r.height)}`));
  expect(small).toEqual([]);
});

test('reduced motion: palette opens without transform', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(50);
  expect(await page.locator('#palette').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});

test('normal motion: palette materializes with scale and blur', async ({ page }) => {
  await open(page);
  const anim = await page.evaluate(() => {
    GH.palette.open();
    return document.getAnimations().some(a => a.effect?.target?.id === 'palette') ||
      getComputedStyle(document.getElementById('palette')).transitionProperty.includes('transform');
  });
  expect(anim).toBe(true);
});
