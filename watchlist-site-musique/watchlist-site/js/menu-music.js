/* =========================================================
   Musique dans la barre de menus : mini lecteur
   Pilote le même lecteur que l'application Musique (OS.player).
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const btn = $('#music-btn');
  const pop = $('#music-menu');
  if (!btn || !pop || !OS.player) return;

  const cover = $('#mm-cover');
  const title = $('#mm-title');
  const artist = $('#mm-artist');
  const fill = $('#mm-fill');
  const toggle = $('#mm-toggle');

  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" fill="currentColor"/></svg>';

  function render() {
    const song = OS.player.song();
    const playing = OS.player.isPlaying();
    const { cur, dur } = OS.player.progress();

    if (cover.getAttribute('src') !== song.cover) cover.src = song.cover;
    pop.style.setProperty('--cover', `url("${new URL(song.cover, document.baseURI).href}")`); // lueur de la pochette (liquid glass)
    title.textContent = song.title;
    artist.textContent = song.artist;
    fill.style.width = dur ? `${Math.min(100, (cur / dur) * 100)}%` : '0%';
    toggle.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    toggle.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
  }

  btn.addEventListener('click', () => {
    const wasOpen = pop.classList.contains('open');
    OS.hideMenus();
    if (!wasOpen) {
      pop.classList.add('open');
      render();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#music-wrap, #music-menu')) pop.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pop.classList.remove('open');
  });

  $('#mm-prev').addEventListener('click', () => OS.player.prev());
  toggle.addEventListener('click', () => OS.player.toggle());
  $('#mm-next').addEventListener('click', () => OS.player.next());
  $('#mm-open').addEventListener('click', () => {
    pop.classList.remove('open');
    OS.openApp('music');
  });

  window.addEventListener('wl:player', render);
  render();
})();
