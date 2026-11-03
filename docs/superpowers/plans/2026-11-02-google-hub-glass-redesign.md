# Google Hub — Glass Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-file Google Hub dashboard into a macOS-native-feeling "Liquid Glass" launcher with real Google product logos, a Spotlight-style command palette, full keyboard and screen-reader support, and tests.

**Architecture:** Plain HTML/CSS/JS opened from `file://` in Safari — no build step, no server. Logic is split into small classic scripts that attach to a `window.GH` namespace and also export via `module.exports` (UMD-lite), so `node --test` can unit-test them while Safari loads them without ES modules (ES modules and `fetch()` are blocked on `file://`). Logos are downloaded once into `logos/` by a shell script that also writes `logos/manifest.js`; the UI falls back to the existing glyph tiles for any app without a logo.

**Tech Stack:** HTML, CSS (backdrop-filter, color-mix, media queries), vanilla JS (ES2020), Node ≥ 20 built-in test runner, Playwright (`@playwright/test`, WebKit engine = Safari proxy), `@axe-core/playwright`, bash + curl + sips.

**Spec:** The user's request (2026-11-02): *"pegando isso como um começo, melhore todo o UI/UX, acessibilidade, coloque as logos (não vou divulgar, isso é apenas para mim) e deixe tudo mais com cara de Apple, mais glass."* + the original brief (Mac app that opens every Google service in Safari, Apple design per the `apple-design` skill at `~/.agents/skills/apple-design/SKILL.md`). Starting point: `~/GoogleHub/index.html` and `~/Applications/Google Hub.app`.

## Global Constraints

