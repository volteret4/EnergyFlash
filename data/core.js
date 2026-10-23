// Registro de géneros, escenas, sellos y artistas de la música rave según Energy Flash de Simon Reynolds. Cada fichero de capítulo (data/NN-*.js,
// escritos a mano leyendo el libro) llama a ENERGY.chapter({...}) y ENERGY.add([...], n).
// Los datos se fusionan por id: los arrays se unen y cada capítulo puede añadir
// discos, citas (refs) y una nota propia sobre una escena ya definida en otro.
window.ENERGY = (function () {
  const genres = new Map();
  const chapters = [];

  const FAMILIES = {
    precursores: { name: 'Precursores: disco, Kraftwerk, electro, synth pop, industrial, EBM', color: '#94a3b8' },
    detroit:     { name: 'Techno de Detroit y sus herederos', color: '#60a5fa' },
    house:       { name: 'House: Chicago, el garage de Nueva York y el house de los noventa', color: '#facc15' },
    rave:        { name: 'Acid house y rave británico: del Verano del Amor al hardcore', color: '#f472b6' },
    jungle:      { name: 'Hardcore breakbeat, jungle y drum and bass', color: '#22c55e' },
    duro:        { name: 'Hardcore europeo: techno belga, gabba, happy hardcore', color: '#ef4444' },
    ambient:     { name: 'Ambient, intelligent techno, IDM y la facción experimental', color: '#a78bfa' },
    trance:      { name: 'Trance: alemán, Goa, progressive y superclubs', color: '#2dd4bf' },
    breaks:      { name: 'Trip hop, big beat y el sampleo', color: '#fb923c' },
    garage:      { name: 'Speed garage, 2step, grime y dubstep', color: '#e879f9' },
    america:     { name: 'Estados Unidos: rave americano y EDM', color: '#38bdf8' },
    revival:     { name: 'Retro: electroclash, nu rave y microhouse', color: '#a3e635' },
    cultura:     { name: 'Cultura rave: drogas, fiestas libres, radios piratas, leyes, DJ', color: '#d6d3d1' },
  };



  const key = (t) => (t.a + '|' + t.t).toLowerCase();

  function mergeArr(a = [], b = [], k = (x) => (typeof x === 'string' ? x.toLowerCase() : JSON.stringify(x))) {
    const seen = new Set(a.map(k));
    const out = a.slice();
    for (const x of b) if (!seen.has(k(x))) { seen.add(k(x)); out.push(x); }
    return out;
  }

  // Anota en cada disco los capítulos que lo citan.
  function cite(tracks, t, ch) {
    const m = tracks.find((x) => key(x) === key(t));
    if (m && ch != null) m.chs = mergeArr(m.chs, [ch]);
  }

  function add(list, chapter) {
    for (const g of list) {
      let cur = genres.get(g.id);
      if (!cur) {
        cur = { id: g.id, aka: [], influences: [], artists: [], tracks: [], labels: [], refs: [], notes: [], chapters: [] };
        genres.set(g.id, cur);
      }
      for (const f of ['aka', 'influences', 'artists', 'labels']) cur[f] = mergeArr(cur[f], g[f]);
      cur.tracks = mergeArr(cur.tracks, (g.tracks || []).map((t) => ({ ...t })), key);
      for (const t of g.tracks || []) {
        if (t.ess) { const m = cur.tracks.find((x) => key(x) === key(t)); if (m) m.ess = 1; }
        cite(cur.tracks, t, chapter);
      }
      cur.refs = mergeArr(cur.refs, (g.refs || []).map((r) => ({ ch: chapter, ...r })), (r) => r.q);
      for (const f of ['name', 'family', 'start', 'end', 'place', 'desc']) if (g[f] != null && cur[f] == null) cur[f] = g[f];
      if (g.desc != null) cur.descCh = cur.descCh ?? chapter;
      if (g.note) cur.notes.push({ ch: chapter, text: g.note });
      if (chapter != null && !cur.chapters.includes(chapter)) cur.chapters.push(chapter);
    }
  }

  return {
    FAMILIES,
    chapters,
    genres,
    chapter(meta) { chapters.push(meta); },
    add,
  };
})();
