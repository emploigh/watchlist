/* =========================================================
   Application À voir (ToWatch) : liste des animés à regarder, cochés quand vus.
   ========================================================= */
(() => {
  'use strict';

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  OS.register('avoir', {
    title: 'À voir',
    icon: 'avoir',
    width: 640,
    height: 640,
    desk: true,
    build(body) {
      body.innerHTML = `
        <div class="wlapp wl-avoir">
          <div class="wl-scroll">
            <div class="Scrollcontainer">
              <h1>
                <img class="logo-image" src="image/logo/blogo.png" alt="" width="10%">
                <span class="dela-gothic-text" style="font-size: 50pt;">ToWatch</span>
              </h1>
              <div id="banane-form">
                <input type="text" id="anime-input" maxlength="60" placeholder="Ajouter un anime…  ( / )" autocomplete="off">
                <button class="modern-button" data-act="add">Ajouter</button>
              </div>
              <div class="wl-toolbar">
                <div class="wl-chips wl-tabs"></div>
                <span class="wl-toolbar-r">
                  <button class="wl-ghost" data-act="clean" type="button" hidden>${OS.icon('check')} Retirer les vus</button>
                  <button class="wl-ghost" data-act="dice" type="button">${OS.icon('dice')} Surprends-moi</button>
                </span>
              </div>
              <div class="wl-progress" hidden><span class="wl-progress-fill"></span></div>
              <p class="wl-summary"></p>
              <ul class="anime-list"></ul>
            </div>
          </div>
        </div>`;

      const root = body.querySelector('.wl-avoir');
      const input = root.querySelector('#anime-input');
      const rows = root.querySelector('.anime-list');

      function todoRow(item, i) {
        const li = el('li', 'anime-item');

        const circle = el('button', 'circle' + (item.completed ? ' completed' : ''));
        circle.type = 'button';
        circle.setAttribute('aria-label', 'Marquer comme vu');
        circle.addEventListener('click', () => OS.wl.toggleTodo(i));

        const jb = el('button', 'wl-row-jacket');
        jb.type = 'button';
        jb.title = 'Changer la jaquette';
        jb.appendChild(OS.covers.jacket(item.name, 'sm'));
        jb.addEventListener('click', () => OS.covers.editor(item.name));

        const name = el('span', 'name', item.name);
        name.title = 'Double-clic pour renommer';
        name.addEventListener('dblclick', () => {
          const inp = el('input', 'wl-rename');
          inp.value = item.name;
          inp.maxLength = 60;
          name.replaceWith(inp);
          inp.focus();
          inp.select();
          let done = false;
          const finish = (ok) => {
            if (done) return;
            done = true;
            if (ok && inp.value.trim() && inp.value.trim() !== item.name) {
              const old = item.name;
              if (OS.wl.renameTodo(i, inp.value)) {
                const prev = OS.covers.get(old);
                if (prev && !OS.covers.get(inp.value.trim())) OS.covers.set(inp.value.trim(), prev, OS.covers.source(old) || 'api');
                return;
              }
              OS.showNotification('Nom vide ou déjà utilisé.', true);
            }
            render();
          };
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') { e.stopPropagation(); finish(false); } });
          inp.addEventListener('blur', () => finish(true));
        });

        const del = el('button', 'delete-btn', 'Supprimer');
        del.type = 'button';
        del.addEventListener('click', () => {
          const gone = OS.wl.removeTodo(i);
          OS.undoToast(`« ${item.name} » retiré`, () => OS.wl.restoreTodo(gone));
        });

        const pin = el('button', 'wl-pin' + (item.pin ? ' on' : ''));
        pin.type = 'button';
        pin.title = item.pin ? 'Désépingler' : 'Épingler en haut';
        pin.setAttribute('aria-pressed', String(!!item.pin));
        pin.innerHTML = OS.icon('pin');
        pin.addEventListener('click', () => OS.wl.togglePin(i));

        li.dataset.i = i;
        li.append(circle, jb, name, pin);
        if (item.completed) {
          const rate = el('button', 'wl-ghost wl-rate', 'Noter');
          rate.type = 'button';
          rate.addEventListener('click', () => OS.openApp('rating', item.name));
          li.appendChild(rate);
        }
        li.appendChild(del);
        return li;
      }

      let tab = 'pending';
      const TABS = [['pending', 'À voir'], ['done', 'Vus'], ['all', 'Tout']];
      const tabs = root.querySelector('.wl-tabs');
      TABS.forEach(([v, label]) => {
        const b = el('button', 'wl-chip', label);
        b.type = 'button';
        b.dataset.v = v;
        b.addEventListener('click', () => { tab = v; render(); });
        tabs.appendChild(b);
      });

      function render() {
        rows.innerHTML = '';
        const list = OS.wl.todo();
        const done = list.filter((t) => t.completed).length;
        tabs.querySelectorAll('.wl-chip').forEach((b) => b.classList.toggle('on', b.dataset.v === tab));
        const bar = root.querySelector('.wl-progress');
        bar.hidden = !list.length;
        bar.firstElementChild.style.width = `${list.length ? (done / list.length) * 100 : 0}%`;
        root.querySelector('[data-act="clean"]').hidden = !done;
        root.querySelector('.wl-summary').textContent = list.length ? `${done} vu${done > 1 ? 's' : ''} sur ${list.length}` : '';
        const shown = list.map((item, i) => [item, i]).filter(([it]) => tab === 'all' || (tab === 'done') === it.completed);
        if (!shown.length) {
          rows.appendChild(el('li', 'wl-empty', !list.length ? 'Votre liste « à voir » est vide.' : tab === 'done' ? 'Rien de vu pour le moment.' : 'Tout est vu, bravo !'));
        }
        shown.sort((a, b) => (b[0].pin ? 1 : 0) - (a[0].pin ? 1 : 0)); // épinglés en haut (ordre conservé sinon)
        shown.forEach(([item, i]) => rows.appendChild(todoRow(item, i)));
      }

      // Tirage au sort parmi les titres encore à voir
      root.querySelector('[data-act="dice"]').addEventListener('click', () => {
        const pool = OS.wl.todo().map((t, i) => [t, i]).filter(([t]) => !t.completed);
        if (!pool.length) return OS.showNotification('Rien à tirer au sort : ajoutez des titres.', true);
        if (tab === 'done') { tab = 'pending'; render(); }
        const [item, i] = pool[Math.floor(Math.random() * pool.length)];
        const li = rows.querySelector(`li[data-i="${i}"]`);
        if (li) { li.classList.remove('wl-pick'); void li.offsetWidth; li.classList.add('wl-pick'); li.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        OS.showNotification(`Ce soir : « ${item.name} » 🎲`);
      });

      function add(raw) {
        const name = String(raw == null ? input.value : raw).trim().slice(0, 60);
        if (!name) return OS.showNotification('Saisissez un nom.', true);
        if (OS.wl.hasTodo(name)) return OS.showNotification('Cet anime est déjà dans la liste.', true);
        OS.wl.addTodo(name);
        sb.setValue('');
        input.value = '';
        if (tab === 'done') { tab = 'pending'; render(); }
        OS.showNotification(`« ${name} » ajouté à votre liste.`);
      }

      const sb = OS.searchBox(input, { onPick: (it) => add(it.name), onEnter: (name) => add(name) });
      root.querySelector('[data-act="add"]').addEventListener('click', () => add());

      root.querySelector('[data-act="clean"]').addEventListener('click', () => {
        const gone = OS.wl.clearSeen();
        if (gone.length) OS.undoToast(`${gone.length} titre${gone.length > 1 ? 's' : ''} vu${gone.length > 1 ? 's' : ''} retiré${gone.length > 1 ? 's' : ''}`, () => OS.wl.restoreMany(gone));
      });
      root.addEventListener('keydown', (e) => {
        if (e.key === '/' && !(e.target.matches && e.target.matches('input, textarea'))) { e.preventDefault(); input.focus(); }
      });

      const unsubscribe = OS.wl.subscribe(render);
      render();
      return { onClose: unsubscribe };
    },
  });
})();
