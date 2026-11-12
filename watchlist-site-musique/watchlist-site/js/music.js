/* =========================================================
   Application Musique : lecteur en arrière-plan + playlist
   La lecture continue même si la fenêtre est fermée.
   ========================================================= */
(() => {
  'use strict';

  const SONGS_KEY = 'customSongs';   // morceaux ajoutés (le premier morceau est intégré)
  const LAST_KEY = 'lastSongIndex';
  const SHUFFLE_KEY = 'musicShuffle';
  const REPEAT_KEY = 'musicRepeatOne';
  const VOLUME_KEY = 'musicVolume';
  const BASE = [{
    title: 'Unravel',
    artist: 'TK from 凛として時雨',
    cover: 'image/jaq/Unravel.jpg',
    source: 'music/unravel.mp3',       // nom réel du fichier (minuscules)
  }];

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = OS.load(VOLUME_KEY, 100) / 100;

  let playlist = [...BASE, ...OS.load(SONGS_KEY, [])];
  let index = Number(OS.load(LAST_KEY, 0));
  if (!Number.isInteger(index) || index < 0 || index >= playlist.length) index = 0;
  let shuffle = !!OS.load(SHUFFLE_KEY, false);
  let repeatOne = !!OS.load(REPEAT_KEY, false);
  let ui = null; // éléments de la fenêtre, quand elle est ouverte
  // Prévient le bureau (écran de verrouillage) que l'état du lecteur a changé
  const notify = () => window.dispatchEvent(new Event('wl:player'));

  // Icônes de lecture en SVG (nettes sur le verre, elles suivent la couleur du texte)
  const IC = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14l-9-7zM5 5h3v14H5z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14l9-7zM16 5h3v14h-3z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" fill="currentColor"/></svg>',
  };

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const fmt = (t) => {
    if (!isFinite(t) || t < 0) return '0:00';
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };

  /* ---------- Lecture ---------- */
  function loadSong(i, play) {
    index = i;
    const song = playlist[i];
    audio.src = song.source;
    OS.store(LAST_KEY, index);
    updateMediaSession(song);
    if (play) audio.play().catch(() => {});
    updateUI();
  }

  const togglePlay = () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  // Morceau suivant : au hasard (différent du courant) si « aléatoire », sinon dans l'ordre
  const nextIndex = () => {
    if (shuffle && playlist.length > 1) {
      let r;
      do { r = Math.floor(Math.random() * playlist.length); } while (r === index);
      return r;
    }
    return (index + 1) % playlist.length;
  };
  const next = () => loadSong(nextIndex(), !audio.paused);
  const prev = () => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadSong((index - 1 + playlist.length) % playlist.length, !audio.paused);
  };

  audio.addEventListener('ended', () => {
    if (repeatOne) { audio.currentTime = 0; audio.play().catch(() => {}); }
    else loadSong(nextIndex(), true);
  });
  audio.addEventListener('play', updateUI);
  audio.addEventListener('pause', updateUI);
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);

  function updateMediaSession(song) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Watchlist',
      artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }],
    });
    const h = navigator.mediaSession;
    h.setActionHandler('play', () => audio.play().catch(() => {}));
    h.setActionHandler('pause', () => audio.pause());
    h.setActionHandler('previoustrack', prev);
    h.setActionHandler('nexttrack', next);
  }

  /* ---------- Interface ---------- */
  function updateUI() {
    notify();
    if (!ui) return;
    const song = playlist[index];
    ui.cover.src = song.cover;
    ui.root.style.setProperty('--cover', `url("${new URL(song.cover, document.baseURI).href}")`); // lueur de la pochette (liquid glass)
    ui.title.textContent = song.title;
    ui.artist.textContent = song.artist;
    ui.playImg.innerHTML = audio.paused ? IC.play : IC.pause;
    ui.shuffle.classList.toggle('on', shuffle);
    ui.shuffle.setAttribute('aria-pressed', String(shuffle));
    ui.repeat.classList.toggle('on', repeatOne);
    ui.repeat.setAttribute('aria-pressed', String(repeatOne));
    ui.list.querySelectorAll('.mu-item').forEach((li, i) => li.classList.toggle('current', i === index));
    updateProgress();
  }

  function updateProgress() {
    notify();
    if (!ui) return;
    const d = isFinite(audio.duration) ? audio.duration : 0;
    ui.progress.value = d ? (audio.currentTime / d) * 100 : 0;
    ui.progress.style.setProperty('--val', `${ui.progress.value}%`);
    ui.cur.textContent = fmt(audio.currentTime);
    ui.dur.textContent = fmt(d);
  }

  function renderList() {
    if (!ui) return;
    ui.list.innerHTML = '';
    playlist.forEach((song, i) => {
      const li = el('li', 'mu-item');
      const main = el('button', 'mu-item-main');
      main.append(el('strong', '', song.title), el('span', '', song.artist));
      main.addEventListener('click', () => loadSong(i, true));
      li.appendChild(main);
      if (i > 0) {
        const del = el('button', 'delete-btn', 'Supprimer');
        del.addEventListener('click', () => OS.confirm(`Supprimer « ${song.title} » de la playlist ?`, () => removeSong(i)));
        li.appendChild(del);
      }
      ui.list.appendChild(li);
    });
    updateUI();
  }

  function removeSong(i) {
    const removed = playlist[i];
    const wasCurrent = index === i;
    playlist.splice(i, 1);
    OS.store(SONGS_KEY, playlist.slice(1));
    if (wasCurrent) {
      audio.pause();
      loadSong(0, false);
    } else {
      if (index > i) index -= 1;
      OS.store(LAST_KEY, index);
    }
    renderList();
    OS.showNotification(`« ${removed.title} » a été supprimée.`, true);
  }

  // Appelée depuis Réglages › Musique. Renvoie true si le morceau est ajouté.
  function addSong({ title, artist, cover, source: file }) {
    title = (title || '').trim();
    artist = (artist || '').trim();
    file = (file || '').trim();
    cover = (cover || '').trim() || 'image/cover/musicover.jpg';
    if (!title || !artist || !file) {
      OS.showNotification("Remplissez le titre, l'artiste et le fichier.", true);
      return false;
    }
    if (playlist.some((s) => s.title === title && s.artist === artist)) {
      OS.showNotification('Ce morceau est déjà dans la playlist.', true);
      return false;
    }
    // Chemin relatif au dossier music/, ou URL complète
    const source = /^(https?:|music\/)/.test(file) ? file : `music/${file}`;
    playlist.push({ title, artist, cover, source });
    if (!OS.store(SONGS_KEY, playlist.slice(1))) OS.showNotification('Morceau ajouté, mais le navigateur ne peut pas le conserver (stockage plein).', true);
    renderList();
    notify();
    OS.showNotification('Morceau ajouté à la playlist !');
    return true;
  }

  OS.register('music', {
    title: 'Musique',
    icon: 'music',
    width: 400,
    height: 620,
    desk: true,
    build(body) {
      body.innerHTML = `
        <div class="mu">
          <div class="mu-now">
            <div class="mu-cover"><img alt="Pochette"></div>
            <h2 class="mu-title"></h2>
            <p class="mu-artist"></p>
            <input type="range" class="mu-progress" min="0" max="100" step="0.1" value="0" aria-label="Position">
            <div class="mu-times"><span class="mu-cur">0:00</span><span class="mu-dur">0:00</span></div>
            <div class="mu-controls">
              <button class="mu-btn mu-mini" data-act="shuffle" aria-label="Lecture aléatoire" title="Aléatoire"><svg class="svg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.5c2 0 3.2 1 4.3 2.8l2.4 4.4c1.1 1.8 2.3 2.8 4.3 2.8H21M3 17h3.5c1.3 0 2.3-.4 3.1-1.2M13.4 8.4c.8-.9 1.9-1.4 3.1-1.4H21M18 4l3 3-3 3M18 14l3 3-3 3"/></svg></button>
              <button class="mu-btn" data-act="prev" aria-label="Précédent">${IC.prev}</button>
              <button class="mu-btn mu-play" data-act="play" aria-label="Lecture / pause">${IC.play}</button>
              <button class="mu-btn" data-act="next" aria-label="Suivant">${IC.next}</button>
              <button class="mu-btn mu-mini" data-act="repeat" aria-label="Répéter le morceau" title="Répéter ce morceau"><svg class="svg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"/><path d="M11 10.5l1.2-.8v4.6" stroke-width="1.6"/></svg></button>
            </div>
            <label class="mu-volume"><svg class="svg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6"/></svg> <input type="range" min="0" max="100" step="1" value="${Math.round(audio.volume * 100)}" aria-label="Volume"></label>
          </div>
          <div class="mu-side">
            <h3>Playlist</h3>
            <ul class="mu-list"></ul>
            <h3>Ajouter un morceau</h3>
            <form class="mu-form" autocomplete="off">
              <input name="title" type="text" placeholder="Titre" maxlength="80" required>
              <input name="artist" type="text" placeholder="Artiste" maxlength="80" required>
              <input name="source" type="text" placeholder="Nom du fichier dans music/ ou lien MP3" spellcheck="false" required>
              <input name="cover" type="text" placeholder="Pochette (lien, facultatif)" spellcheck="false">
              <button class="btn" type="submit">Ajouter à la playlist</button>
              <p class="mu-hint">Mets ton fichier dans le dossier <b>music/</b> puis saisis son nom, ou colle un lien direct vers un MP3.</p>
            </form>
          </div>
        </div>`;

      const q = (sel) => body.querySelector(sel);

      ui = {
        root: body.closest('.window, .pane') || body,
        shuffle: q('[data-act="shuffle"]'),
        repeat: q('[data-act="repeat"]'),
        cover: q('.mu-cover img'),
        title: q('.mu-title'),
        artist: q('.mu-artist'),
        progress: q('.mu-progress'),
        cur: q('.mu-cur'),
        dur: q('.mu-dur'),
        playImg: q('.mu-play'),
        volume: q('.mu-volume input'),
        list: q('.mu-list'),
      };

      q('[data-act="prev"]').addEventListener('click', prev);
      q('[data-act="next"]').addEventListener('click', next);
      q('.mu-play').addEventListener('click', togglePlay);
      ui.shuffle.addEventListener('click', () => { shuffle = !shuffle; OS.store(SHUFFLE_KEY, shuffle); updateUI(); });
      ui.repeat.addEventListener('click', () => { repeatOne = !repeatOne; OS.store(REPEAT_KEY, repeatOne); updateUI(); });
      const form = q('.mu-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(form);
        if (addSong({ title: f.get('title'), artist: f.get('artist'), source: f.get('source'), cover: f.get('cover') })) form.reset();
      });

      ui.progress.addEventListener('input', () => {
        const d = isFinite(audio.duration) ? audio.duration : 0;
        audio.currentTime = (ui.progress.value / 100) * d;
      });

      const volume = q('.mu-volume input');
      const paintVolume = () => volume.style.setProperty('--val', `${volume.value}%`);
      paintVolume();
      volume.addEventListener('input', () => {
        paintVolume();
        audio.volume = Number(volume.value) / 100;
        OS.store(VOLUME_KEY, Number(volume.value));
      });

      renderList();
      return { onClose: () => { ui = null; } };
    },
  });

  /* Commandes du lecteur, utilisées par l'écran de verrouillage */
  OS.player = {
    song: () => playlist[index],
    isPlaying: () => !audio.paused,
    progress: () => ({ cur: audio.currentTime, dur: isFinite(audio.duration) ? audio.duration : 0 }),
    toggle: togglePlay,
    volume: () => Math.round(audio.volume * 100),
    setVolume(v) {
      v = Math.max(0, Math.min(100, Math.round(v)));
      audio.volume = v / 100;
      OS.store(VOLUME_KEY, v);
      if (ui && ui.volume) { ui.volume.value = v; ui.volume.style.setProperty('--val', `${v}%`); }
    },
    next,
    prev,
    add: addSong,
    // Morceaux ajoutés (le morceau intégré, à l'index 0, n'est pas listé)
    added: () => playlist.slice(1).map((song, i) => ({ ...song, index: i + 1 })),
    remove: (i) => { if (i > 0 && i < playlist.length) removeSong(i); },
  };

  // Charge le morceau courant sans le lancer
  loadSong(index, false);
})();
