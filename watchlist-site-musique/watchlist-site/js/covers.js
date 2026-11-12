/* =========================================================
   Jaquettes (affiches) des animés.
   - Récupération automatique via Jikan (MyAnimeList), AniList en secours.
   - Cache local (localStorage) : une image n'est cherchée qu'une fois.
   - Image personnalisée : import de fichier, URL ou collage (Ctrl+V).
   - Sans image : affiche générée (dégradé + initiales) propre à chaque titre.
   API : OS.covers.jacket(nom, 'sm'|'md'|'lg') -> élément prêt à insérer.
   ========================================================= */
(() => {
  'use strict';

  const KEY = 'wlCovers';
  const RETRY_MS = 24 * 3600 * 1000; // un titre introuvable est re-tenté après 24 h
  const norm = (t) => (OS.wl ? OS.wl.norm(t) : String(t || '').toLowerCase().trim());

  let store = OS.load(KEY, {}); // { clé: { u: url|null, src: 'api'|'custom'|'none', ts } }
  const listeners = new Set();
  const save = () => { try { OS.store(KEY, store); } catch (e) { /* quota : on garde en mémoire */ } };
  const notify = (name) => listeners.forEach((fn) => fn(name));

  /* ---------- Recherche en ligne ---------- */
  const jikanItem = (a) => ({
    title: a.title_english || a.title,
    alt: a.title,
    img: (a.images.webp && a.images.webp.image_url) || a.images.jpg.image_url,
    big: (a.images.webp && a.images.webp.large_image_url) || a.images.jpg.large_image_url || a.images.jpg.image_url,
    year: a.year || (a.aired && a.aired.prop && a.aired.prop.from && a.aired.prop.from.year) || null,
    type: a.type || '',
    score: a.score || null,
    id: 'mal' + a.mal_id,
  });
  const aniItem = (m) => ({
    title: m.title.english || m.title.romaji,
    alt: m.title.romaji,
    img: m.coverImage.medium || m.coverImage.large,
    big: m.coverImage.large,
    year: m.seasonYear || null,
    type: m.format || '',
    score: m.averageScore ? m.averageScore / 10 : null,
    id: 'ani' + m.id,
  });

  async function fromJikan(term, limit, signal) {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(term)}&limit=${limit}&sfw=true`;
    const r = await fetch(url, { signal });
    if (!r.ok) throw new Error('jikan ' + r.status);
    const j = await r.json();
    return (j.data || []).filter((a) => a.images && (a.images.webp || a.images.jpg)).map(jikanItem);
  }

  async function fromAniList(term, limit, signal) {
    const query = `query($s:String,$n:Int){Page(perPage:$n){media(search:$s,type:ANIME,sort:SEARCH_MATCH){id title{romaji english} coverImage{medium large} seasonYear format averageScore}}}`;
    const r = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { s: term, n: limit } }),
      signal,
    });
    if (!r.ok) throw new Error('anilist ' + r.status);
    const j = await r.json();
    return ((j.data && j.data.Page.media) || []).map(aniItem);
  }

  const kitsuItem = (a) => {
    const t = a.attributes;
    return {
      title: (t.titles && (t.titles.en || t.titles.en_us)) || t.canonicalTitle,
      alt: t.canonicalTitle,
      img: t.posterImage && (t.posterImage.small || t.posterImage.medium || t.posterImage.original),
      big: t.posterImage && (t.posterImage.large || t.posterImage.original || t.posterImage.medium),
      year: t.startDate ? Number(t.startDate.slice(0, 4)) : null,
      type: t.subtype ? String(t.subtype).toUpperCase() : '',
      score: t.averageRating ? Number(t.averageRating) / 10 : null,
      id: 'kit' + a.id,
    };
  };
  async function fromKitsu(term, limit, signal) {
    const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(term)}&page[limit]=${Math.min(limit, 20)}`;
    const r = await fetch(url, { signal, headers: { Accept: 'application/vnd.api+json' } });
    if (!r.ok) throw new Error('kitsu ' + r.status);
    const j = await r.json();
    return (j.data || []).map(kitsuItem).filter((x) => x.big);
  }

  const searchCache = new Map();
  // Résultats [{title, img, big, year, type, score}]. Lance une erreur si aucun service ne répond.
  async function search(term, { limit = 8, signal } = {}) {
    term = String(term).replace(/[^\p{L}\p{N}\s:'’.!?&-]/gu, ' ').replace(/\s+/g, ' ').trim(); // sans emoji
    if (!term) return [];
    const key = norm(term) + '|' + limit;
    if (searchCache.has(key)) return searchCache.get(key);
    // Jikan (MyAnimeList) → AniList → Kitsu : on passe au suivant si un service est vide ou en panne
    let res = [];
    let lastErr = null;
    for (const provider of [fromJikan, fromAniList, fromKitsu]) {
      try {
        res = await provider(term, limit, signal);
        if (res.length) break;
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        lastErr = e;
      }
    }
    if (!res.length && lastErr) throw lastErr; // aucun service n'a répondu
    searchCache.set(key, res);
    if (searchCache.size > 60) searchCache.delete(searchCache.keys().next().value);
    return res;
  }

  /* ---------- File d'attente (Jikan limite le débit) ---------- */
  const pending = new Map(); // clé -> promesse
  let chain = Promise.resolve();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function ensure(name, force = false) {
    const k = norm(name);
    if (!k) return Promise.resolve(null);
    const hit = store[k];
    if (hit && (hit.u || hit.src === 'none')) return Promise.resolve(hit.u);
    if (hit && !force && Date.now() - hit.ts < RETRY_MS) return Promise.resolve(hit.u);
    if (pending.has(k)) return pending.get(k);
    const job = chain.then(async () => {
      let url = null;
      let ok = true;
      try {
        const res = await search(name, { limit: 5 });
        const best = res.find((r) => norm(r.title) === k || norm(r.alt) === k) || res[0];
        url = best ? best.big : null;
      } catch (e) { ok = false; }
      if (ok) { store[k] = { u: url, src: 'api', ts: Date.now() }; save(); }
      pending.delete(k);
      if (url) notify(name);
      await wait(380);
      return url;
    });
    chain = job.catch(() => {});
    pending.set(k, job);
    return job;
  }

  // Récupère les jaquettes manquantes d'une liste de titres. onProgress(fait, total, trouvées)
  async function fetchAll(names, onProgress) {
    const todo = [...new Set(names)].filter((n) => !get(n) && source(n) !== 'none');
    let found = 0;
    for (let i = 0; i < todo.length; i++) {
      if (await ensure(todo[i], true)) found++;
      onProgress && onProgress(i + 1, todo.length, found);
    }
    return { total: todo.length, found };
  }

  /* ---------- Lecture / écriture ---------- */
  const get = (name) => (store[norm(name)] && store[norm(name)].u) || null;
  const source = (name) => (store[norm(name)] && store[norm(name)].src) || null;

  function set(name, url, src = 'api') {
    const k = norm(name);
    if (!k) return;
    store[k] = { u: url || null, src: url ? src : 'none', ts: Date.now() };
    save();
    notify(name);
  }
  // Remet en automatique (relance la recherche)
  function reset(name) {
    delete store[norm(name)];
    save();
    notify(name);
    ensure(name);
  }

  // Réduit une image importée (fichier ou Blob) en JPEG 300×420, recadrée « cover »
  function shrink(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const W = 300, H = 420;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        const sc = Math.max(W / img.width, H / img.height);
        const w = img.width * sc, h = img.height * sc;
        ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')); };
      img.src = url;
    });
  }
  async function setFile(name, file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Ce fichier n’est pas une image.');
    set(name, await shrink(file), 'custom');
  }
  function setUrl(name, url) {
    url = String(url || '').trim();
    if (!/^https?:\/\//i.test(url)) throw new Error('Adresse d’image invalide.');
    set(name, url, 'custom');
  }

  /* ---------- Affiche générée ---------- */
  function hash(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
  function initials(name) {
    const w = String(name).replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    const big = w.filter((x) => x.length > 2);
    const use = big.length >= 2 ? big : w;
    return (use.length === 1 ? use[0].slice(0, 2) : use[0][0] + use[1][0]).toUpperCase();
  }

  // Retire les écouteurs des jaquettes disparues de la page
  function prune() {
    listeners.forEach((fn) => { if (fn.box && !fn.box.isConnected && Date.now() - fn.born > 3000) listeners.delete(fn); });
  }

  // Élément « jaquette » : affiche générée tout de suite, vraie image par-dessus dès qu'elle est là
  function jacket(name, size = 'md', fixedUrl = null) {
    const box = document.createElement('div');
    box.className = `wl-jacket wl-j-${size}`;
    const h = hash(norm(name)) % 360;
    box.style.setProperty('--h', h);
    const ini = document.createElement('span');
    ini.className = 'wl-j-ini';
    ini.textContent = initials(name);
    box.appendChild(ini);

    let lastUrl = null;
    const paint = () => {
      const u = fixedUrl || get(name);
      if (u === lastUrl) return;
      lastUrl = u;
      box.querySelector('img')?.remove();
      box.classList.remove('has-img');
      if (!u) return;
      const img = new Image();
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.draggable = false;
      img.onload = () => { box.classList.add('has-img'); };
      img.onerror = () => { img.remove(); if (store[norm(name)] && store[norm(name)].src === 'api') { delete store[norm(name)]; } };
      img.src = u;
      box.appendChild(img);
    };
    paint();
    if (fixedUrl) return box; // aperçu : pas de cache ni d'abonnement
    if (!get(name)) ensure(name);

    // se met à jour quand la jaquette arrive ou change
    const born = Date.now();
    const off = (n) => { if (n === undefined || norm(n) === norm(name)) paint(); };
    off.box = box;
    off.born = born;
    if (listeners.size > 150) prune();
    listeners.add(off);
    return box;
  }

  /* ---------- Sauvegarde / import ---------- */
  const dump = () => {
    const out = {};
    Object.entries(store).forEach(([k, v]) => { if (v.u) out[k] = { u: v.u, src: v.src }; });
    return out;
  };
  function load(data) {
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v && typeof v.u === 'string') store[k] = { u: v.u, src: v.src === 'custom' ? 'custom' : 'api', ts: Date.now() };
    });
    save();
    notify();
  }
  function clearAll() { store = {}; save(); notify(); }

  /* ---------- Fenêtre « Changer la jaquette » ---------- */
  function editor(name, onDone) {
    document.querySelectorAll('.wl-cover-modal').forEach((m) => m.remove());
    const wrap = document.createElement('div');
    wrap.className = 'wl-cover-modal';
    wrap.innerHTML = `
      <div class="wl-cm-card" role="dialog" aria-label="Jaquette">
        <div class="wl-cm-head"><b></b><button type="button" class="wl-cm-x" aria-label="Fermer">${OS.icon('x')}</button></div>
        <div class="wl-cm-body">
          <div class="wl-cm-preview"></div>
          <div class="wl-cm-side">
            <label class="wl-cm-btn">${OS.icon('image')} Importer une image<input type="file" accept="image/*" hidden></label>
            <div class="wl-cm-url"><input type="url" placeholder="Coller l’adresse d’une image…" spellcheck="false"><button type="button" data-a="url">${OS.icon('check')}</button></div>
            <button type="button" class="wl-cm-btn" data-a="auto">${OS.icon('refresh')} Rechercher en ligne</button>
            <button type="button" class="wl-cm-btn danger" data-a="none">${OS.icon('trash')} Retirer l’image</button>
            <p class="wl-cm-hint">Astuce : glisse une image ici ou fais Ctrl+V.</p>
          </div>
        </div>
        <div class="wl-cm-results" hidden></div>
        <p class="wl-cm-msg" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));

    const q = (s) => wrap.querySelector(s);
    q('.wl-cm-head b').textContent = name;
    const prev = q('.wl-cm-preview');
    const msg = q('.wl-cm-msg');
    const results = q('.wl-cm-results');
    const say = (t, bad) => { msg.textContent = t || ''; msg.dataset.bad = bad ? '1' : ''; };
    const showPrev = () => { prev.innerHTML = ''; prev.appendChild(jacket(name, 'lg')); };
    showPrev();
    const off = (n) => { if (norm(n) === norm(name)) { showPrev(); onDone && onDone(); } };
    listeners.add(off);

    const close = () => {
      listeners.delete(off);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('keydown', onKey);
      wrap.classList.remove('show');
      setTimeout(() => wrap.remove(), 250);
    };
    const run = async (fn) => { try { say(''); await fn(); } catch (e) { say(e.message || 'Échec.', true); } };
    const onPaste = (e) => {
      const f = [...(e.clipboardData ? e.clipboardData.files : [])].find((x) => /^image\//.test(x.type));
      if (f) { e.preventDefault(); run(() => setFile(name, f)); }
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKey);

    q('.wl-cm-x').addEventListener('click', close);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    q('input[type=file]').addEventListener('change', (e) => run(() => setFile(name, e.target.files[0])));
    const urlIn = q('.wl-cm-url input');
    const applyUrl = () => run(() => setUrl(name, urlIn.value));
    q('[data-a="url"]').addEventListener('click', applyUrl);
    urlIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyUrl(); });
    q('[data-a="none"]').addEventListener('click', () => { set(name, null); results.hidden = true; say('Image retirée : une affiche générée est utilisée.'); });
    q('[data-a="auto"]').addEventListener('click', () => run(async () => {
      say('Recherche…');
      const list = await search(name, { limit: 8 });
      results.innerHTML = '';
      results.hidden = !list.length;
      if (!list.length) return say('Aucun résultat en ligne.', true);
      say('Choisis la bonne jaquette :');
      list.forEach((it) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = `${it.title}${it.year ? ' · ' + it.year : ''}`;
        const im = new Image();
        im.src = it.img; im.alt = ''; im.referrerPolicy = 'no-referrer';
        b.appendChild(im);
        b.addEventListener('click', () => { set(name, it.big, 'api'); say('Jaquette appliquée.'); });
        results.appendChild(b);
      });
    }));
    ['dragover', 'drop'].forEach((ev) => wrap.addEventListener(ev, (e) => {
      e.preventDefault();
      if (ev === 'drop') { const f = e.dataTransfer.files[0]; if (f) run(() => setFile(name, f)); }
    }));
  }

  OS.covers = {
    get, source, set, setFile, setUrl, reset, ensure, fetchAll, search, jacket, editor,
    dump, load, clearAll,
    initials, hash,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
