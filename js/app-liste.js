/* =========================================================
   Application Liste : critiques enregistrées, filtre, Modifier / Supprimer.
   Le bouton Réglages ouvre une popup qui regroupe Export, Reset et Import,
   comme dans la Watchlist d'origine.
   ========================================================= */
(() => {
  'use strict';

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const NO_FILE = '_______________';

  OS.register('liste', {
    title: 'Liste',
    icon: 'liste',
    width: 880,
    height: 680,
    desk: true,
    build(body) {
      body.innerHTML = `
        <div class="wlapp wl-liste">
          <div class="wl-scroll">
            <div class="Scrollcontainer">
              <h1>
                <img class="logo-image" src="image/logo/blogo.png" alt="" width="10%">
                <span class="dela-gothic-text" style="font-size: 50pt;">LISTE</span>
              </h1>
              <div id="banane-form">
                <input type="text" id="banane-input" placeholder="Rechercher dans ta liste…  ( / )" autocomplete="off" spellcheck="false">
                <button class="wl-sb-clear" data-act="clear" type="button" aria-label="Effacer" hidden>${OS.icon('x')}</button>
                <button class="emoji-button" data-act="io-open" title="Export, reset et import">${OS.icon('settings')}</button>
              </div>
              <div class="wl-toolbar">
                <div class="wl-chips wl-sort" aria-label="Tri"></div>
                <div class="wl-chips wl-filter" aria-label="Filtre"></div>
                <div class="wl-chips wl-viewmode" aria-label="Affichage"></div>
              </div>
              <p class="wl-summary"></p>
              <section class="wl-stats" hidden></section>
              <div id="ratings-list"></div>
            </div>
          </div>

          <div class="voilepara" data-act="io-close"></div>
          <div class="homepara">
            <div class="newcontainer">
              <center>
                <button class="emoji-button" data-act="io-close" aria-label="Retour">${OS.icon('arrow')}</button>
                <button class="modern-button" data-act="export">${OS.icon('download')} Export</button>
                <button class="modern-button" data-act="reset" style="background-color: red; color: white;">${OS.icon('trash')} Reset</button>
              </center>
              <center class="wl-backup">
                <button class="wl-ghost" data-act="export-json" type="button">${OS.icon('archive')} Sauvegarde JSON</button>
                <button class="wl-ghost" data-act="covers" type="button">${OS.icon('image')} Récupérer les jaquettes</button>
              </center>
            </div>
            <div id="search-form">
              <span id="file-name">${NO_FILE}</span>
            </div>
            <div class="newcontainer">
              <center>
                <label class="modern-button file-label">${OS.icon('folder')}<input type="file" accept=".txt,.json" hidden></label>
                <button class="modern-button" data-act="import">${OS.icon('check')} Save</button>
              </center>
            </div>
          </div>
        </div>`;

      const root = body.querySelector('.wl-liste');
      const q = (sel) => root.querySelector(sel);
      const cards = q('#ratings-list');
      const filter = q('#banane-input');
      const popup = q('.homepara');
      const shade = q('.voilepara');
      const fileInput = q('input[type="file"]');
      const fileName = q('#file-name');

      function setPopup(open) {
        popup.classList.toggle('show', open);
        shade.classList.toggle('show', open);
      }

      /* ----- Cartes ----- */
      function ratingCard(name, d) {
        const card = el('article', 'rating-entry');
        card.className += ' wl-item';
        card.dataset.name = OS.wl.norm([name, d.note, d.comment, d.stage].filter(Boolean).join(' '));

        const content = el('div', 'rating-content');

        const header = el('div', 'rating-header');
        const logo = el('button', 'wl-card-jacket');
        logo.type = 'button';
        logo.title = 'Changer la jaquette';
        logo.appendChild(OS.covers.jacket(name, 'sm'));
        logo.addEventListener('click', () => OS.covers.editor(name));
        const title = el('strong', 'anime-title', name);
        title.style.fontSize = '13pt';
        const fav = el('button', 'wl-fav wl-fav-sm' + (d.fav ? ' on' : ''));
        fav.type = 'button';
        fav.title = d.fav ? 'Retirer des favoris' : 'Ajouter aux favoris';
        fav.innerHTML = OS.icon('heart');
        fav.addEventListener('click', () => OS.wl.toggleFav(name));
        header.append(logo, title, fav);

        const details = el('div', 'rating-details');
        const starRow = el('div', 'wl-card-stars');
        starRow.setAttribute('aria-label', d.rating == null ? 'Pas de note' : `${d.rating} sur 5`);
        for (let i = 1; i <= 5; i++) {
          const st = el('span', 'wl-cstar' + (d.rating >= i ? ' on' : ''));
          st.innerHTML = OS.icon('rating');
          starRow.appendChild(st);
        }
        details.appendChild(starRow);
        const badges = el('div', 'wl-badges');
        if (d.comment) badges.appendChild(el('span', 'wl-badge', d.comment));
        if (d.stage && d.stage !== OS.wl.NONE) badges.appendChild(el('span', 'wl-badge alt', d.stage));
        if (badges.children.length) details.appendChild(badges);
        if (d.note) details.appendChild(el('p', 'wl-card-note', `« ${d.note} »`));

        const footer = el('div', 'rating-footer');
        const edit = el('button', 'modern-button', 'Modifier');
        const del = el('button', 'delete-button', 'Supprimer');
        edit.addEventListener('click', () => OS.openApp('rating', name));
        del.addEventListener('click', () => {
          const old = OS.wl.deleteReview(name);
          OS.undoToast(`« ${name} » supprimé`, () => OS.wl.restoreReview(name, old));
        });
        footer.append(edit, del);

        content.append(header, details, footer);
        card.appendChild(content);
        return card;
      }

      /* ----- Affiche (grille de jaquettes) ----- */
      function posterTile(name, d) {
        const t = el('article', 'wl-tile wl-item');
        t.dataset.name = OS.wl.norm([name, d.note, d.comment, d.stage].filter(Boolean).join(' '));
        t.tabIndex = 0;
        t.setAttribute('role', 'button');
        t.setAttribute('aria-label', `${name}, modifier la critique`);
        t.appendChild(OS.covers.jacket(name, 'fill'));
        const shade = el('div', 'wl-tile-shade');
        const top = el('div', 'wl-tile-top');
        if (d.stage && d.stage !== OS.wl.NONE) top.appendChild(el('span', 'wl-badge', d.stage));
        const fav = el('button', 'wl-fav wl-fav-sm' + (d.fav ? ' on' : ''));
        fav.type = 'button';
        fav.title = d.fav ? 'Retirer des favoris' : 'Ajouter aux favoris';
        fav.innerHTML = OS.icon('heart');
        fav.addEventListener('click', (e) => { e.stopPropagation(); OS.wl.toggleFav(name); });
        top.appendChild(fav);
        const bottom = el('div', 'wl-tile-bottom');
        bottom.appendChild(el('strong', 'wl-tile-title', name));
        const stars = el('div', 'wl-card-stars');
        stars.setAttribute('aria-label', d.rating == null ? 'Pas de note' : `${d.rating} sur 5`);
        for (let i = 1; i <= 5; i++) {
          const st = el('span', 'wl-cstar' + (d.rating >= i ? ' on' : ''));
          st.innerHTML = OS.icon('rating');
          stars.appendChild(st);
        }
        bottom.appendChild(stars);
        if (d.comment) bottom.appendChild(el('span', 'wl-tile-verdict', d.comment));
        const acts = el('div', 'wl-tile-acts');
        const cam = el('button', 'wl-tile-btn');
        cam.type = 'button'; cam.title = 'Changer la jaquette'; cam.innerHTML = OS.icon('image');
        cam.addEventListener('click', (e) => { e.stopPropagation(); OS.covers.editor(name); });
        const del = el('button', 'wl-tile-btn danger');
        del.type = 'button'; del.title = 'Supprimer'; del.innerHTML = OS.icon('trash');
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          const old = OS.wl.deleteReview(name);
          OS.undoToast(`« ${name} » supprimé`, () => OS.wl.restoreReview(name, old));
        });
        acts.append(cam, del);
        t.append(shade, top, bottom, acts);
        if (d.note) t.title = `« ${d.note} »`;
        const edit = () => OS.openApp('rating', name);
        t.addEventListener('click', edit);
        t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); edit(); } });
        return t;
      }

      /* ----- Statistiques ----- */
      const stats = q('.wl-stats');
      function renderStats() {
        const names = OS.wl.ratedNames();
        const rated = names.filter((n) => OS.wl.review(n).rating != null);
        const mean = rated.length ? rated.reduce((a, n) => a + OS.wl.review(n).rating, 0) / rated.length : null;
        const dist = [5, 4, 3, 2, 1].map((v) => [v, rated.filter((n) => OS.wl.review(n).rating === v).length]);
        const max = Math.max(1, ...dist.map((x) => x[1]));
        const favs = names.filter((n) => OS.wl.review(n).fav).length;
        stats.innerHTML = '';
        const big = el('div', 'wl-st-big');
        big.append(el('b', '', mean == null ? '—' : mean.toFixed(1)), el('small', '', `moyenne · ${names.length} titre${names.length > 1 ? 's' : ''} · ${favs} favori${favs > 1 ? 's' : ''}`));
        const bars = el('div', 'wl-st-bars');
        dist.forEach(([v, c]) => {
          const r = el('div', 'wl-st-row');
          const bar = el('i');
          bar.style.setProperty('--w', `${(c / max) * 100}%`);
          r.append(el('span', '', `${v}★`), el('em', '', ''), el('b', '', String(c)));
          r.children[1].appendChild(bar);
          bars.appendChild(r);
        });
        stats.append(big, bars);
      }

      const view = { sort: 'recent', filter: 'all', mode: OS.load('wl-liste-mode2', 'posters'), stats: OS.load('wl-liste-stats', false) };
      const MODES = [['posters', 'Affiches'], ['cards', 'Cartes'], ['compact', 'Compact']];
      const SORTS = [['recent', 'Récents'], ['rating', 'Note'], ['az', 'A–Z']];
      const FILTERS = [['all', 'Tous'], ['fav', 'Favoris'], ...OS.wl.STAGES.map((st) => [st, st])];

      function chipRow(box, items, key) {
        items.forEach(([v, label]) => {
          const b = el('button', 'wl-chip', label);
          b.type = 'button';
          b.dataset.v = v;
          b.addEventListener('click', () => { view[key] = v; paintChips(); renderCards(); });
          box.appendChild(b);
        });
      }
      function paintChips() {
        [['.wl-sort', 'sort'], ['.wl-filter', 'filter'], ['.wl-viewmode', 'mode']].forEach(([sel, key]) => {
          q(sel).querySelectorAll('.wl-chip').forEach((b) => b.classList.toggle('on', b.dataset.v === view[key]));
        });
        cards.classList.toggle('wl-compact', view.mode === 'compact');
        cards.classList.toggle('wl-posters', view.mode === 'posters');
        statsBtn.classList.toggle('on', view.stats);
        stats.hidden = !view.stats;
      }
      chipRow(q('.wl-sort'), SORTS, 'sort');
      chipRow(q('.wl-filter'), FILTERS, 'filter');
      MODES.forEach(([v, label]) => {
        const b = el('button', 'wl-chip', label);
        b.type = 'button';
        b.dataset.v = v;
        b.addEventListener('click', () => { view.mode = v; OS.store('wl-liste-mode2', v); paintChips(); renderCards(); });
        q('.wl-viewmode').appendChild(b);
      });
      const statsBtn = el('button', 'wl-chip', 'Stats');
      statsBtn.type = 'button';
      statsBtn.addEventListener('click', () => { view.stats = !view.stats; OS.store('wl-liste-stats', view.stats); paintChips(); });
      q('.wl-viewmode').appendChild(statsBtn);
      paintChips();

      const clearBtn = q('[data-act="clear"]');
      function applyFilter() {
        const words = OS.wl.norm(filter.value).split(' ').filter(Boolean);
        clearBtn.hidden = !filter.value;
        let shown = 0;
        cards.querySelectorAll('.wl-item').forEach((c) => {
          c.hidden = !words.every((w) => c.dataset.name.includes(w));
          if (!c.hidden) shown++;
        });
        const total = cards.querySelectorAll('.wl-item').length;
        q('.wl-summary').textContent = total ? `${shown} / ${total} critique${total > 1 ? 's' : ''}` : '';
        const old = cards.querySelector('.wl-nomatch');
        if (old) old.remove();
        if (total && !shown) cards.appendChild(el('p', 'wl-empty wl-nomatch', `Aucun résultat pour « ${filter.value.trim()} ».`));
      }

      function renderCards() {
        cards.innerHTML = '';
        let names = OS.wl.ratedNames();
        const all = names.length;
        if (view.filter === 'fav') names = names.filter((n) => OS.wl.review(n).fav);
        else if (view.filter !== 'all') names = names.filter((n) => OS.wl.review(n).stage === view.filter);
        const idx = new Map(names.map((n, i) => [n, i]));
        names.sort((a, b) => {
          const A = OS.wl.review(a), B = OS.wl.review(b);
          if (view.sort === 'az') return a.localeCompare(b, 'fr', { sensitivity: 'base' });
          if (view.sort === 'rating') return (B.rating || 0) - (A.rating || 0) || a.localeCompare(b, 'fr');
          return (B.ts || 0) - (A.ts || 0) || idx.get(b) - idx.get(a);
        });
        if (!names.length) {
          cards.appendChild(el('p', 'wl-empty', all ? 'Aucune critique ne correspond à ce filtre.' : 'Aucune critique pour le moment.'));
        }
        names.forEach((n) => cards.appendChild(view.mode === 'posters' ? posterTile(n, OS.wl.review(n)) : ratingCard(n, OS.wl.review(n))));
        renderStats();
        applyFilter();
      }

      filter.addEventListener('input', applyFilter);
      filter.addEventListener('keydown', (e) => { if (e.key === 'Escape' && filter.value) { e.stopPropagation(); filter.value = ''; applyFilter(); } });
      clearBtn.addEventListener('click', () => { filter.value = ''; applyFilter(); filter.focus(); });
      root.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !(e.target.matches && e.target.matches('input, textarea'))) { e.preventDefault(); filter.focus(); }
      });

      /* ----- Popup Réglages : Export, Reset, Import ----- */
      q('[data-act="io-open"]').addEventListener('click', () => setPopup(true));
      root.querySelectorAll('[data-act="io-close"]').forEach((b) => b.addEventListener('click', () => setPopup(false)));

      q('[data-act="export"]').addEventListener('click', () => OS.wl.exportFile());
      q('[data-act="export-json"]').addEventListener('click', () => OS.wl.exportJSON());

      // Cherche en ligne la jaquette de tous les titres (critiques + À voir) qui n'en ont pas encore
      const coversBtn = q('[data-act="covers"]');
      let fetching = false;
      coversBtn.addEventListener('click', async () => {
        if (fetching) return;
        const names = [...OS.wl.ratedNames(), ...OS.wl.todo().map((t) => t.name)];
        fetching = true;
        const label = coversBtn.innerHTML;
        try {
          const r = await OS.covers.fetchAll(names, (i, n, f) => { coversBtn.textContent = `Jaquettes… ${i}/${n}`; });
          OS.showNotification(r.total ? `${r.found} jaquette(s) trouvée(s) sur ${r.total}.` : 'Tous les titres ont déjà une jaquette.', !r.found && r.total > 0);
        } catch (e) {
          OS.showNotification('Impossible de joindre les services d’images.', true);
        }
        coversBtn.innerHTML = label;
        fetching = false;
      });

      q('[data-act="reset"]').addEventListener('click', () => {
        OS.confirm('Supprimer toutes les critiques ? Cette action est irréversible.', () => {
          OS.wl.clearReviews();
          setPopup(false);
          OS.showNotification('Toutes les critiques ont été supprimées.', true);
        });
      });

      fileInput.addEventListener('change', () => {
        fileName.textContent = fileInput.files[0] ? fileInput.files[0].name : NO_FILE;
      });

      q('[data-act="import"]').addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) return OS.showNotification('Aucun fichier sélectionné.', true);
        const reader = new FileReader();
        reader.onload = (e) => {
          let count = 0;
          try {
            count = /\.json$/i.test(file.name) ? OS.wl.importJSON(String(e.target.result)) : OS.wl.importText(String(e.target.result));
          } catch (err) {
            return OS.showNotification('Fichier illisible ou invalide.', true);
          }
          fileInput.value = '';
          fileName.textContent = NO_FILE;
          setPopup(false);
          OS.showNotification(`${count} critique(s) importée(s) !`);
        };
        reader.readAsText(file);
      });

      const unsubscribe = OS.wl.subscribe(renderCards);
      renderCards();

      return { onClose: unsubscribe };
    },
  });
})();
