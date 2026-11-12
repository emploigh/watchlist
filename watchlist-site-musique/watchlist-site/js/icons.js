/* =========================================================
   Icônes personnalisées Watchlist OS — style « duotone ».
   Chaque icône = un trait arrondi + un aplat translucide (currentColor),
   avec un petit accent d'angle repris du logo W/A.
   OS.icon('home') renvoie le SVG ; il prend la couleur du texte
   (currentColor) et la taille de la police (1em).
   Les noms sont identiques à l'ancien jeu : remplacement direct.
   ========================================================= */
(() => {
  'use strict';

  // aplat translucide appliqué à une forme (garde aussi le trait)
  const D = ' class="d"';
  // aplat plein (points, accents)
  const S = ' fill="currentColor" stroke="none"';

  const ICONS = {
    /* ---------- Applications ---------- */
    finder: `<rect x="3" y="4" width="18" height="16" rx="4"${D}/><path d="M12 4v7.5M8 8.5v2.2M16 8.5v2.2M7.5 15c1.2 1.6 2.8 2.4 4.5 2.4s3.3-.8 4.5-2.4"/>`,
    home: `<path d="M3.5 10.8 12 3.5l8.5 7.3V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"${D}/><path d="M9.8 21v-5.5a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1V21"/><circle cx="17.6" cy="5.6" r="1.1"${S}/>`,
    rating: `<path d="m12 2.9 2.7 5.7 6.2.8-4.5 4.3 1.1 6.2L12 17l-5.5 2.9 1.1-6.2L3.1 9.4l6.2-.8z"${D}/>`,
    liste: `<rect x="3.5" y="3.5" width="17" height="17" rx="4"${D}/><path d="M9.2 8.2h6.3M9.2 12h6.3M9.2 15.8h6.3"/><path d="M6.6 8.2h.01M6.6 12h.01M6.6 15.8h.01" stroke-width="2.6"/>`,
    avoir: `<path d="M2.2 12S5.6 5.4 12 5.4 21.8 12 21.8 12 18.4 18.6 12 18.6 2.2 12 2.2 12z"${D}/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="1"${S}/>`,
    music: `<path d="M9 17.5V5.2l11.5-2.1V15"/><circle cx="6.2" cy="17.5" r="3"${D}/><circle cx="17.7" cy="15.4" r="3"${D}/><path d="M9 9l11.5-2.1" stroke-width="1.4" opacity=".7"/>`,
    settings: `<path d="M4 7h8M17 7h3M4 17h3M12 17h8"/><circle cx="14.6" cy="7" r="2.4"${D}/><circle cx="9.4" cy="17" r="2.4"${D}/>`,
    sliders: `<path d="M4 7h8M17 7h3M4 17h3M12 17h8"/><circle cx="14.6" cy="7" r="2.4"${D}/><circle cx="9.4" cy="17" r="2.4"${D}/>`,
    trash: `<path d="M5.6 7.5 6.8 19a1.5 1.5 0 0 0 1.5 1.3h7.4a1.5 1.5 0 0 0 1.5-1.3l1.2-11.5z"${D}/><path d="M3.8 7.5h16.4M9.2 7.5V5a1 1 0 0 1 1-1h3.6a1 1 0 0 1 1 1v2.5M10 11.5v5M14 11.5v5"/>`,
    notes: `<path d="M5.5 3.5h9.8L19.5 7.7V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z"${D}/><path d="M15 3.8V8h4.2M8.3 12h7.4M8.3 15.8h5"/>`,

    /* ---------- Éléments / fichiers ---------- */
    info: `<circle cx="12" cy="12" r="9"${D}/><path d="M12 11v5.2"/><circle cx="12" cy="7.9" r="1.1"${S}/>`,
    folder: `<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.7a2 2 0 0 1 1.5.7L12 7h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"${D}/><path d="M3 10.5h18"/>`,
    file: `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"${D}/><path d="M14 3v4a1 1 0 0 0 1 1h4"/>`,
    text: `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"${D}/><path d="M14 3v4a1 1 0 0 0 1 1h4M9 12.5h6M9 16.5h6"/>`,
    table: `<rect x="3" y="4" width="18" height="16" rx="3"${D}/><path d="M3 9.8h18M3 15h18M9.3 9.8V20"/>`,
    image: `<rect x="3" y="4" width="18" height="16" rx="3.5"${D}/><circle cx="8.8" cy="9.5" r="1.7"${S}/><path d="m21 16-4.6-4.6a1 1 0 0 0-1.4 0L7 19.4"/>`,
    archive: `<rect x="3" y="4" width="18" height="5.2" rx="1.6"${D}/><path d="M5 9.2V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.2M10 13h4"/>`,
    monitor: `<rect x="3" y="4" width="18" height="12.5" rx="3"${D}/><path d="M8.5 20.2h7M12 16.5v3.7"/>`,
    download: `<path d="M12 3.8v11.2M7.2 10.6 12 15.4l4.8-4.8"/><path d="M4.5 16.5v1.8A1.7 1.7 0 0 0 6.2 20h11.6a1.7 1.7 0 0 0 1.7-1.7v-1.8"${D}/>`,
    palette: `<path d="M12 3a9 9 0 1 0 0 18c1.6 0 2.2-1.1 1.7-2.2-.5-1.2.3-2.4 1.6-2.4H17a4 4 0 0 0 4-4C21 6.7 17 3 12 3z"${D}/><circle cx="7.6" cy="11.2" r="1.15"${S}/><circle cx="10.2" cy="7.4" r="1.15"${S}/><circle cx="15.2" cy="7.8" r="1.15"${S}/>`,
    users: `<circle cx="9" cy="8.2" r="3.4"${D}/><path d="M2.6 20a6.4 6.4 0 0 1 12.8 0"/><path d="M15.8 4.9a3.4 3.4 0 0 1 0 6.6M18 14.2a6.4 6.4 0 0 1 3.4 5.8"/>`,
    user: `<circle cx="12" cy="8" r="4"${D}/><path d="M4.2 21a7.8 7.8 0 0 1 15.6 0"/>`,
    database: `<ellipse cx="12" cy="5.8" rx="8" ry="3"${D}/><path d="M4 5.8v12.4c0 1.7 3.6 3 8 3s8-1.3 8-3V5.8M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>`,
    anime: `<circle cx="12" cy="12" r="9"${D}/><path d="m10.2 8.7 5 3.3-5 3.3z" fill="currentColor"/>`,
    book: `<path d="M4 19.2A2.5 2.5 0 0 1 6.5 16.7H20V3.5H6.5A2.5 2.5 0 0 0 4 6z"${D}/><path d="M6.5 16.7a2.4 2.4 0 0 0 0 4.8H20v-4.8"/>`,
    chat: `<path d="M5.5 4.5h13A1.5 1.5 0 0 1 20 6v9a1.5 1.5 0 0 1-1.5 1.5H10L5 20.5v-4H5.5A1.5 1.5 0 0 1 4 15V6a1.5 1.5 0 0 1 1.5-1.5z"${D}/><path d="M8.5 9h7M8.5 12.2h4.2"/>`,

    /* ---------- Actions ---------- */
    x: '<path d="m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8"/>',
    check: '<path d="m5 12.8 4.4 4.4L19 7.4"/>',
    arrow: '<path d="M5 12h14M13.2 6.2 19 12l-5.8 5.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: `<path d="M4 20h3.8L19.2 8.6a2.7 2.7 0 0 0-3.8-3.8L4 16.2z"${D}/><path d="m13.2 7 3.8 3.8"/>`,
    'doc-plus': `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"${D}/><path d="M14 3v4a1 1 0 0 0 1 1h4M12 11.6v5.2M9.4 14.2h5.2"/>`,
    'folder-plus': `<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.7a2 2 0 0 1 1.5.7L12 7h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"${D}/><path d="M12 10.6v5.2M9.4 13.2h5.2"/>`,
    refresh: '<path d="M20 11.2A8 8 0 0 0 5.6 7M4.2 3.8V7.6H8"/><path d="M4 12.8A8 8 0 0 0 18.4 17M19.8 20.2v-3.8H16"/>',
    moon: `<path d="M20 14.6A8 8 0 0 1 9.4 4a8 8 0 1 0 10.6 10.6z"${D}/>`,
    sun: `<circle cx="12" cy="12" r="4.2"${D}/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>`,
    lock: `<rect x="4.5" y="10.5" width="15" height="10" rx="3"${D}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15.5" r="1.1"${S}/>`,
    chevron: '<path d="m9.2 6.2 5.8 5.8-5.8 5.8"/>',
    grid: `<rect x="3.5" y="3.5" width="7" height="7" rx="2"${D}/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"${D}/>`,
    'snap-left': `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16"/><path d="M6 4h6v16H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="currentColor" stroke="none" opacity=".5"/>`,
    'snap-right': `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16"/><path d="M12 4h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-6z" fill="currentColor" stroke="none" opacity=".5"/>`,
    'snap-tl': `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16M3 12h18"/><path d="M6 4h6v8H3V7a3 3 0 0 1 3-3z" fill="currentColor" stroke="none" opacity=".5"/>`,
    'snap-tr': `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16M3 12h18"/><path d="M12 4h6a3 3 0 0 1 3 3v5h-9z" fill="currentColor" stroke="none" opacity=".5"/>`,
    'snap-bl': `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16M3 12h18"/><path d="M3 12h9v8H6a3 3 0 0 1-3-3z" fill="currentColor" stroke="none" opacity=".5"/>`,
    'snap-br': `<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16M3 12h18"/><path d="M12 12h9v5a3 3 0 0 1-3 3h-6z" fill="currentColor" stroke="none" opacity=".5"/>`,
    play: '<path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.4-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z" fill="currentColor"/>',
    search: `<circle cx="10.8" cy="10.8" r="6.6"${D}/><path d="m20 20-4.6-4.6"/>`,
    timer: `<circle cx="12" cy="13.5" r="7.5"${D}/><path d="M12 9.6v4.1l2.6 1.6M9.5 3h5"/>`,
    pin: `<path d="M8.8 4h6.4l-.9 6.2 3 3.1H6.7l3-3.1z"${D}/><path d="M12 13.3V20.5"/>`,
    clock: `<circle cx="12" cy="12" r="9"${D}/><path d="M12 7v5.2l3.5 2"/>`,
    type: '<path d="M5 6.5V4.5h14v2M12 4.5v15M9 19.5h6"/>',
    heart: `<path d="M12 20.4s-8.2-4.9-8.2-11A4.7 4.7 0 0 1 12 6.9a4.7 4.7 0 0 1 8.2 2.5c0 6.1-8.2 11-8.2 11z"${D}/>`,
    dice: `<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"${D}/><circle cx="8.6" cy="8.6" r="1.25"${S}/><circle cx="15.4" cy="8.6" r="1.25"${S}/><circle cx="12" cy="12" r="1.25"${S}/><circle cx="8.6" cy="15.4" r="1.25"${S}/><circle cx="15.4" cy="15.4" r="1.25"${S}/>`,
    eye: `<path d="M2.2 12S5.6 5.4 12 5.4 21.8 12 21.8 12 18.4 18.6 12 18.6 2.2 12 2.2 12z"${D}/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="1"${S}/>`,
  };

  window.OS = window.OS || {};
  OS.icon = (name) => `<svg class="svg-ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.file}</svg>`;
  OS.iconNames = Object.keys(ICONS);
})();
