const test = require('node:test');
const assert = require('node:assert/strict');
const { APPS, QUICK, CATEGORIES, GLYPHS } = require('../../js/catalog.js');

test('37 apps, unique ids', () => {
  assert.equal(APPS.length, 37);
  assert.equal(new Set(APPS.map(a => a.id)).size, 37);
});
test('every app url is https', () => APPS.forEach(a => assert.match(a.u, /^https:\/\//, a.id)));
test('every app category is listed', () => APPS.forEach(a => assert.ok(CATEGORIES.includes(a.cat), a.id)));
test('every glyph exists', () => APPS.forEach(a => assert.ok(GLYPHS[a.i], a.id)));
test('8 quick-create shortcuts', () => assert.equal(QUICK.length, 8));
