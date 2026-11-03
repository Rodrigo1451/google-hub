/* Spotlight-style command palette: ⌘K or / opens; ↑↓ choose; Enter opens; Esc/backdrop closes. */
(function () {
  const ui = GH.ui;
  const dialog = document.getElementById('palette');
  const input = document.getElementById('palette-input');
  const list = document.getElementById('palette-list');
  const hint = document.getElementById('palette-hint');
  let results = [];
  let active = 0;
  let opener = null;

  function paint() {
    list.innerHTML = results.map((a, i) => `
      <li role="option" id="opt-${a.id}" data-i="${i}" aria-selected="${i === active}">
        <span class="opt-icon">${ui.appIcon(a)}</span>
        <span class="opt-text"><span class="opt-name">${ui.esc(a.n)}</span><span class="opt-desc">${ui.esc(a.d)}</span></span>
        <kbd aria-hidden="true">↩</kbd>
      </li>`).join('');
    if (results.length) input.setAttribute('aria-activedescendant', `opt-${results[active].id}`);
    else input.removeAttribute('aria-activedescendant');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  function update() {
    const q = input.value;
    results = q.trim() ? GH.search.rank(GH.catalog.APPS, q) : ui.favs.map(id => ui.byId[id]).filter(Boolean);
    active = 0;
    hint.textContent = q.trim()
      ? (results.length ? '' : 'Nenhum app encontrado')
      : (results.length ? 'Favoritos' : 'Digite o nome de um app');
    paint();
    if (q.trim()) ui.announce(results.length ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}` : 'Nenhum app encontrado');
  }

  function setActive(i) {
    if (!results.length) return;
    active = (i + results.length) % results.length;
    list.querySelectorAll('[role=option]').forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input.setAttribute('aria-activedescendant', `opt-${results[active].id}`);
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  function launch(app) {
    if (!app) return;
    window.open(ui.urlFor(app.u), '_blank', 'noopener');
    close();
  }

  function open() {
    if (isShowing()) return;
    if (pendingClose) { finishClose(); dialog.close(); }
    opener = document.activeElement;
    input.value = '';
    update();
    dialog.showModal();
    input.focus();
  }

  // Exit along the same path it entered (materialize ↔ dematerialize), then really close.
  // A pending close is a single cancellable unit: reopening or finishing detaches both its listener and its timer.
  let pendingClose = null;
  function finishClose() {
    if (!pendingClose) return;
    dialog.removeEventListener('animationend', pendingClose.onEnd);
    clearTimeout(pendingClose.timer);
    pendingClose = null;
    dialog.classList.remove('closing');
  }
  function close() {
    if (!dialog.open || pendingClose) return;
    const anim = getComputedStyle(dialog).animationName;
    if (!anim || anim === 'none') { dialog.close(); return; }
    dialog.classList.add('closing');
    const onEnd = e => {
      if (e.target !== dialog || !/^(dematerialize|fade-out)$/.test(e.animationName)) return;
      finishClose(); dialog.close();
    };
    // Safety net for hidden tabs, where animations never finish.
    const timer = setTimeout(() => { finishClose(); dialog.close(); }, 400);
    pendingClose = { onEnd, timer };
    dialog.addEventListener('animationend', onEnd);
  }
  const isShowing = () => dialog.open && !pendingClose;
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });

  dialog.addEventListener('close', () => {
    if (opener && opener !== document.body && document.contains(opener)) opener.focus();
    opener = null;
  });

  // Clicks on the ::backdrop land on the dialog element itself, outside its box.
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) { close(); return; }
    const opt = e.target.closest('[role=option]');
    if (opt) launch(results[+opt.dataset.i]);
  });
  list.addEventListener('mousemove', e => {
    const opt = e.target.closest('[role=option]');
    if (opt && +opt.dataset.i !== active) setActive(+opt.dataset.i);
  });

  input.addEventListener('input', update);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); launch(results[active]); }
  });

  document.getElementById('open-palette').addEventListener('click', open);
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); isShowing() ? close() : open(); }
    else if (e.key === '/' && !typing && !isShowing()) { e.preventDefault(); open(); }
  });

  GH.palette = { open, close };
})();
