const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { APPS } = require('../../js/catalog.js');

const ROOT = path.resolve(__dirname, '../..');
function loadManifest() {
  const ctx = { GH: {} };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'logos/manifest.js'), 'utf8'), ctx);
  return ctx.GH.logos;
}
const pngWidth = file => fs.readFileSync(file).readUInt32BE(16);
const CORE = 'gmail calendar drive docs sheets slides forms keep tasks meet chat contacts photos maps youtube gemini translate'.split(' ');

test('manifest ids all exist in catalog', () => {
  const ids = new Set(APPS.map(a => a.id));
  Object.keys(loadManifest()).forEach(id => assert.ok(ids.has(id), id));
});
test('every manifest logo is a PNG at least 64px wide', () => {
  for (const [id, rel] of Object.entries(loadManifest())) {
    const f = path.join(ROOT, rel);
    assert.ok(fs.existsSync(f), id + ' missing file');
    assert.ok(pngWidth(f) >= 64, `${id} is ${pngWidth(f)}px`);
  }
});
test('core apps all have logos', () => {
  const m = loadManifest();
  CORE.forEach(id => assert.ok(m[id], id));
});
