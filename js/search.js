(function (root) {
  const normalize = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // Per word: 3 = name starts with it, 2 = a word of the name starts with it, 1 = contained anywhere.
  function wordScore(app, w) {
    const name = normalize(app.n);
    if (name.startsWith(w)) return 3;
    if (name.split(/\s+/).some(x => x.startsWith(w))) return 2;
    return normalize(`${app.n} ${app.d} ${app.k || ''}`).includes(w) ? 1 : 0;
  }

  // Every word must match somewhere; the whole query as a name prefix ranks highest.
  function score(app, q) {
    if (normalize(app.n).startsWith(q)) return 100;
    let total = 0;
    for (const w of q.split(/\s+/)) {
      const s = wordScore(app, w);
      if (!s) return 0;
      total += s;
    }
    return total;
  }

  function rank(apps, query) {
    const q = normalize(query).replace(/\s+/g, ' ');
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
