(function (root) {
  const KEY = 'gh.favs';
  const DEFAULT_FAVS = ['gmail', 'calendar', 'drive', 'docs', 'sheets', 'gemini'];

  function parse(raw, validIds) {
    let list;
    try { list = JSON.parse(raw); } catch { return [...DEFAULT_FAVS]; }
    if (!Array.isArray(list)) return [...DEFAULT_FAVS];
    const valid = new Set(validIds);
    return [...new Set(list)].filter(id => valid.has(id));
  }

  const toggle = (list, id) => list.includes(id) ? list.filter(x => x !== id) : [...list, id];

  function move(list, id, delta) {
    const from = list.indexOf(id);
    const to = Math.max(0, Math.min(list.length - 1, from + delta));
    if (from < 0 || from === to) return [...list];
    const next = [...list];
    next.splice(from, 1);
    next.splice(to, 0, id);
    return next;
  }

  function load(storage, validIds) {
    try { return parse(storage ? storage.getItem(KEY) : null, validIds); }
    catch { return [...DEFAULT_FAVS]; }
  }

  function save(storage, list) {
    try { storage && storage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  }

  const api = { KEY, DEFAULT_FAVS, parse, toggle, move, load, save };
  root.GH = root.GH || {}; root.GH.favs = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
