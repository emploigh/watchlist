/* =========================================================
   Données de la Watchlist, partagées par les apps Accueil, Liste et À voir.
   Les clés de stockage reprennent celles de la Watchlist d'origine.
   Les apps s'abonnent avec OS.wl.subscribe() pour se rafraîchir.
   ========================================================= */
(() => {
  'use strict';

  const DATA_KEY = 'animeData';     // critiques : { titre: { rating, comment, stage, recommendation } }
  const TODO_KEY = 'animeList';     // à voir : [{ name, completed }]
  const TITLES_KEY = 'animeTitles'; // titres ajoutés par l'utilisateur
  const SEP = '-----------------------------';
  const NONE = 'Non commencé';

  let animeData = OS.load(DATA_KEY, {});
  let todo = OS.load(TODO_KEY, []);
  const listeners = new Set();

  const saveData = () => OS.store(DATA_KEY, animeData);
  const saveTodo = () => OS.store(TODO_KEY, todo);
  const notify = () => listeners.forEach((fn) => fn());
  const hasRating = (d) => d.rating != null || d.comment != null || (d.stage || NONE) !== NONE;
  const ratedNames = () => Object.keys(animeData).filter((n) => hasRating(animeData[n]));
  // Texte comparable : minuscules, sans accents ni ponctuation (recherche tolérante)
  const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const allTitles = () => [...new Set([...(window.ANIME_TITLES || []), ...OS.load(TITLES_KEY, [])])];

  /* ---------- Fichiers texte (export et Finder) ---------- */
  function exportText() {
    let s = 'Liste de Critiques Anime:\n\n';
    ratedNames().forEach((name) => {
      const d = animeData[name];
      s += `Titre : ${name}\n`;
      s += `Note : ${d.rating == null ? 'N/A' : d.rating + '/5'}\n`;
      s += `Visionnage : ${d.stage || NONE}\n`;
      s += `Avis : ${d.comment || 'Aucun'}\n`;
      if (d.fav) s += 'Favori : oui\n';
      if (d.note) s += `Notes : ${d.note}\n`;
      s += `${SEP}\n`;
    });
    return s;
  }

  function todoText() {
    if (!todo.length) return 'Liste à voir vide.\n';
    return todo.map((t) => `${t.completed ? '[vu]    ' : '[à voir] '} ${t.name}`).join('\n') + '\n';
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importText(text) {
    let count = 0;
    text.split(SEP).map((b) => b.trim()).filter(Boolean).forEach((block) => {
      const d = {};
      block.split('\n').forEach((line) => {
        const idx = line.indexOf(':');
        if (idx < 0) return;
        const key = line.slice(0, idx).trim().toLowerCase();
        const val = line.slice(idx + 1).trim();
        if (key === 'titre') d.titre = val;
        else if (key === 'note') d.rating = val === 'N/A' ? null : (parseInt(val, 10) || null);
        else if (key === 'visionnage') d.stage = val || NONE;
        else if (key === 'avis') d.comment = !val || val === 'Aucun' ? null : val;
        else if (key === 'favori') d.fav = val.toLowerCase() === 'oui';
        else if (key === 'notes') d.note = val;
      });
      if (d.titre) {
        animeData[d.titre] = {
          rating: d.rating ?? null,
          comment: d.comment ?? null,
          stage: d.stage || NONE,
          recommendation: null,
          fav: !!d.fav,
          note: d.note || '',
          ts: Date.now(),
        };
        count++;
      }
    });
    saveData();
    notify();
    return count;
  }

  /* ---------- API publique : OS.wl ---------- */
  OS.wl = {
    NONE,
    norm,
    JUDGMENTS: ['Goated🐐', 'Bon👍', 'Mid🫠', 'Bad💩'],
    STAGES: ['Dégommer🍙', 'Vu💯', 'Half👌', 'PasEncore😴'],

    refresh: notify, // force les apps à se redessiner
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // Critiques
    review: (name) => animeData[name] || null,
    ratedNames,
    allTitles,
    saveReview(name, { rating = null, comment = null, stage = null } = {}) {
      const entry = animeData[name] || { rating: null, comment: null, stage: NONE, recommendation: null };
      if (rating != null) entry.rating = rating;
      if (comment) entry.comment = comment;
      if (stage) entry.stage = stage;
      animeData[name] = entry;
      if (!allTitles().includes(name)) OS.store(TITLES_KEY, [...OS.load(TITLES_KEY, []), name]);
      saveData();
      notify();
    },
    // Remplace toute la critique (permet aussi d'effacer une note ou un avis)
    setReview(name, p = {}) {
      const old = animeData[name] || { recommendation: null };
      animeData[name] = {
        ...old,
        rating: p.rating ?? null,
        comment: p.comment || null,
        stage: p.stage || NONE,
        note: (p.note || '').replace(/\s*\n\s*/g, ' ').trim().slice(0, 200),
        fav: !!p.fav,
        ts: Date.now(),
      };
      if (!allTitles().includes(name)) OS.store(TITLES_KEY, [...OS.load(TITLES_KEY, []), name]);
      // Si le titre était dans « À voir » et qu'on l'a noté / vu, on le coche
      const watched = p.rating != null || (p.stage && p.stage !== NONE && p.stage !== 'PasEncore😴');
      const pending = todo.find((t) => !t.completed && t.name.toLowerCase() === name.toLowerCase());
      if (pending && watched) { pending.completed = true; saveTodo(); }
      saveData();
      notify();
    },
    toggleFav(name) {
      if (!animeData[name]) return;
      animeData[name].fav = !animeData[name].fav;
      saveData();
      notify();
    },
    deleteReview(name) {
      const old = animeData[name];
      delete animeData[name];
      saveData();
      notify();
      return old;
    },
    // Annuler une suppression
    restoreReview(name, entry) {
      if (!entry) return;
      animeData[name] = entry;
      saveData();
      notify();
    },
    recent(n = 3) {
      return ratedNames().sort((a, b) => (animeData[b].ts || 0) - (animeData[a].ts || 0)).slice(0, n);
    },
    stageCounts() {
      const out = {};
      ratedNames().forEach((n) => {
        const st = animeData[n].stage || NONE;
        if (st !== NONE) out[st] = (out[st] || 0) + 1;
      });
      return out;
    },
    // Sauvegarde complète (critiques + liste à voir) en JSON
    exportJSON: () => download('Watchlist_backup.json', JSON.stringify({ v: 2, reviews: animeData, todo, covers: OS.covers ? OS.covers.dump() : {} }, null, 2)),
    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || typeof data.reviews !== 'object') throw new Error('Fichier invalide');
      let count = 0;
      Object.entries(data.reviews).forEach(([name, d]) => {
        if (d && typeof d === 'object') { animeData[name] = { rating: null, comment: null, stage: NONE, recommendation: null, ...d }; count++; }
      });
      (Array.isArray(data.todo) ? data.todo : []).forEach((t) => {
        if (t && t.name && !todo.some((x) => x.name.toLowerCase() === String(t.name).toLowerCase())) todo.push({ name: String(t.name), completed: !!t.completed, pin: !!t.pin });
      });
      if (OS.covers && data.covers && typeof data.covers === 'object') OS.covers.load(data.covers);
      saveData();
      saveTodo();
      notify();
      return count;
    },
    clearReviews() {
      animeData = {};
      saveData();
      notify();
    },
    exportFile: () => download('Saved_WatchList.txt', exportText()),
    importText,

    // À voir
    todo: () => todo,
    hasTodo: (name) => todo.some((t) => t.name.toLowerCase() === name.toLowerCase()),
    addTodo(name) {
      todo.push({ name, completed: false });
      saveTodo();
      notify();
    },
    toggleTodo(i) {
      todo[i].completed = !todo[i].completed;
      saveTodo();
      notify();
    },
    removeTodo(i) {
      const [gone] = todo.splice(i, 1);
      saveTodo();
      notify();
      return gone;
    },
    restoreTodo(item) {
      if (!item || todo.some((t) => t.name.toLowerCase() === item.name.toLowerCase())) return;
      todo.push(item);
      saveTodo();
      notify();
    },
    renameTodo(i, name) {
      name = String(name || '').trim().slice(0, 60);
      if (!name || !todo[i]) return false;
      if (todo.some((t, k) => k !== i && t.name.toLowerCase() === name.toLowerCase())) return false;
      todo[i].name = name;
      saveTodo();
      notify();
      return true;
    },
    // Retire tous les titres vus ; renvoie ce qui a été retiré (pour « Annuler »)
    clearSeen() {
      const gone = todo.filter((t) => t.completed);
      todo = todo.filter((t) => !t.completed);
      saveTodo();
      notify();
      return gone;
    },
    restoreMany(items) { (items || []).forEach((it) => OS.wl.restoreTodo(it)); },
    togglePin(i) {
      todo[i].pin = !todo[i].pin;
      saveTodo();
      notify();
    },

    // Tout effacer (Réglages › Données)
    clearAll() {
      animeData = {};
      todo = [];
      saveData();
      saveTodo();
      OS.store(TITLES_KEY, []);
      if (OS.covers) OS.covers.clearAll();
      notify();
    },
  };

  // Fichiers virtuels du Finder (Documents › Watchlist)
  OS.watchlistFiles = () => [
    { name: 'Critiques.txt', type: 'file', text: exportText() },
    { name: 'A_voir.txt', type: 'file', text: todoText() },
  ];

  OS.resetWatchlist = () => OS.wl.clearAll();

  // Message avec bouton « Annuler » (suppression réversible pendant 6 s)
  OS.undoToast = (message, onUndo) => {
    document.querySelectorAll('.toast-undo').forEach((t) => t.remove());
    const toast = document.createElement('div');
    toast.className = 'toast toast-undo';
    const text = document.createElement('span');
    text.textContent = message;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Annuler';
    toast.append(text, btn);
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    };
    btn.addEventListener('click', () => { onUndo(); close(); });
    setTimeout(close, 6000);
  };
})();
