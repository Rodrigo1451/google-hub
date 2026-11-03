const test = require('node:test');
const assert = require('node:assert/strict');
const { APPS } = require('../../js/catalog.js');
const { rank, normalize } = require('../../js/search.js');
const top = q => rank(APPS, q)[0]?.id;

test('normalize strips accents, case and spaces', () => assert.equal(normalize('  AGÊNDA '), 'agenda'));
test('portuguese name finds calendar', () => assert.equal(top('agenda'), 'calendar'));
test('accented uppercase finds calendar', () => assert.equal(top('AGÊNDA'), 'calendar'));
test('english keyword finds calendar', () => assert.equal(top('calendar'), 'calendar'));
test('planilha finds sheets', () => assert.equal(top('planilha'), 'sheets'));
test('sheets finds sheets', () => assert.equal(top('sheets'), 'sheets'));
test('"you" ranks youtube then ytmusic first', () =>
  assert.deepEqual(rank(APPS, 'you').map(a => a.id).slice(0, 2), ['youtube', 'ytmusic']));
test('blank query returns nothing', () => assert.equal(rank(APPS, '   ').length, 0));
test('no match returns nothing', () => assert.equal(rank(APPS, 'zzzz').length, 0));
