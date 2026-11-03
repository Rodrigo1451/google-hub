const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../../index.html');
async function open(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  return errors;
}
module.exports = { URL, open };
