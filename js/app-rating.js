/* =========================================================
   Application Rating : formulaire d'une critique.
   Plus aucun menu natif du navigateur : étoiles cliquables,
   pastilles pour l'avis et le visionnage, favori, notes perso,
   autocomplétion au clavier.
   ========================================================= */
(() => {
  'use strict';

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const MOODS = ['', 'Bof…', 'Moyen', 'Bien', 'Très bien', 'Chef-d\'œuvre'];

  OS.register('rating', {
    title: 'Rating',
    icon: 'rating',
    width: 640,
    height: 640,
    desk: true,
    build(body) {
      body.innerHTML = `
        <div class="wlapp wl-rating">
          <div class="wl-scroll">
            <div class="container wl-rating-box">
              <h1>
                <img class="logo-image" src="image/logo/blogo.png" alt="" width="11%">
                <span class="dela-gothic-text" style="font-size: 40pt;">RATING</span>
              </h1>
              <div id="search-form">
                <input type="text" id="search-input" placeholder="Rechercher un anime…  ( / )" autocomplete="off">
              </div>
              <div class="wl-status" hidden></div>
              <div class="wl-recents" hidden></div>
              <div class="newcontainer wl-form">
                <div class="wl-field">
                  <span class="wl-label">Note</span>
                  <div class="wl-stars" role="radiogroup" aria-label="Note sur 5"></div>
                  <span class="wl-mood"></span>
                  <button type="button" class="wl-fav" aria-pressed="false" title="Favori">${OS.icon('heart')}</button>
                </div>
                <div class="wl-field">
                  <span class="wl-label">Avis</span>
                  <div class="wl-chips" data-f="judgment"></div>
                </div>
                <div class="wl-field">
                  <span class="wl-label">Visionnage</span>
                  <div class="wl-chips" data-f="stage"></div>
                </div>
                <div class="wl-field wl-field-col">
                  <span class="wl-label">Notes perso <small class="wl-count">0/200</small></span>
                  <textarea class="wl-note" rows="2" maxlength="200" placeholder="Un mot sur l'anime, l'épisode préféré…"></textarea>
                </div>
                <center class="wl-actions">
                  <button id="submit-button" data-act="save"><span class="dela-gothic-text">Enregistrer</span></button>
                  <button class="wl-ghost" data-act="reset" type="button">Vider</button>
                </center>
                <p class="wl-keys"><kbd>1</kbd>–<kbd>5</kbd> note · <kbd>0</kbd> effacer · <kbd>F</kbd> favori · <kbd>Ctrl</kbd>+<kbd>Entrée</kbd> enregistrer</p>
              </div>
            </div>
          </div>
        </div>`;

      const root = body.querySelector('.wl-rating');
      const q = (sel) => root.querySelector(sel);
      const search = q('#search-input');
      const starsBox = q('.wl-stars');
      const mood = q('.wl-mood');
      const favBtn = q('.wl-fav');
      const note = q('.wl-note');
      const count = q('.wl-count');
      const status = q('.wl-status');
      const recents = q('.wl-recents');

      const state = { rating: null, judgment: null, stage: null, fav: false };
      const touched = { judgment: false, stage: false }; // l'utilisateur a choisi lui-même
      const AUTO_JUDGMENT = [null, 'Bad💩', 'Bad💩', 'Mid🫠', 'Bon👍', 'Goated🐐'];
      let current = null; // titre choisi dans la liste
      let active = -1;    // suggestion surlignée au clavier

      /* ----- Étoiles ----- */
      const stars = [1, 2, 3, 4, 5].map((n) => {
        const b = el('button', 'wl-star');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-label', `${n} sur 5`);
        b.innerHTML = OS.icon('rating');
        b.addEventListener('mouseenter', () => paintStars(n));
        b.addEventListener('focus', () => paintStars(n));
        b.addEventListener('click', () => {
          setRating(state.rating === n ? null : n); // re-cliquer efface
        });
        starsBox.appendChild(b);
        return b;
      });
      starsBox.addEventListener('mouseleave', () => paintStars());
      starsBox.addEventListener('focusout', () => paintStars());

      function setRating(n) {
        state.rating = n;
        if (n != null) {
          if (!touched.judgment) state.judgment = AUTO_JUDGMENT[n];
          if (!touched.stage && !state.stage) state.stage = OS.wl.STAGES.find((x) => x.startsWith('Vu')) || null;
        }
        paintStars();
        paintChips();
      }

      function paintStars(preview) {
        const v = preview || state.rating || 0;
        stars.forEach((b, i) => {
          b.classList.toggle('on', i < v);
          b.setAttribute('aria-checked', String(state.rating === i + 1));
        });
        mood.textContent = MOODS[v] || '';
      }

      /* ----- Pastilles ----- */
      function buildChips(field, values) {
        const box = q(`.wl-chips[data-f="${field}"]`);
        values.forEach((v) => {
          const b = el('button', 'wl-chip', v);
          b.type = 'button';
          b.dataset.v = v;
          b.addEventListener('click', () => {
            state[field] = state[field] === v ? null : v;
            touched[field] = true;
            paintChips();
          });
          box.appendChild(b);
        });
      }
      buildChips('judgment', OS.wl.JUDGMENTS);
      buildChips('stage', OS.wl.STAGES);

      function paintChips() {
        root.querySelectorAll('.wl-chips').forEach((box) => {
          box.querySelectorAll('.wl-chip').forEach((b) => {
            b.classList.toggle('on', state[box.dataset.f] === b.dataset.v);
          });
        });
      }

      function paintFav() {
        favBtn.classList.toggle('on', state.fav);
        favBtn.setAttribute('aria-pressed', String(state.fav));
      }
      favBtn.addEventListener('click', () => { state.fav = !state.fav; paintFav(); });

      note.addEventListener('input', () => { count.textContent = `${note.value.length}/200`; });

      /* ----- Formulaire ----- */
      function fill(d) {
        state.rating = d.rating != null ? Number(d.rating) : null;
        state.judgment = OS.wl.JUDGMENTS.includes(d.comment) ? d.comment : null;
        state.stage = OS.wl.STAGES.includes(d.stage) ? d.stage : null;
        state.fav = !!d.fav;
        touched.judgment = !!state.judgment;
        touched.stage = !!state.stage;
        note.value = d.note || '';
        count.textContent = `${note.value.length}/200`;
        paintStars();
        paintChips();
        paintFav();
      }

      function pick(name) {
        current = name;
        sb.setValue(name);
        fill(OS.wl.review(name) || {});
        paintStatus();
      }

      const dateFr = (ts) => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

      // Bandeau sous la recherche : déjà noté ? dans « À voir » ? nouveau ?
      function paintStatus() {
        const name = (current || search.value).trim();
        status.innerHTML = '';
        status.hidden = !name;
        recents.hidden = !!name || !recents.children.length;
        if (!name) return;
        const r = OS.wl.review(name);
        const inTodo = OS.wl.hasTodo(name);
        const text = el('span', 'wl-status-text');
        if (r && OS.wl.ratedNames().includes(name)) {
          status.dataset.kind = 'edit';
          text.textContent = `Déjà noté${r.rating ? ` ${'★'.repeat(r.rating)}` : ''}${r.ts ? ` · modifié le ${dateFr(r.ts)}` : ''}`;
        } else if (inTodo) {
          status.dataset.kind = 'todo';
          text.textContent = 'Dans ta liste « À voir »';
        } else {
          status.dataset.kind = 'new';
          text.textContent = 'Nouveau titre';
        }
        if (current) {
          const jb = el('button', 'wl-status-jacket');
          jb.type = 'button';
          jb.title = 'Changer la jaquette';
          jb.append(OS.covers.jacket(name, 'md'), el('span', 'wl-jcam'));
          jb.lastChild.innerHTML = OS.icon('image');
          jb.addEventListener('click', () => OS.covers.editor(name));
          status.appendChild(jb);
        }
        status.appendChild(text);
        if (!inTodo && !(r && OS.wl.ratedNames().includes(name))) {
          const add = el('button', 'wl-ghost', '+ À voir');
          add.type = 'button';
          add.addEventListener('click', () => { OS.wl.addTodo(name); OS.showNotification(`« ${name} » ajouté à ta liste.`); });
          status.appendChild(add);
        }
        if (r && OS.wl.ratedNames().includes(name)) {
          const del = el('button', 'wl-ghost', 'Supprimer');
          del.type = 'button';
          del.addEventListener('click', () => {
            const old = OS.wl.deleteReview(name);
            OS.undoToast(`« ${name} » supprimé`, () => OS.wl.restoreReview(name, old));
            resetForm();
          });
          status.appendChild(del);
        }
      }

      // Titres récemment notés : un clic pour les rouvrir
      function paintRecents() {
        recents.innerHTML = '';
        const list = OS.wl.recent(5);
        if (list.length) recents.appendChild(el('span', 'wl-recents-label', 'Récents'));
        list.forEach((n) => {
          const b = el('button', 'wl-chip', n);
          b.type = 'button';
          b.addEventListener('click', () => pick(n));
          recents.appendChild(b);
        });
        recents.hidden = !list.length || !!(current || search.value.trim());
      }

      // Petite pluie d'étoiles quand on met 5/5
      function sparkle() {
        const box = q('.wl-rating-box');
        for (let i = 0; i < 14; i++) {
          const sp = el('i', 'wl-spark');
          sp.textContent = '✦';
          sp.style.setProperty('--x', `${(Math.random() - 0.5) * 320}px`);
          sp.style.setProperty('--y', `${-60 - Math.random() * 160}px`);
          sp.style.left = '50%';
          sp.style.top = '60%';
          sp.style.animationDelay = `${Math.random() * 0.15}s`;
          box.appendChild(sp);
          setTimeout(() => sp.remove(), 1100);
        }
      }

      function resetForm() {
        current = null;
        sb.setValue('');
        fill({});
        paintRecents();
        paintStatus();
      }

      function saveReview() {
        const name = (current || search.value).trim();
        if (!name) return OS.showNotification('Indiquez un anime.', true);
        if (state.rating == null && !state.judgment && !state.stage) {
          return OS.showNotification('Choisissez une note, un avis ou un visionnage.', true);
        }
        OS.wl.setReview(name, {
          rating: state.rating,
          comment: state.judgment,
          stage: state.stage,
          note: note.value,
          fav: state.fav,
        });
        const perfect = state.rating === 5;
        resetForm();
        search.focus();
        OS.showNotification(`Critique de « ${name} » enregistrée !${perfect ? ' 🌟' : ''}`);
        if (perfect) sparkle();
      }

      const sb = OS.searchBox(search, {
        onPick: (it) => pick(it.name),
        onEnter: (name) => { if (current) saveReview(); else pick(name); },
        onClear: () => { current = null; fill({}); paintRecents(); paintStatus(); },
      });
      search.addEventListener('input', () => { current = null; paintStatus(); });
      q('[data-act="save"]').addEventListener('click', saveReview);
      q('[data-act="reset"]').addEventListener('click', resetForm);

      // Raccourcis clavier : 1-5 note, 0 efface, F favori, Ctrl+Entrée enregistre
      root.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); return saveReview(); }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const typing = e.target.matches && e.target.matches('input, textarea');
        if (typing) return;
        if (e.key === '/') { e.preventDefault(); search.focus(); return; }
        if (/^[0-5]$/.test(e.key)) { setRating(e.key === '0' ? null : Number(e.key)); }
        else if (e.key.toLowerCase() === 'f') { state.fav = !state.fav; paintFav(); }
      });

      fill({});
      paintRecents();
      paintStatus();
      const unsubscribe = OS.wl.subscribe(() => { paintRecents(); paintStatus(); });

      return {
        onClose: unsubscribe,
        open: (name) => { if (typeof name === 'string') pick(name); },
      };
    },
  });
})();
