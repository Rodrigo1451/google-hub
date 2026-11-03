/* Roving tabindex + arrow-key navigation inside app grids; F favorites; ⌥←/→ reorders favorites. */
(function () {
  const ui = GH.ui;
  const remembered = {}; // grid id -> app id holding the tab stop

  const tilesOf = grid => [...grid.querySelectorAll('.tile')];
  const columns = grid => getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;

  function applyRoving() {
    document.querySelectorAll('[data-grid]').forEach(grid => {
      const tiles = tilesOf(grid);
      const keep = tiles.find(t => t.dataset.id === remembered[grid.dataset.grid]) || tiles[0];
      tiles.forEach(t => t.setAttribute('tabindex', t === keep ? '0' : '-1'));
    });
  }
  ui.afterRender.push(applyRoving);

  function focusTile(grid, tile) {
    tilesOf(grid).forEach(t => t.setAttribute('tabindex', t === tile ? '0' : '-1'));
    remembered[grid.dataset.grid] = tile.dataset.id;
    tile.focus();
  }

  document.addEventListener('focusin', e => {
    const tile = e.target.closest?.('.tile');
    const grid = tile?.closest('[data-grid]');
    if (grid) { remembered[grid.dataset.grid] = tile.dataset.id; tilesOf(grid).forEach(t => t.setAttribute('tabindex', t === tile ? '0' : '-1')); }
  });

  // Space activates tiles and chips like Enter (Finder/Launchpad), instead of scrolling the page.
  document.addEventListener('keydown', e => {
    if (e.key !== ' ' || e.metaKey || e.ctrlKey || e.altKey) return;
    const link = e.target.closest?.('.tile, .chip');
    if (!link) return;
    e.preventDefault();
    link.click();
  });

  document.addEventListener('keydown', e => {
    const tile = e.target.closest?.('.tile');
    const grid = tile?.closest('[data-grid]');
    if (!grid || e.metaKey || e.ctrlKey) return;
    const tiles = tilesOf(grid);
    const i = tiles.indexOf(tile);
    const gid = grid.dataset.grid;
    const id = tile.dataset.id;

    if (e.altKey && gid === 'favoritos' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const delta = e.key === 'ArrowLeft' ? -1 : 1;
      const next = GH.favs.move(ui.favs, id, delta);
      ui.setFavs(next, `[data-grid="favoritos"] .tile[data-id="${id}"]`);
      ui.announce(`${ui.byId[id].n} na posição ${next.indexOf(id) + 1} de ${next.length}`);
      return;
    }
    if (e.altKey) return;

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      const cat = ui.slug(ui.byId[id].cat);
      ui.toggleFav(id, [`[data-grid="${gid}"] .tile[data-id="${id}"]`, `[data-grid="${cat}"] .tile[data-id="${id}"]`]);
      return;
    }

    const cols = columns(grid);
    const target = {
      ArrowRight: i + 1, ArrowLeft: i - 1,
      ArrowDown: i + cols, ArrowUp: i - cols,
      Home: 0, End: tiles.length - 1,
    }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    if (target >= 0 && target < tiles.length) focusTile(grid, tiles[target]);
  });
})();
