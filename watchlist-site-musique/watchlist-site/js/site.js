/* =========================================================
   Site Watchlist : navigation, thème, une page par application.
   Routes : #/home  #/liste  #/rating  #/avoir  #/music
   ========================================================= */
(() => {
  'use strict';

  const TABS = [
    ['home', 'Accueil', 'home'],
    ['liste', 'Liste', 'liste'],
    ['rating', 'Rating', 'rating'],
    ['avoir', 'À voir', 'avoir'],
    ['music', 'Musique', 'music'],
  ];
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- Structure de la page ---------- */
  const nav = $('#site-nav');
  const main = $('#site-main');
  const links = {};
  const panes = {};
  const apis = {};

  TABS.forEach(([key, label, icon]) => {
    const a = document.createElement('a');
    a.className = 'site-tab';
    a.href = `#/${key}`;
    a.dataset.key = key;
    a.innerHTML = `${OS.icon(icon)}<span>${label}</span>`;
    $('#site-tabs').appendChild(a);
    links[key] = a;

    const pane = document.createElement('section');
    pane.className = 'pane';
    pane.id = `pane-${key}`;
    pane.dataset.app = key;
    pane.hidden = true;
    pane.setAttribute('aria-label', label);
    const body = document.createElement('div');
    body.className = 'win-body';
    pane.appendChild(body);
    main.appendChild(pane);
    panes[key] = { pane, body };
  });

  /* ---------- Affichage d'une page (construite à la première visite) ---------- */
  let current = null;
  function show(key, arg) {
    if (!panes[key]) key = 'home';
    Object.entries(panes).forEach(([k, p]) => { p.pane.hidden = k !== key; });
    Object.entries(links).forEach(([k, a]) => {
      a.classList.toggle('on', k === key);
      if (k === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!apis[key]) {
      const def = OS.apps[key];
      apis[key] = (def && def.build(panes[key].body, {})) || {};
      document.dispatchEvent(new CustomEvent('pane:built', { detail: key }));
    }
    if (arg !== undefined && apis[key].open) apis[key].open(arg);
    const label = TABS.find((t) => t[0] === key)[1];
    if (OS.hideMenus) OS.hideMenus();
    document.title = `${label} · Watchlist`;
    current = key;
  }

  // OS.openApp('rating', 'Titre') : on change la page et on transmet l'argument
  OS.route = (key, arg) => {
    const hash = `#/${key}`;
    if (location.hash !== hash) {
      pendingArg = arg;
      location.hash = hash;
    } else {
      show(key, arg);
    }
  };
  let pendingArg;
  const fromHash = () => {
    const key = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'home';
    const arg = pendingArg;
    pendingArg = undefined;
    show(key, arg);
  };
  window.addEventListener('hashchange', fromHash);

  /* ---------- Thème clair / sombre ---------- */
  const themeBtn = $('#site-theme');
  const prefersDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  let dark = OS.load('wl-site-dark', prefersDark);
  function paintTheme() {
    document.body.classList.toggle('dark', dark);
    themeBtn.innerHTML = OS.icon(dark ? 'sun' : 'moon');
    themeBtn.setAttribute('aria-label', dark ? 'Passer en mode clair' : 'Passer en mode sombre');
    themeBtn.title = themeBtn.getAttribute('aria-label');
  }
  themeBtn.addEventListener('click', () => { dark = !dark; OS.store('wl-site-dark', dark); paintTheme(); });
  paintTheme();

  /* ---------- Prénom (message d'accueil) ---------- */
  const nameIn = $('#site-name');
  nameIn.value = OS.load('wl-site-name', '');
  nameIn.addEventListener('change', () => {
    OS.store('wl-site-name', nameIn.value.trim().slice(0, 20));
    OS.wl.refresh(); // met à jour le message d'accueil
  });
  nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameIn.blur(); e.stopPropagation(); });

  fromHash();
})();
