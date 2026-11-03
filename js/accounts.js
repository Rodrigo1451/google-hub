/* Which signed-in Google account links open in (Google's ?authuser=N; 0 = the browser's default account). */
(function (root) {
  const KEY = 'gh.account';
  const COUNT = 4;

  function withAccount(url, index) {
    if (!index) return url;
    try {
      const u = new URL(url);
      u.searchParams.set('authuser', String(index));
      return u.toString();
    } catch { return url; }
  }

  function load(storage) {
    try {
      const n = Number(storage ? storage.getItem(KEY) : 0);
      return Number.isInteger(n) && n >= 0 && n < COUNT ? n : 0;
    } catch { return 0; }
  }

  function save(storage, index) {
    try { storage && storage.setItem(KEY, String(index)); } catch { /* storage unavailable */ }
  }

  const api = { KEY, COUNT, withAccount, load, save };
  root.GH = root.GH || {}; root.GH.accounts = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
