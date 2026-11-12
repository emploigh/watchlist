/* =========================================================
   Mini-runtime : remplace le « système d'exploitation ».
   Fournit seulement ce dont les apps Watchlist ont besoin :
   stockage, notifications, confirmation, enregistrement des apps
   et navigation (OS.openApp).
   ========================================================= */
(() => {
  'use strict';
  const OS = (window.OS = window.OS || {});

  OS.load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  };
  OS.store = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
  };

  // Profil : seulement le prénom, pour le message d'accueil
  OS.me = () => ({ name: OS.load('wl-site-name', '') });

  OS.showNotification = (message, isError = false) => {
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2600);
  };

  OS.confirm = (message, onYes) => {
    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML = `
      <div class="sheet" role="alertdialog" aria-modal="true">
        <h2>Confirmation</h2>
        <p class="sheet-msg"></p>
        <div class="sheet-actions">
          <button class="btn-outline" data-r="no">Annuler</button>
          <button class="btn danger-btn" data-r="yes">Confirmer</button>
        </div>
      </div>`;
    overlay.querySelector('.sheet-msg').textContent = message;
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', (e) => {
      const r = e.target.dataset ? e.target.dataset.r : undefined;
      if (r === 'yes') { close(); onYes(); }
      else if (r === 'no' || e.target === overlay) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    const yes = overlay.querySelector('[data-r="yes"]');
    if (yes) yes.focus();
  };

  // Ferme les petits menus déroulants ouverts (mini-lecteur…)
  OS.hideMenus = () => document.querySelectorAll('.menu-pop.open').forEach((m) => m.classList.remove('open'));

  // Les apps s'enregistrent ici ; site.js les affiche dans des pages
  OS.apps = {};
  OS.register = (key, def) => { OS.apps[key] = def; };
  OS.openApp = (key, arg) => { if (OS.route) OS.route(key, arg); };
})();
