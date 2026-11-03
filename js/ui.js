const { APPS, QUICK, GLYPHS } = GH.catalog;
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[k]}</svg>`;
/* ---------- State ---------- */
const store = {
  get() { try { return JSON.parse(localStorage.getItem('gh.favs')) ?? ['gmail','calendar','drive','docs','sheets','gemini']; } catch { return ['gmail','calendar','drive','docs','sheets']; } },
  set(v) { try { localStorage.setItem('gh.favs', JSON.stringify(v)); } catch {} }
};
let favs = store.get();

/* ---------- Render ---------- */
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 3 1.1-6.1-4.5-4.3 6.1-.8z"/></svg>';
const STAR_O = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 3 1.1-6.1-4.5-4.3 6.1-.8z"/></svg>';

const card = (a, i) => {
  const on = favs.includes(a.id);
  return `<a class="app" href="${a.u}" target="_blank" rel="noopener" data-id="${a.id}" data-s="${(a.n+' '+a.d+' '+(a.k||'')).toLowerCase()}" style="--c:${a.c};--i:${i}">
    <span class="icon">${svg(a.i)}</span>
    <span><div class="name">${a.n}</div><div class="desc">${a.d}</div></span>
    <button class="pin ${on?'on':''}" data-pin="${a.id}" aria-label="${on?'Remover dos':'Adicionar aos'} favoritos" title="${on?'Remover dos favoritos':'Fixar nos favoritos'}">${on?STAR:STAR_O}</button>
  </a>`;
};

function render() {
  document.getElementById('quick').innerHTML = QUICK.map((q,i) =>
    `<a class="chip" href="${q.u}" target="_blank" rel="noopener" style="--i:${i}"><i style="background:${q.c}">${q.l}</i>${q.n}</a>`).join('');

  const favApps = favs.map(id => APPS.find(a => a.id === id)).filter(Boolean);
  document.getElementById('fav').innerHTML = favApps.map(card).join('');
  document.getElementById('favSec').classList.toggle('hidden', !favApps.length);

  const cats = [...new Set(APPS.map(a => a.cat))];
  document.getElementById('cats').innerHTML = cats.map(cat => {
    const list = APPS.filter(a => a.cat === cat);
    return `<section data-cat><h2>${cat} <small>${list.length}</small></h2><div class="grid">${list.map(card).join('')}</div></section>`;
  }).join('');
  filter();
}

/* ---------- Search ---------- */
const q = document.getElementById('q');
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function filter() {
  const t = norm(q.value);
  const searching = !!t;
  document.getElementById('quickSec').classList.toggle('hidden', searching);
  document.getElementById('favSec').classList.toggle('hidden', searching || !favs.length);
  let any = 0;
  document.querySelectorAll('#cats section').forEach(sec => {
    let n = 0;
    sec.querySelectorAll('.app').forEach(el => {
      const hit = !t || norm(el.dataset.s).includes(t);
      el.classList.toggle('hidden', !hit); n += hit;
    });
    sec.classList.toggle('hidden', !n); any += n;
  });
  document.getElementById('empty').style.display = any ? 'none' : 'block';
}
q.addEventListener('input', filter);
q.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const first = document.querySelector('#cats .app:not(.hidden)');
    if (first) window.open(first.href, '_blank', 'noopener');
  }
  if (e.key === 'Escape') { q.value = ''; filter(); q.blur(); }
});
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); q.select(); }
  else if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
});

/* ---------- Pin ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pin]');
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const id = b.dataset.pin;
  favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
  store.set(favs);
  render();
});

/* ---------- Greeting ---------- */
const h = new Date().getHours();
document.getElementById('greet').textContent = h < 5 ? 'Boa noite.' : h < 12 ? 'Bom dia.' : h < 18 ? 'Boa tarde.' : 'Boa noite.';
const ds = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
document.getElementById('date').textContent = ds.charAt(0).toUpperCase() + ds.slice(1);

render();