- Everything runs from `file:///Users/rodrigogarcia/GoogleHub/index.html` in Safari: no ES modules, no `fetch`, no external CDN at runtime. Logos are local files.
- Every app link opens in a new Safari tab: `target="_blank" rel="noopener"`.
- UI copy in Brazilian Portuguese (keep the existing names: Agenda, Planilhas, Apresentações, Formulários, Tarefas, etc.).
- Logos are for private personal use only; do not publish the folder or the logos anywhere.
- Font: system stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`; sizes in `rem`; display text gets negative tracking (`-0.022em` to `-0.028em`), body ≈ `-0.01em`.
- Motion: ease `cubic-bezier(.32,.72,0,1)`; hover/enter ≈ 300 ms; press feedback on `:active` within 100 ms at `scale(.96)`; no overshoot on anything that is not a gesture.
- Accessibility floor: WCAG 2.2 AA. Zero axe violations in light and dark. Every interactive target ≥ 44×44 px. Visible focus ring on every focusable element. Respect `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more`, `prefers-color-scheme`.
- Keep the full app catalog from the current `index.html` (37 apps, 6 categories) and the 8 "Criar novo" shortcuts; Looker Studio's logo source is `data_studio`.
- `localStorage` key stays `gh.favs` so existing favorites survive; all storage access wrapped in try/catch.

## Review Focus

1. **Logo fails to download or is a tiny favicon (e.g. myaccount = 20px)** → tile shows the glyph fallback, never a broken image or a blurry 20px upscale. Pinned in Task 2 (min size 64px) and Task 4 (`onerror` fallback test).
2. **Corrupt or foreign value in `localStorage['gh.favs']`** (invalid JSON, a non-array, unknown ids) → app loads with defaults/valid ids, no blank page. Pinned in Task 3.
3. **Accented / mixed-case / English queries** ("agenda", "AGÊNDA", "calendar", "planilha", "sheets") → same results. Pinned in Task 3.
4. **Closing the palette (Esc, click outside, opening a result)** → focus returns to the element that opened it; background is inert while open. Pinned in Task 5.
5. **Reduced transparency or increased contrast on** → glass becomes solid with contrasting borders and text still passes AA. Pinned in Task 6.

---

## File Structure

```
~/GoogleHub/
  index.html                 # markup shell: landmarks, sidebar, main, palette dialog, script/link tags
  css/tokens.css             # color/material/type/motion tokens, light+dark, a11y media overrides
  css/app.css                # layout + components (sidebar, tiles, chips, palette, toasts)
  js/catalog.js              # GH.catalog: APPS, QUICK, CATEGORIES, GLYPHS (data only)
  js/search.js               # GH.search: normalize(), rank()
  js/favorites.js            # GH.favs: parse(), toggle(), move(), load(), save()
  js/ui.js                   # rendering, roving focus, palette, live region, wiring
  logos/<id>.png             # downloaded logos (gitignored)
  logos/manifest.js          # GH.logos = { id: "logos/id.png", ... } (generated, gitignored)
  scripts/logo-sources.txt   # "<id> <url> [<url>...]" candidate list, first ≥64px wins
  scripts/fetch-logos.sh     # downloads logos, writes manifest
  scripts/build-app.sh       # rebuilds ~/Applications/Google Hub.app
  tests/unit/*.test.js       # node --test
  tests/e2e/*.spec.js        # Playwright WebKit + axe
  package.json, playwright.config.js, .gitignore
```

---

### Task 1: Split into modules, add test harness

**Files:**
- Create: `css/tokens.css`, `css/app.css`, `js/catalog.js`, `js/ui.js`, `package.json`, `playwright.config.js`, `.gitignore`, `tests/unit/catalog.test.js`
- Modify: `index.html` (move inline `<style>`/`<script>` out)

**Interfaces:**
- Produces: `GH.catalog = { APPS, QUICK, CATEGORIES, GLYPHS }` where `APPS: Array<{id, n, d, u, i, c, cat, k?}>` (same fields as today), `CATEGORIES: string[]` in display order, `QUICK: Array<{n, u, c, l}>`, `GLYPHS: Record<string, svgInnerString>`.
- Pattern every `js/*.js` file follows:
  ```js
  (function (root) { const api = {/*...*/};
    root.GH = root.GH || {}; root.GH.<name> = api;
    if (typeof module !== 'undefined') module.exports = api;
  })(typeof window !== 'undefined' ? window : globalThis);
  ```

- [ ] **Step 1:** `cd ~/GoogleHub && git init && git add index.html && git commit -m "chore: baseline single-file dashboard"`
- [ ] **Step 2: Write the failing test** `tests/unit/catalog.test.js`:
  ```js
  const { APPS, QUICK, CATEGORIES, GLYPHS } = require('../../js/catalog.js');
  test('37 apps, unique ids', () => { assert.equal(APPS.length, 37); assert.equal(new Set(APPS.map(a=>a.id)).size, 37); });
  test('every app url is https', () => APPS.forEach(a => assert.match(a.u, /^https:\/\//)));
  test('every app category is listed', () => APPS.forEach(a => assert.ok(CATEGORIES.includes(a.cat), a.id)));
  test('every glyph exists', () => APPS.forEach(a => assert.ok(GLYPHS[a.i], a.id)));
  test('8 quick-create shortcuts', () => assert.equal(QUICK.length, 8));
  ```
- [ ] **Step 3:** Run `node --test tests/unit` → FAIL (module not found).
- [ ] **Step 4:** Move the data from `index.html` into `js/catalog.js` unchanged; move remaining CSS to `css/app.css` (tokens comes in Task 6, create it empty now) and remaining JS to `js/ui.js`. `package.json` scripts: `"test:unit": "node --test tests/unit"`, `"test:e2e": "playwright test"`, devDeps `@playwright/test`, `@axe-core/playwright`. `playwright.config.js`: one project, `use: { ...devices['Desktop Safari'] }`, `testDir: 'tests/e2e'`. `.gitignore`: `node_modules/ logos/ test-results/`.
- [ ] **Step 5:** `node --test tests/unit` → PASS. Open `index.html` in Safari → looks identical to before.
- [ ] **Step 6:** `npm i && npx playwright install webkit`; commit `refactor: split dashboard into css/js modules with test harness`.

---

### Task 2: Download real logos

**Files:**
- Create: `scripts/logo-sources.txt`, `scripts/fetch-logos.sh`, `tests/unit/logos.test.js`

**Interfaces:**
- Consumes: `GH.catalog.APPS[].id`
- Produces: `logos/<id>.png` and `logos/manifest.js` setting `GH.logos = { [id]: "logos/<id>.png" }` (only ids that succeeded).

- [ ] **Step 1: Write the failing test** `tests/unit/logos.test.js` — load `logos/manifest.js` with `vm.runInNewContext` against `{GH:{}}`; assert:
  - every manifest id exists in `APPS`;
  - every manifest file exists and its PNG width (big-endian uint32 at byte offset 16) is `>= 64`;
  - this core set is present: `gmail calendar drive docs sheets slides forms keep tasks meet chat contacts photos maps youtube gemini translate`.
- [ ] **Step 2:** `node --test tests/unit/logos.test.js` → FAIL (no manifest).
- [ ] **Step 3:** Write `scripts/logo-sources.txt`. Base `G=https://www.gstatic.com/images/branding/product/2x`, `F=https://www.google.com/s2/favicons?sz=128&domain=`. Verified-working sources (2026-11-02):
  - `${G}/<n>_2020q4_48dp.png` for: gmail, calendar, drive, docs, sheets, slides, forms, keep, meet, chat, sites
  - `${G}/contacts_2022_48dp.png`
  - `${G}/<n>_48dp.png` for: tasks, photos, maps, translate, play, analytics, one, earth, classroom, news; looker → `data_studio_48dp.png`
  - favicon service (`${F}<domain>`) for: youtube (www.youtube.com), ytmusic (music.youtube.com), gemini, notebooklm, ads, business, search (www.google.com), searchconsole (search.google.com)
  - remaining ids (account, wallet, passwords, scholar, trends, finance): list gstatic `<n>_48dp.png` first, favicon second; it is fine if they fall back to glyphs.
- [ ] **Step 4:** `scripts/fetch-logos.sh`: for each line, try URLs in order with `curl -sfL --max-time 10`, keep the first whose `sips -g pixelWidth` ≥ 64, save as `logos/<id>.png`; print `missing: <ids>` at the end; write `logos/manifest.js`. Idempotent (re-run overwrites).
- [ ] **Step 5:** `bash scripts/fetch-logos.sh && node --test tests/unit` → PASS; note the printed missing list in the commit body.
- [ ] **Step 6:** Commit `feat: fetch Google product logos locally`.

---

### Task 3: Search ranking and favorites logic

**Files:**
- Create: `js/search.js`, `js/favorites.js`, `tests/unit/search.test.js`, `tests/unit/favorites.test.js`

**Interfaces:**
- Produces:
  - `GH.search.normalize(s: string) -> string` (NFD, strip diacritics, lowercase, trim)
  - `GH.search.rank(apps: App[], query: string) -> App[]` — empty query returns `[]`; score: name starts with query 3, any word of name starts with query 2, name/desc/keywords contain query 1; drop 0; stable by score desc then catalog order.
  - `GH.favs.parse(raw: string|null, validIds: string[]) -> string[]` — invalid JSON/non-array → `DEFAULT_FAVS`; filters unknown ids and duplicates.
  - `GH.favs.DEFAULT_FAVS = ['gmail','calendar','drive','docs','sheets','gemini']`
  - `GH.favs.toggle(list, id) -> string[]`, `GH.favs.move(list, id, delta: -1|1) -> string[]` (clamped, pure)
  - `GH.favs.load(storage, validIds) / save(storage, list)` — key `gh.favs`, try/catch, `storage` may be `null`.

- [ ] **Step 1: Write failing tests:**
  ```js
  // search
  rank(APPS,'agenda')[0].id === 'calendar'; rank(APPS,'AGÊNDA')[0].id === 'calendar'; rank(APPS,'calendar')[0].id === 'calendar'
  rank(APPS,'planilha')[0].id === 'sheets'; rank(APPS,'sheets')[0].id === 'sheets'
  rank(APPS,'you').map(a=>a.id).slice(0,2) deepEqual ['youtube','ytmusic']
  rank(APPS,'   ').length === 0; rank(APPS,'zzzz').length === 0
  // favorites
  parse('not json', ids) deepEqual DEFAULT_FAVS; parse('{"a":1}', ids) deepEqual DEFAULT_FAVS
  parse('["gmail","nope","gmail"]', ids) deepEqual ['gmail']
  toggle(['a'],'b') deepEqual ['a','b']; toggle(['a','b'],'a') deepEqual ['b']
  move(['a','b','c'],'a',-1) deepEqual ['a','b','c']; move(['a','b','c'],'a',1) deepEqual ['b','a','c']
  load(null, ids) deepEqual DEFAULT_FAVS; save on a storage whose setItem throws does not throw
  ```
- [ ] **Step 2:** `node --test tests/unit` → FAIL.
- [ ] **Step 3:** Implement both files per Interfaces.
- [ ] **Step 4:** `node --test tests/unit` → PASS.
- [ ] **Step 5:** Commit `feat: ranked accent-insensitive search and safe favorites store`.

---

### Task 4: macOS layout — sidebar, icon tiles, logos

**Files:**
- Modify: `index.html`, `js/ui.js`, `css/app.css`
- Create: `tests/e2e/layout.spec.js`

**Interfaces:**
- Consumes: `GH.catalog`, `GH.logos`, `GH.favs`
- Produces (DOM contract later tasks rely on):
  - `<a class="skip" href="#content">Pular para os apps</a>`; `<nav class="sidebar" aria-label="Seções">` with one link per section (`Favoritos`, `Criar novo`, each category) → `href="#sec-<slug>"`, `aria-current="true"` on the section in view (IntersectionObserver).
  - `<main id="content">` → `<section id="sec-<slug>" aria-labelledby="h-<slug>">` each with `<ul class="grid" role="list">` of `<li>`.
  - Tile: `<a class="tile" data-id="<id>" href target="_blank" rel="noopener" aria-label="Abrir <Nome> em nova aba">` containing `.tile-icon` (`<img alt="" src=logo>` on a white squircle plate, or the glyph tile when no logo / `img.onerror`) and `.tile-label`. Favorite control: `<button class="tile-fav" aria-pressed="true|false" aria-label="Favoritar <Nome>">`, sibling of the link (not nested — a button inside a link is invalid).
  - `GH.ui.render()` re-renders from state; `GH.ui.announce(text)` writes to `<div id="live" aria-live="polite" class="sr-only">`.
- Layout: sidebar 240px fixed on the left (≥ 900px wide), collapses to a horizontal scrolling pill bar under the toolbar below that. Tiles are icon-first like Launchpad: 64px icon, 13px label below, tile 112px wide, grid `repeat(auto-fill, minmax(112px,1fr))`. Hero greeting stays at the top of main.

- [ ] **Step 1: Write failing e2e tests** (`page.goto('file://' + path.resolve('index.html'))`):
  - `tile for gmail renders an <img> whose src ends with logos/gmail.png and naturalWidth > 0`
  - `app with no logo renders the glyph svg` (pick an id missing from `GH.logos` via `page.evaluate`; skip if none)
  - `broken logo falls back`: route `**/logos/drive.png` to 404 → `.tile[data-id=drive] svg` visible, no `img`
  - `every tile link has target=_blank and aria-label starting "Abrir "`
  - `toggling fav moves gmail out of Favoritos and sets aria-pressed=false; reload keeps it`
  - `sidebar link click scrolls section into view and sets aria-current`
- [ ] **Step 2:** `npx playwright test tests/e2e/layout.spec.js` → FAIL.
- [ ] **Step 3:** Implement per Interfaces.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: macOS sidebar layout with real logo tiles`.

---

### Task 5: Spotlight palette and keyboard navigation

**Files:**
- Modify: `index.html`, `js/ui.js`, `css/app.css`
- Create: `tests/e2e/keyboard.spec.js`

**Interfaces:**
- Consumes: `GH.search.rank`, tile DOM contract from Task 4.
- Produces:
  - Toolbar search field becomes a button-looking trigger `#open-palette` ("Buscar apps  ⌘K").
  - `<dialog id="palette" aria-label="Buscar apps">` opened with `showModal()` (gives inert background + Esc for free). Inside: `<input role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant>` and `<ul id="palette-list" role="listbox">` of `role="option"` rows (logo 28px + name + description). Empty query shows the favorites as rows; no match shows "Nenhum app encontrado".
  - Keys: ⌘K or `/` opens; ↑/↓ move active option (wraps); Enter opens active option via `window.open(url,'_blank','noopener')` and closes; Esc / backdrop click closes; focus returns to the opener.
  - Grids use roving tabindex: one tile per grid has `tabindex=0`, ←/→/↑/↓ move by column count (computed from `getComputedStyle(grid).gridTemplateColumns`), Home/End jump; `F` on a focused tile toggles favorite and announces "Gmail adicionado aos favoritos" / "removido dos favoritos"; in Favoritos, ⌥← / ⌥→ call `GH.favs.move` and keep focus on the moved tile.

- [ ] **Step 1: Write failing tests:**
  - `Meta+K opens palette, input focused`; `typing "planilha" → first option is Planilhas, aria-activedescendant points to it`
  - `ArrowDown changes aria-activedescendant; Enter opens a new page with url containing docs.google.com/spreadsheets` (use `context.waitForEvent('page')`)
  - `Escape closes and focus returns to #open-palette`; `clicking backdrop closes`
  - `while open, page.locator('main a').first().focus() does not move focus out of dialog`
  - `Tab into first grid lands on one tile; ArrowRight moves focus to next tile; End goes to last`
  - `F on focused tile toggles aria-pressed and #live text contains "favoritos"`
  - `Alt+ArrowRight in Favoritos swaps order and persists after reload`
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: spotlight palette and full keyboard navigation`.

---

### Task 6: Liquid Glass visual system + accessibility media

**Files:**
- Modify: `css/tokens.css`, `css/app.css`, `index.html` (wallpaper layer)
- Create: `tests/e2e/a11y.spec.js`

**Interfaces:**
- Produces tokens (consumed by every component): `--glass-thin`, `--glass-regular`, `--glass-thick` (backgrounds), `--glass-blur-thin: 20px`, `--glass-blur-regular: 30px`, `--glass-blur-thick: 44px`, `--glass-saturate: 180%`, `--glass-edge` (0.5px hairline), `--glass-specular` (top inner highlight), `--label`, `--label-2`, `--label-3`, `--accent`, `--focus-ring`, `--radius-s 10px / -m 16px / -l 22px`, `--ease`.

Material values:
| Token | Light | Dark |
|---|---|---|
| `--glass-thin` (chips, tile hover) | `rgba(255,255,255,.45)` | `rgba(255,255,255,.06)` |
| `--glass-regular` (toolbar, tiles plate) | `rgba(255,255,255,.58)` | `rgba(40,40,44,.52)` |
| `--glass-thick` (sidebar, palette) | `rgba(246,246,248,.72)` | `rgba(28,28,30,.66)` |
| `--glass-edge` | `rgba(255,255,255,.65)` | `rgba(255,255,255,.12)` |
| `--accent` / focus | `#0071e3` | `#2997ff` |

Rules (from `apple-design` §12, §14, §15):
- Static "wallpaper" behind everything: 3–4 large blurred radial blobs in Google blue/green/yellow/red at low alpha, `position: fixed`, no animation — glass needs something to refract.
- Glass surface recipe: background token + `backdrop-filter: blur(var) saturate(180%)` (+ `-webkit-` prefix) + `box-shadow: inset 0 1px 0 var(--glass-specular), inset 0 0 0 .5px var(--glass-edge), <depth shadow>`; bigger surfaces get thicker blur + deeper shadow. Never put a thin glass directly on another thin glass.
- Toolbar: scroll-edge blur mask, no 1px divider.
- Palette: centered at `top: 18vh`, width `min(640px, 100vw - 32px)`, `--radius-l`, backdrop `rgba(0,0,0,.18)` + 2px blur; enters with opacity 0→1, `scale(.96)→1`, `filter: blur(8px)→0` over 240 ms, origin top-center; exits along the same path.
- Text over glass uses `--label` at weight ≥ 500 for labels.
- `prefers-reduced-transparency: reduce` and `prefers-contrast: more`: glass tokens become opaque (`#fff`/`#1c1c1e`), `backdrop-filter: none`, edge becomes `1px solid var(--label-3)` (contrast) — implement by redefining tokens only, not per-component.
- `prefers-reduced-motion: reduce`: all transforms/blur transitions → 150 ms opacity only.
- Focus ring: `outline: 3px solid var(--focus-ring); outline-offset: 2px` on `:focus-visible`, rounded to the element's radius.

- [ ] **Step 1: Write failing tests** (`a11y.spec.js`, use `AxeBuilder` from `@axe-core/playwright`):
  - `no axe violations (wcag2a, wcag2aa, wcag22aa) in light` and `…in dark` (`page.emulateMedia({colorScheme:'dark'})`)
  - `no axe violations with palette open`
  - `toolbar computed backdrop-filter contains "blur"` by default, and `=== "none"` after setting `document.documentElement.dataset.a11yTest = 'reduced-transparency'`. Playwright can't emulate `prefers-reduced-transparency`, so `tokens.css` applies the same token overrides under both the media query and `:root[data-a11y-test="reduced-transparency"]`.
  - `no axe violations with data-a11y-test="reduced-transparency"` in light and dark (pins Review Focus #5 contrast)
  - `every .tile, .chip, .sidebar a, .tile-fav has bounding box ≥ 44×44`
  - `reduced motion: palette opens with no transform` (`emulateMedia({reducedMotion:'reduce'})`, check computed `transform` is `none` after open)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement tokens + component styles. **Step 4:** Run full suite `npm run test:unit && npm run test:e2e` → PASS.
- [ ] **Step 5:** Manual check in real Safari, light and dark, with System Settings › Accessibility › Display › Reduce transparency on/off; screenshot both themes into `docs/screenshots/`.
- [ ] **Step 6:** Commit `feat: liquid glass material system with accessibility fallbacks`.

---

### Task 7: Rebuild the Mac app wrapper

**Files:**
- Create: `scripts/build-app.sh`
- Modify: `~/Applications/Google Hub.app` (regenerated)

**Interfaces:**
- Consumes: the existing icon `AppIcon.icns` in the current bundle (copy it to `assets/AppIcon.icns` first, then the script reuses it).
- The bundle no longer embeds `index.html` (multi-file now). `Contents/MacOS/GoogleHub` runs `open -a Safari "$HOME/GoogleHub/index.html"` if it exists; otherwise `osascript -e 'display alert "Google Hub" message "Pasta ~/GoogleHub não encontrada."'`. Same `Info.plist` as today (`com.rodrigogarcia.googlehub`, `LSUIElement` true), ad-hoc `codesign --force --deep -s -`.

- [ ] **Step 1:** Run `bash scripts/build-app.sh` → expect it prints the bundle path and `codesign -v ~/Applications/"Google Hub.app"` exits 0.
- [ ] **Step 2:** `open ~/Applications/"Google Hub.app"` → Safari shows the new dashboard with logos.
- [ ] **Step 3:** Commit `chore: build script for the Safari launcher app`.
