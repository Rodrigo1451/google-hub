const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../../js/accounts.js');
const mem = () => ({ d: {}, getItem(k) { return k in this.d ? this.d[k] : null; }, setItem(k, v) { this.d[k] = String(v); } });

test('account 0 (default) leaves the url untouched', () =>
  assert.equal(A.withAccount('https://mail.google.com/', 0), 'https://mail.google.com/'));
test('account 1 adds authuser=1', () =>
  assert.equal(A.withAccount('https://mail.google.com/', 1), 'https://mail.google.com/?authuser=1'));
test('existing query and hash are preserved', () =>
  assert.equal(A.withAccount('https://mail.google.com/mail/?view=cm#x', 2), 'https://mail.google.com/mail/?view=cm&authuser=2#x'));
test('an existing authuser is replaced, not duplicated', () =>
  assert.equal(A.withAccount('https://x.google.com/?authuser=3', 1), 'https://x.google.com/?authuser=1'));
test('invalid urls are returned unchanged', () => assert.equal(A.withAccount('not a url', 1), 'not a url'));
test('load defaults to 0 and clamps garbage', () => {
  const s = mem();
  assert.equal(A.load(s), 0);
  s.setItem('gh.account', '7'); assert.equal(A.load(s), 0);
  s.setItem('gh.account', 'abc'); assert.equal(A.load(s), 0);
  s.setItem('gh.account', '2'); assert.equal(A.load(s), 2);
});
test('save round-trips and survives a throwing storage', () => {
  const s = mem(); A.save(s, 3); assert.equal(A.load(s), 3);
  assert.doesNotThrow(() => A.save({ setItem() { throw new Error('quota'); } }, 1));
  assert.equal(A.load(null), 0);
});
test('there are 4 account slots', () => assert.equal(A.COUNT, 4));
