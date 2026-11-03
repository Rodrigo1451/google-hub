const test = require('node:test');
const assert = require('node:assert/strict');
const { APPS } = require('../../js/catalog.js');
const F = require('../../js/favorites.js');
const ids = APPS.map(a => a.id);
const mem = (init = {}) => ({ d: { ...init }, getItem(k) { return k in this.d ? this.d[k] : null; }, setItem(k, v) { this.d[k] = String(v); } });

test('invalid JSON falls back to defaults', () => assert.deepEqual(F.parse('not json', ids), F.DEFAULT_FAVS));
test('non-array falls back to defaults', () => assert.deepEqual(F.parse('{"a":1}', ids), F.DEFAULT_FAVS));
test('null falls back to defaults', () => assert.deepEqual(F.parse(null, ids), F.DEFAULT_FAVS));
test('empty array is kept (user removed all)', () => assert.deepEqual(F.parse('[]', ids), []));
test('unknown ids and duplicates are dropped', () => assert.deepEqual(F.parse('["gmail","nope","gmail"]', ids), ['gmail']));
test('toggle adds', () => assert.deepEqual(F.toggle(['a'], 'b'), ['a', 'b']));
test('toggle removes', () => assert.deepEqual(F.toggle(['a', 'b'], 'a'), ['b']));
test('move clamps at start', () => assert.deepEqual(F.move(['a', 'b', 'c'], 'a', -1), ['a', 'b', 'c']));
test('move right swaps', () => assert.deepEqual(F.move(['a', 'b', 'c'], 'a', 1), ['b', 'a', 'c']));
test('move does not mutate input', () => { const l = ['a', 'b']; F.move(l, 'a', 1); assert.deepEqual(l, ['a', 'b']); });
test('load with null storage gives defaults', () => assert.deepEqual(F.load(null, ids), F.DEFAULT_FAVS));
test('save then load round-trips under gh.favs', () => {
  const s = mem(); F.save(s, ['drive', 'gmail']);
  assert.equal(s.d['gh.favs'], '["drive","gmail"]');
  assert.deepEqual(F.load(s, ids), ['drive', 'gmail']);
});
test('save on a throwing storage does not throw', () =>
  assert.doesNotThrow(() => F.save({ setItem() { throw new Error('quota'); } }, ['a'])));
test('load on a throwing storage gives defaults', () =>
  assert.deepEqual(F.load({ getItem() { throw new Error('denied'); } }, ids), F.DEFAULT_FAVS));
