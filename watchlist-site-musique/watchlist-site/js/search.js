/* =========================================================
   Barre de recherche fluide (Rating et À voir).
   - Ta collection s'affiche instantanément (sans accents, tolérante).
   - Les résultats en ligne (avec affiches) arrivent ensuite, sans bloquer.
   - Clavier : ↑ ↓ Entrée Échap ; "/" pour aller dans la barre.
   OS.searchBox(input, { onPick, onEnter, minRemote }) -> { close, refresh, destroy }
   onPick({ name, img, big, year, type, score, local })
   ========================================================= */
(() => {
  'use strict';

  const norm = (t) => OS.wl.norm(t);

  // Meilleur score = meilleur résultat : début du titre > début de mot > contient > lettres dans l'ordre
  function rank(title, term) {
    const t = norm(title);
    if (t === term) return 0;
    if (t.startsWith(term)) return 1;
    if (t.includes(' ' + term)) return 2;
    if (t.includes(term)) return 3;
    let i = 0;
    for (const ch of t) if (ch === term[i]) i++;
    return i === term.length && term.length > 2 ? 4 : -1;
  }

  function mark(parent, text, term) {
    const raw = text.toLowerCase();
    const i = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(term.replace(/\s+/g, ' '));
    if (i < 0 || i + term.length > text.length || raw.length !== text.length) return parent.append(text);
    parent.append(text.slice(0, i));
    const m = document.createElement('mark');
    m.textContent = text.slice(i, i + term.length);
    parent.append(m, text.slice(i + term.length));
  }

  OS.searchBox = function searchBox(input, opts = {}) {
    const { onPick, onEnter, minRemote = 2, remote = true } = opts;
    const host = input.parentElement;
    host.classList.add('wl-sb-host');

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'wl-sb-clear';
    clear.setAttribute('aria-label', 'Effacer');
    clear.tabIndex = -1;
    clear.hidden = true;
    clear.innerHTML = OS.icon('x');
    const box = document.createElement('div');
    box.className = 'wl-sb';
    box.hidden = true;
    box.setAttribute('role', 'listbox');
    host.append(clear, box);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.autocomplete = 'off';
    input.spellcheck = false;

    let items = [];      // éléments cliquables affichés (ordre clavier)
    let active = -1;
    let timer = 0;
    let ctrl = null;
    let seq = 0;
    let localItems = [];

    const setActive = (i, scroll) => {
      active = i;
      items.forEach((it, k) => it.el.classList.toggle('active', k === i));
      if (scroll && items[i]) items[i].el.scrollIntoView({ block: 'nearest' });
    };
    const open = (v) => {
      box.hidden = !v;
      input.setAttribute('aria-expanded', String(v));
    };
    const close = () => { open(false); setActive(-1); };

    function row(data, term, tag) {
      const li = document.createElement('div');
      li.className = 'wl-sb-row';
      li.setAttribute('role', 'option');
      li.appendChild(OS.covers.jacket(data.name, 'xs', data.img || null));
      const txt = document.createElement('div');
      txt.className = 'wl-sb-txt';
      const t = document.createElement('b');
      mark(t, data.name, term);
      const meta = document.createElement('small');
      meta.textContent = [data.type, data.year, data.score ? '★ ' + data.score.toFixed(1) : ''].filter(Boolean).join(' · ');
      txt.append(t);
      if (meta.textContent) txt.append(meta);
      li.append(txt);
      if (tag) { const g = document.createElement('span'); g.className = 'wl-sb-tag'; g.textContent = tag; li.append(g); }
      li.addEventListener('mousedown', (e) => { e.preventDefault(); choose(data); });
      li.addEventListener('mousemove', () => { const k = items.findIndex((x) => x.el === li); if (k !== active) setActive(k); });
      return li;
    }

    function choose(data) {
      close();
      if (data.big) OS.covers.set(data.name, data.big, 'api'); // on garde l'image du titre choisi
      onPick && onPick(data);
    }

    function head(label) {
      const h = document.createElement('div');
      h.className = 'wl-sb-head';
      h.textContent = label;
      return h;
    }

    function tagFor(name) {
      const r = OS.wl.review(name);
      if (r && OS.wl.ratedNames().includes(name)) return r.rating ? `★ ${r.rating}` : 'Noté';
      if (OS.wl.hasTodo(name)) return 'À voir';
      return '';
    }

    function renderLocal(term) {
      box.innerHTML = '';
      items = [];
      const scored = [];
      OS.wl.allTitles().forEach((n) => { const s = rank(n, term); if (s >= 0) scored.push([s, n]); });
      scored.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1], 'fr'));
      localItems = scored.slice(0, 4).map(([, n]) => n);
      if (localItems.length) {
        box.appendChild(head('Dans ta collection'));
        localItems.forEach((n) => {
          const data = { name: n, local: true };
          const el = row(data, term, tagFor(n));
          box.appendChild(el);
          items.push({ el, data });
        });
      }
    }

    function paintRemote(list, term) {
      box.querySelectorAll('.wl-sb-remote').forEach((n) => n.remove());
      const have = new Set(localItems.map((n) => norm(n)));
      const fresh = list.filter((r) => !have.has(norm(r.title)));
      if (!fresh.length) return;
      const frag = document.createElement('div');
      frag.className = 'wl-sb-remote';
      frag.appendChild(head('En ligne'));
      fresh.forEach((r) => {
        const data = { name: r.title, img: r.img, big: r.big, year: r.year, type: r.type, score: r.score };
        const el = row(data, term, '');
        frag.appendChild(el);
        items.push({ el, data });
      });
      box.appendChild(frag);
    }

    function note(text, cls) {
      box.querySelectorAll('.wl-sb-remote').forEach((n) => n.remove());
      const d = document.createElement('div');
      d.className = 'wl-sb-remote wl-sb-note ' + (cls || '');
      d.textContent = text;
      box.appendChild(d);
    }

    function skeleton() {
      const d = document.createElement('div');
      d.className = 'wl-sb-remote wl-sb-skel';
      d.innerHTML = '<span></span><span></span><span></span>';
      box.appendChild(d);
    }

    function update() {
      const raw = input.value.trim();
      const term = norm(raw);
      clear.hidden = !raw;
      clearTimeout(timer);
      if (ctrl) ctrl.abort();
      if (!term) { close(); return; }
      renderLocal(term);
      setActive(items.length ? 0 : -1);
      open(true);
      if (!remote || term.length < minRemote) {
        if (!items.length) { note('Appuie sur Entrée pour utiliser ce titre.'); }
        return;
      }
      const my = ++seq;
      skeleton();
      timer = setTimeout(async () => {
        ctrl = new AbortController();
        try {
          const list = await OS.covers.search(raw, { limit: 6, signal: ctrl.signal });
          if (my !== seq) return;
          box.querySelectorAll('.wl-sb-skel').forEach((n) => n.remove());
          if (list.length) paintRemote(list, term);
          else if (!items.length) note('Aucun résultat. Entrée pour utiliser ce titre.');
          if (active < 0 && items.length) setActive(0);
        } catch (e) {
          if (e.name === 'AbortError' || my !== seq) return;
          box.querySelectorAll('.wl-sb-skel').forEach((n) => n.remove());
          note(items.length ? 'Recherche en ligne indisponible.' : 'Hors ligne : Entrée pour utiliser ce titre.', 'bad');
        }
      }, 230);
    }

    input.addEventListener('input', update);
    input.addEventListener('focus', () => { input.select(); if (input.value.trim()) update(); });
    input.addEventListener('blur', () => setTimeout(close, 140));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (box.hidden) update();
        if (!items.length) return;
        const d = e.key === 'ArrowDown' ? 1 : -1;
        setActive((active + d + items.length) % items.length, true);
      } else if (e.key === 'Escape') {
        if (!box.hidden) { e.stopPropagation(); close(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const typed = norm(input.value);
        const exact = items.find((it) => norm(it.data.name) === typed);
        const target = !box.hidden && (exact || items[active]);
        if (target) choose(target.data);
        else if (onEnter) { close(); onEnter(input.value.trim()); }
      }
    });
    clear.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = '';
      update();
      input.focus();
      opts.onClear && opts.onClear();
    });

    return {
      close,
      refresh: update,
      setValue(v) { input.value = v; clear.hidden = !v; close(); },
      destroy() { clearTimeout(timer); if (ctrl) ctrl.abort(); box.remove(); clear.remove(); },
    };
  };
})();
