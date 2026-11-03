(function (root) {
  const normalize = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // 3 = name starts with query, 2 = a word of the name starts with it, 1 = contained anywhere
  function score(app, q) {
    const name = normalize(app.n);
    if (name.startsWith(q)) return 3;
    if (name.split(/\s+/).some(w => w.startsWith(q))) return 2;
    const hay = normalize(`${app.n} ${app.d} ${app.k || ''}`);
    return hay.includes(q) ? 1 : 0;
  }

  function rank(apps, query) {
    const q = normalize(query);
    if (!q) return [];
    return apps
      .map((app, i) => ({ app, i, s: score(app, q) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map(r => r.app);
  }

  const api = { normalize, rank };
  root.GH = root.GH || {}; root.GH.search = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
