(function () {
  const { APPS, QUICK, CATEGORIES, GLYPHS } = GH.catalog;
  const LOGOS = GH.logos || {};
  const $ = s => document.querySelector(s);
  const byId = Object.fromEntries(APPS.map(a => [a.id, a]));
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- state ---------- */
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  let favs = GH.favs.load(storage, APPS.map(a => a.id));

  /* ---------- icons ---------- */
  const glyph = (k, cls = '') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[k] || GLYPHS.globe}</svg>`;
  const STAR_PATH = 'm12 3.2 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 3 1.1-6.1-4.5-4.3 6.1-.8z';
  const star = on => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="${STAR_PATH}"/></svg>`;

  const glyphPlate = app => `<span class="glyph-plate" style="--c:${app.c}">${glyph(app.i)}</span>`;
  function appIcon(app) {
    const src = LOGOS[app.id];
    return src
      ? `<span class="logo-plate"><img src="${src}" alt="" data-glyph="${app.id}" decoding="async"></span>`
      : glyphPlate(app);
  }
  // A logo that fails to load is swapped for the glyph tile (error does not bubble; capture it).
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.dataset.glyph) return;
    const app = byId[img.dataset.glyph];
    img.closest('.logo-plate').outerHTML = glyphPlate(app);
  }, true);

  /* ---------- sections ---------- */
  const slug = s => GH.search.normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const SECTION_ICON = { 'Trabalho': 'drive', 'Comunicação': 'chat', 'IA & Pesquisa': 'spark', 'Mídia & Lugares': 'play', 'Negócios & Marketing': 'chart', 'Conta': 'person' };
  const sections = () => [
    { id: 'favoritos', title: 'Favoritos', icon: 'star' },
    { id: 'criar', title: 'Criar novo', icon: 'plus' },
    ...CATEGORIES.map(c => ({ id: slug(c), title: c, icon: SECTION_ICON[c], cat: c })),
  ];

  const tile = app => {
    const on = favs.includes(app.id);
    return `<li class="cell">
      <a class="tile" tabindex="0" data-id="${app.id}" href="${esc(app.u)}" target="_blank" rel="noopener" aria-label="Abrir ${esc(app.n)} em nova aba" title="${esc(app.d)}">
        <span class="tile-icon">${appIcon(app)}</span>
        <span class="tile-label">${esc(app.n)}</span>
      </a>
      <button class="tile-fav" type="button" tabindex="-1" data-fav="${app.id}" aria-pressed="${on}" aria-label="Favoritar ${esc(app.n)}" title="${on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${star(on)}</button>
    </li>`;
  };

  const chip = q => `<li><a class="chip" tabindex="0" href="${esc(q.u)}" target="_blank" rel="noopener" aria-label="${esc(q.n)} — criar novo em nova aba">
      <span class="chip-icon" style="--c:${q.c}" data-l="${esc(q.l)}" aria-hidden="true"></span>${esc(q.n)}</a></li>`;

  function sectionBody(s) {
    if (s.id === 'favoritos') {
      const list = favs.map(id => byId[id]).filter(Boolean);
      return list.length
        ? `<ul class="grid" role="list" data-grid="favoritos">${list.map(tile).join('')}</ul>`
        : `<p class="empty">Toque na estrela de um app (ou pressione F) para fixá-lo aqui.</p>`;
    }
    if (s.id === 'criar') return `<ul class="chips" role="list">${QUICK.map(chip).join('')}</ul>`;
    return `<ul class="grid" role="list" data-grid="${s.id}">${APPS.filter(a => a.cat === s.cat).map(tile).join('')}</ul>`;
  }

  function render() {
    $('#sections').innerHTML = sections().map(s => `
      <section id="sec-${s.id}" class="section" aria-labelledby="h-${s.id}">
        <h2 id="h-${s.id}">${esc(s.title)}</h2>
        ${sectionBody(s)}
      </section>`).join('');
    GH.ui.afterRender.forEach(fn => fn());
  }

  function renderNav() {
    const icons = { star: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="${STAR_PATH}"/></svg>`,
                    plus: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>` };
    $('#nav').innerHTML = sections().map(s =>
      `<li><a tabindex="0" href="#sec-${s.id}" data-nav="${s.id}">${icons[s.icon] || glyph(s.icon)}<span>${esc(s.title)}</span></a></li>`).join('');
  }

  /* ---------- live region ---------- */
  function announce(text) {
    const live = $('#live');
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = text; });
  }

  /* ---------- favorites ---------- */
  function setFavs(next, focusSel) {
    favs = next;
    GH.favs.save(storage, favs);
    render();
    // focusSel: selector or ordered list of selectors — the first one that matches gets focus
    for (const sel of [].concat(focusSel || [])) {
      const el = document.querySelector(sel);
      if (el) { el.focus(); break; }
    }
  }
  function toggleFav(id, focusSel) {
    const adding = !favs.includes(id);
    setFavs(GH.favs.toggle(favs, id), focusSel);
    announce(`${byId[id].n} ${adding ? 'adicionado aos' : 'removido dos'} favoritos`);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.tile-fav');
    if (!b) return;
    const sec = b.closest('section').id;
    const id = b.dataset.fav;
    // keep focus on the same control; if it left Favoritos, fall back to its category copy
    toggleFav(id, [`#${sec} .tile-fav[data-fav="${id}"]`, `#sec-${slug(byId[id].cat)} .tile-fav[data-fav="${id}"]`]);
  });

  /* ---------- sidebar scroll-spy ---------- */
  let lockUntilUserScroll = false;
  function setCurrent(id) {
    document.querySelectorAll('#nav a').forEach(a => {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  function spy() {
    if (lockUntilUserScroll) return;
    const secs = [...document.querySelectorAll('.section')];
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= 140) cur = s;
    if (atBottom) cur = secs[secs.length - 1];
    if (cur) setCurrent(cur.id.slice(4));
  }
  let spyQueued = false;
  addEventListener('scroll', () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(() => { spyQueued = false; spy(); }); } }, { passive: true });
  ['wheel', 'touchmove', 'keydown'].forEach(t => addEventListener(t, () => { lockUntilUserScroll = false; }, { passive: true }));
  document.addEventListener('click', e => {
    const a = e.target.closest('#nav a');
    if (!a) return;
    e.preventDefault();
    const target = document.getElementById('sec-' + a.dataset.nav);
    lockUntilUserScroll = true;
    setCurrent(a.dataset.nav);
    target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#sec-' + a.dataset.nav);
  });

  /* ---------- greeting ---------- */
  function greet() {
    const h = new Date().getHours();
    $('#greet').textContent = h < 5 ? 'Boa noite.' : h < 12 ? 'Bom dia.' : h < 18 ? 'Boa tarde.' : 'Boa noite.';
    const ds = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#date').textContent = ds.charAt(0).toUpperCase() + ds.slice(1);
  }

  /* ---------- public ---------- */
  window.GH.ui = {
    afterRender: [],
    render, announce, toggleFav, setFavs, appIcon, slug, esc,
    get favs() { return favs; },
    byId,
  };

  document.addEventListener('DOMContentLoaded', () => {
    greet(); renderNav(); render(); spy();
    document.dispatchEvent(new CustomEvent('gh:ready'));
  });
})();
