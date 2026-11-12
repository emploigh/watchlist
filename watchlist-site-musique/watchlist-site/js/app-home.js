/* =========================================================
   Application Accueil : posters (RATING, LISTE, ToWatch, Wiki),
   statistiques, et guide affiché dans une popup comme la Wiki d'origine.
   ========================================================= */
(() => {
  'use strict';

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const GUIDE = [
    ['À quoi ça sert ?', 'Garder une trace des animés que vous avez vus, de ceux que vous voulez voir, de vos notes et de votre avancée.'],
    ['Noter un anime', "Dans l'app Rating, tapez le nom de l'anime et choisissez-le. Touchez les étoiles pour la note, choisissez un avis et un visionnage, ajoutez un favori ou une note perso, puis enregistrez. Un titre absent de la liste peut être ajouté tel quel."],
    ['Modifier ou supprimer', 'Dans la Liste, chaque critique a un bouton Modifier, qui remplit le formulaire de Rating, et un bouton Supprimer, qui demande une confirmation.'],
    ['Liste à voir', "Dans l'app À voir, ajoutez un titre puis cochez le rond quand vous l'avez vu. « Surprends-moi » tire un titre au hasard, et « Noter » ouvre directement la critique."],
    ['Trier et filtrer', 'Dans la Liste, triez par date, note ou ordre alphabétique, et filtrez par favoris ou par visionnage.'],
    ['Sauvegarder et restaurer', "Le bouton Réglages de la Liste ouvre la popup Export, Reset et Import. Les mêmes fichiers sont dans le Finder (Documents › Watchlist)."],
  ];

  OS.register('home', {
    title: 'Accueil',
    icon: 'home',
    width: 780,
    height: 600,
    desk: true,
    build(body) {
      body.innerHTML = `
        <div class="wlapp wl-home">
          <div class="wl-scroll">
            <div class="HOMEcontainer wl-home-main">
              <h1>
                <img class="icon-button" src="image/logo/blogo.png" alt="">
                <span class="dela-gothic-text" style="font-size: 52pt;">HOME</span>
              </h1>
              <div class="poster-container">
                <button class="poster-button" data-go="rating" aria-label="Rating"
                  style="background-image: url('image/cover/Animecover.jpg');"></button>
                <button class="poster-button" data-go="liste" aria-label="Liste"
                  style="background-image: url('image/cover/listcover.jpg');"></button>
                <button class="poster-button" data-go="avoir" aria-label="À voir"
                  style="background-image: url('image/cover/towatchcover.jpg');"></button>
                <button class="poster-button" data-go="guide" aria-label="Wiki"
                  style="background-image: url('image/cover/Wikicover.jpg');"></button>
              </div>
              <p class="wl-hello"></p>
              <div class="wl-widgets"></div>
            </div>
          </div>

          <div class="overlay"></div>
          <div class="popcorn wl-guide">
            <h1>
              <img class="logo-image" src="image/logo/blogo.png" alt="" width="12%">
              <span class="dela-gothic-text" style="font-size: 26pt;">Wiki</span>
            </h1>
            <div class="wl-guide-body"></div>
            <div class="newcontainer">
              <center><button class="modern-button" data-act="close-guide">${OS.icon('x')} Fermer</button></center>
            </div>
          </div>
        </div>`;

      const root = body.querySelector('.wl-home');
      const stats = root.querySelector('.wl-widgets');
      const hello = root.querySelector('.wl-hello');
      const overlay = root.querySelector('.overlay');
      const guide = root.querySelector('.wl-guide');
      const guideBody = root.querySelector('.wl-guide-body');

      GUIDE.forEach(([title, text]) => {
        const h2 = el('h2', 'dela-gothic-text');
        const logo = el('img', 'logo-image');
        logo.src = 'image/logo/logo.png';
        logo.alt = '';
        logo.setAttribute('width', '3%');
        h2.append(logo, document.createTextNode(` ${title}`));
        guideBody.append(h2, el('p', '', text));
      });

      function showGuide(on) {
        guide.classList.toggle('show', on);
        overlay.classList.toggle('show', on);
      }

      root.querySelectorAll('.poster-button').forEach((p) => {
        p.addEventListener('click', () => {
          if (p.dataset.go === 'guide') showGuide(true);
          else OS.openApp(p.dataset.go);
        });
      });
      overlay.addEventListener('click', () => showGuide(false));
      root.querySelector('[data-act="close-guide"]').addEventListener('click', () => showGuide(false));

      // Chaque statistique est un petit widget cliquable
      function renderStats() {
        const rated = OS.wl.ratedNames();
        const scores = rated.map((n) => OS.wl.review(n).rating).filter((v) => v != null);
        const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        const favs = rated.filter((n) => OS.wl.review(n).fav).length;
        const pending = OS.wl.todo().filter((t) => !t.completed).length;
        const widgets = [
          { cls: 'w-reviews', icon: 'chat', label: 'Critiques', value: String(rated.length), foot: rated.length > 1 ? 'animés notés' : 'anime noté', go: 'liste' },
          { cls: 'w-rating', icon: 'rating', label: 'Note moyenne', value: mean == null ? '—' : mean.toFixed(1), foot: '/ 5', go: 'liste', bar: mean == null ? 0 : (mean / 5) * 100 },
          { cls: 'w-fav', icon: 'heart', label: 'Favoris', value: String(favs), foot: favs > 1 ? 'coups de cœur' : 'coup de cœur', go: 'liste' },
          { cls: 'w-todo', icon: 'avoir', label: 'À voir', value: String(pending), foot: pending > 1 ? 'titres en attente' : 'titre en attente', go: 'avoir' },
        ];
        stats.innerHTML = '';
        const h = new Date().getHours();
        const who = (OS.me && OS.me() && OS.me().name) || '';
        hello.textContent = `${h < 6 || h >= 19 ? 'Bonsoir' : h < 12 ? 'Bonjour' : 'Bon après-midi'}${who ? ` ${who}` : ''} 👋 ${pending ? `${pending} titre${pending > 1 ? 's' : ''} t'attend${pending > 1 ? 'ent' : ''} dans ta liste.` : 'Ta liste est à jour.'}`;
        widgets.forEach((w) => {
          const card = el('button', `wl-widget ${w.cls}`);
          card.type = 'button';
          card.setAttribute('aria-label', `${w.label} : ${w.value}`);
          card.innerHTML = `
            <span class="wl-w-head"><i class="wl-w-ico">${OS.icon(w.icon)}</i><span class="wl-w-label"></span></span>
            <span class="wl-w-value"></span>
            <span class="wl-w-foot"></span>`;
          card.querySelector('.wl-w-label').textContent = w.label;
          card.querySelector('.wl-w-value').textContent = w.value;
          card.querySelector('.wl-w-foot').textContent = w.foot;
          if (w.bar != null) {
            const track = el('span', 'wl-w-bar');
            const fill = el('span', 'wl-w-barfill');
            fill.style.width = `${w.bar}%`;
            track.appendChild(fill);
            card.appendChild(track);
          }
          card.addEventListener('click', () => OS.openApp(w.go));
          stats.appendChild(card);
        });

        // Répartition des notes
        if (scores.length) {
          const dist = [1, 2, 3, 4, 5].map((n) => scores.filter((v) => v === n).length);
          const max = Math.max(...dist, 1);
          const histo = el('div', 'wl-histo');
          histo.appendChild(el('span', 'wl-histo-title', 'Répartition des notes'));
          const bars = el('div', 'wl-histo-bars');
          dist.forEach((c, i) => {
            const col = el('div', 'wl-histo-col');
            const bar = el('span', 'wl-histo-bar');
            bar.style.height = `${Math.max(6, (c / max) * 100)}%`;
            bar.title = `${c} × ${i + 1}★`;
            col.append(el('em', '', String(c)), bar, el('b', '', `${i + 1}★`));
            bars.appendChild(col);
          });
          histo.appendChild(bars);
          const top = rated.map((n) => [n, OS.wl.review(n).rating || 0]).sort((a, b) => b[1] - a[1])[0];
          if (top && top[1]) histo.appendChild(el('span', 'wl-histo-top', `Mieux noté : ${top[0]} (${top[1]}/5)`));
          stats.appendChild(histo);
        }

        // Répartition du visionnage (barre empilée)
        const stageCounts = OS.wl.stageCounts();
        const stageTotal = Object.values(stageCounts).reduce((a, b) => a + b, 0);
        if (stageTotal) {
          const box = el('div', 'wl-histo wl-stages');
          box.appendChild(el('span', 'wl-histo-title', 'Visionnage'));
          const bar = el('div', 'wl-stagebar');
          const legend = el('div', 'wl-stagelegend');
          OS.wl.STAGES.forEach((st, i) => {
            const c = stageCounts[st] || 0;
            if (!c) return;
            const seg = el('span', `wl-seg s${i}`);
            seg.style.flexGrow = c;
            seg.title = `${st} : ${c}`;
            bar.appendChild(seg);
            const lg = el('span', 'wl-leg');
            lg.innerHTML = `<i class="s${i}"></i>`;
            lg.appendChild(document.createTextNode(`${st} ${c}`));
            legend.appendChild(lg);
          });
          box.append(bar, legend);
          stats.appendChild(box);
        }

        // Dernières critiques : un clic rouvre la critique pour la modifier
        const recent = OS.wl.recent(4);
        if (recent.length) {
          const box = el('div', 'wl-histo wl-recent');
          box.appendChild(el('span', 'wl-histo-title', 'Dernières critiques'));
          const row = el('div', 'wl-recent-row');
          recent.forEach((n) => {
            const d = OS.wl.review(n);
            const b = el('button', 'wl-recent-item');
            b.type = 'button';
            const tx = el('span', 'wl-recent-tx');
            tx.append(el('b', '', n), el('em', '', d.rating == null ? '—' : '★'.repeat(d.rating)));
            b.append(OS.covers.jacket(n, 'sm'), tx);
            b.addEventListener('click', () => OS.openApp('rating', n));
            row.appendChild(b);
          });
          box.appendChild(row);
          stats.appendChild(box);
        }
      }

      const unsubscribe = OS.wl.subscribe(renderStats);
      renderStats();

      return {
        onClose: unsubscribe,
        open: (view) => { if (view === 'guide') showGuide(true); },
      };
    },
  });
})();
