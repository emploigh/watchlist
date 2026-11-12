/* =========================================================
   Musique dans l'interface du site :
   - voyant « en lecture » (barres animées) sur l'onglet et le bouton,
   - carte « En cours d'écoute » sur l'Accueil.
   Pilote le même lecteur que la page Musique (OS.player).
   ========================================================= */
(() => {
  'use strict';
  const P = OS.player;
  if (!P) return;

  const EQ = '<i class="eq" aria-hidden="true"><b></b><b></b><b></b></i>';
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" fill="currentColor"/></svg>';
  const PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14l-9-7zM5 5h3v14H5z" fill="currentColor"/></svg>';
  const NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14l9-7zM16 5h3v14h-3z" fill="currentColor"/></svg>';

  // Voyant sur l'onglet Musique
  const tab = document.querySelector('.site-tab[data-key="music"]');
  if (tab) tab.insertAdjacentHTML('beforeend', EQ);

  /* ---------- Carte « En cours d'écoute » (Accueil) ---------- */
  let card = null;
  function ensureCard() {
    const host = document.querySelector('#pane-home .wl-home-main');
    if (!host || card) return;
    card = document.createElement('div');
    card.className = 'wl-nowplaying';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', 'Musique en cours');
    card.innerHTML = `
      <button class="np-open" type="button" aria-label="Ouvrir la Musique">
        <img class="np-cover" alt="">
        <span class="np-meta"><small>En cours d'écoute</small><b class="np-title"></b><em class="np-artist"></em></span>
      </button>
      <span class="np-ctl">
        <button type="button" data-a="prev" aria-label="Précédent">${PREV}</button>
        <button type="button" data-a="toggle" class="main" aria-label="Lecture"></button>
        <button type="button" data-a="next" aria-label="Suivant">${NEXT}</button>
      </span>
      <span class="np-bar"><i></i></span>`;
    const hello = host.querySelector('.wl-hello');
    if (hello) hello.after(card); else host.prepend(card);
    card.querySelector('.np-open').addEventListener('click', () => OS.openApp('music'));
    card.querySelector('[data-a="prev"]').addEventListener('click', () => P.prev());
    card.querySelector('[data-a="toggle"]').addEventListener('click', () => P.toggle());
    card.querySelector('[data-a="next"]').addEventListener('click', () => P.next());
    paint();
  }

  let last = '';
  function paint() {
    const playing = P.isPlaying();
    document.body.classList.toggle('is-playing', playing);
    if (!card) return;
    const song = P.song();
    const { cur, dur } = P.progress();
    const img = card.querySelector('.np-cover');
    if (img.getAttribute('src') !== song.cover) img.src = song.cover;
    const key = `${song.title}|${song.artist}|${playing}`;
    if (key !== last) {
      last = key;
      card.querySelector('.np-title').textContent = song.title;
      card.querySelector('.np-artist').textContent = song.artist;
      card.querySelector('[data-a="toggle"]').innerHTML = playing ? PAUSE : PLAY;
      card.querySelector('[data-a="toggle"]').setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
      card.classList.toggle('playing', playing);
    }
    card.querySelector('.np-bar i').style.width = dur ? `${Math.min(100, (cur / dur) * 100)}%` : '0%';
  }

  window.addEventListener('wl:player', paint);
  document.addEventListener('pane:built', ensureCard);
  ensureCard();
  paint();
})();
