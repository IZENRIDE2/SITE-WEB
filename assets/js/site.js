/* ===== Écrans de l'application =====
   Pour publier de nouveaux écrans : déposez les images (540 × 1119 px conseillé, en .webp ou .jpg)
   dans assets/screens/ puis modifiez, ajoutez ou retirez des lignes ci-dessous.
   L'ordre de la liste est l'ordre d'affichage. */
const SCREENS = [
  { file: "v319-bienvenue.webp",   name: "Bienvenue",       desc: "Écran d'accueil : présentation des croisements et de la zone de confidentialité." },
  { file: "v319-carte.webp",       name: "Carte",           desc: "Accès direct à l'itinéraire, aux croisements, au partage de position, au SOS et aux stations." },
  { file: "v319-itineraire.webp",  name: "Itinéraire",      desc: "Saisie du départ, de l'arrivée et des étapes avant le guidage vocal." },
  { file: "v319-croisements.webp", name: "Croisements",     desc: "Les riders croisés, sur la même route ou au même endroit, avec leur moto (photos de profil d'illustration)." },
  { file: "v319-match.webp",       name: "Match",           desc: "Mise en relation avec des riders selon votre style de conduite (photo de profil d'illustration)." },
  { file: "v319-groupe.webp",      name: "Groupe",          desc: "Discussion de groupe avec proposition de sortie et réponses de chaque membre (photos de profil d'illustration)." },
  { file: "v319-agenda.webp",      name: "Sorties",         desc: "Agenda des balades, expositions, salons et rassemblements à venir." },
  { file: "v319-profil.webp",      name: "Profil",          desc: "Statistiques de sorties et de kilomètres, riders croisés et « Mon code »." },
  { file: "v319-precision.webp",   name: "Précision",       desc: "Réglage de la précision de votre position : 50 m, 500 m ou 5 km." },
  { file: "v319-hors-ligne.webp",  name: "Hors ligne",      desc: "Téléchargement des régions pour utiliser la carte et le guidage sans réseau." },
  { file: "v319-premium.webp",     name: "Premium",         desc: "Comparatif des offres Gratuit et Premium." }
];

const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const css = getComputedStyle(document.documentElement);
const tok = n => css.getPropertyValue(n).trim();

/* ===== Hero : simulation GPS IzenRide =====
   Un rider roule avec le guidage actif. Le réseau routier est généré au fil du trajet :
   rues, carrefours, ronds-points, départementales et lacets de col. Les options de l'app
   sont à l'écran : manœuvres, guidage vocal, limitation, heure d'arrivée et étapes,
   stations, sorties, riders à proximité, croisements, zone de confidentialité, SOS et partage.
   Tout est simulé : aucune donnée réelle. */
const ride = { speed: 0, vel: 0, lastY: scrollY, heading: 0, lean: 0, dist: 0, visible: false };
(function navSim(){
  const $id = id => document.getElementById(id);
  const cv = $id("road"), ctx = cv.getContext("2d"), hero = cv.parentElement;
  const UI = {
    box: $id("gpsUi"), arrow: $id("gArrowPath"), exit: $id("gExit"), dist: $id("gDist"), text: $id("gText"), street: $id("gStreet"),
    eta: $id("gEtaTime"), etaMin: $id("gEtaMin"), etaKm: $id("gEtaKm"), dest: $id("gDest"), limit: $id("gLimit"),
    cur: $id("gCur"), voice: $id("gVoice"), toast: $id("gToast"), cross: $id("navToast"), riders: $id("gRiders")
  };
  let W = 0, H = 0, DPR = 1, Z = 1.6, AXF = .5, AYF = .62, visible = true;
  let muted = false, showRiders = true;

  // --- hasard reproductible
  let seed = 20261011;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = a => a[Math.floor(rnd() * a.length)];

  // --- état du générateur (mètres ; x vers l'est, y vers le sud)
  const STEP = 4, NORTH = -Math.PI / 2;
  const pts = [], queue = [], events = [];
  const F = { forest: [], fields: [], blocks: [], streets: [], rings: [], labels: [], pois: [], roam: [], marks: [] };
  let gx = 0, gy = 0, ga = NORTH, gs = 0;
  const ZONES = ["village", "campagne", "foret", "col", "village", "foret", "campagne"];
  const LIMIT = { village: 50, campagne: 80, foret: 80, col: 80 };
  const TOWNS = ["Gémenos", "Cuges-les-Pins", "Plan-d'Aups", "Signes", "Le Castellet", "Roquevaire"];
  const STREETS = ["Avenue de la Gare", "Rue Victor Hugo", "Boulevard Gambetta", "Rue de la République", "Avenue Jean Jaurès", "Rue du Moulin", "Chemin de Saint-Jean", "Rue des Écoles", "Avenue des Platanes", "Rue Pasteur", "Cours Foch", "Rue de l'Église"];
  const DROADS = ["D2", "D396", "D80", "D1", "D559", "D8N"];
  let zi = 0, zone = "village", zoneLeft = 900, ti = 0, sti = 0, di = 0, curName = "Avenue de la Gare", lastTurn = 0, eventPlaced = false;
  const nextStreet = () => STREETS[sti++ % STREETS.length];
  const nextD = () => DROADS[di++ % DROADS.length];

  const tan = a => ({ x: Math.cos(a), y: Math.sin(a) });
  const nrm = a => ({ x: -Math.sin(a), y: Math.cos(a) }); // normale à droite

  function street(s, x, y, ang, len, name, opts = {}){
    const line = [[x, y]], wob = opts.wobble ?? (zone === "village" ? .06 : .25);
    let a = ang;
    for (let d = 0; d < len; d += 30){ a += (rnd() - .5) * wob; x += Math.cos(a) * 30; y += Math.sin(a) * 30; line.push([x, y]); }
    const st = { s, line, name, major: !!opts.major };
    F.streets.push(st);
    if (name && len > 120){ const m = line[Math.floor(line.length / 2)]; F.labels.push({ s, x: m[0], y: m[1], text: name, kind: opts.major ? "road" : "street" }); }
    if (zone === "village" && !opts.bare){
      for (let i = 1; i < Math.min(line.length - 1, 6); i++){
        const [x0, y0] = line[i], [x1, y1] = line[i + 1], aa = Math.atan2(y1 - y0, x1 - x0), n = nrm(aa);
        [-1, 1].forEach(side => { if (rnd() < .75){ const lat = side * (17 + rnd() * 10); F.blocks.push({ s, x: x0 + n.x * lat, y: y0 + n.y * lat, w: 11 + rnd() * 10, h: 9 + rnd() * 8, a: aa }); } });
      }
    }
    if (zone === "village" && rnd() < .35) F.roam.push({ s, line, t: rnd(), v: (.05 + rnd() * .06) * (rnd() < .5 ? -1 : 1) });
    return st;
  }
  function crossing(p){ // carrefour : une rue traverse l'itinéraire
    const n = nrm(p.a), name = zone === "village" ? nextStreet() : nextD();
    const L1 = (zone === "village" ? 120 : 260) + rnd() * 200, L2 = (zone === "village" ? 120 : 260) + rnd() * 200;
    street(p.s, p.x, p.y, Math.atan2(n.y, n.x), L1, name, { major: zone !== "village" });
    street(p.s, p.x, p.y, Math.atan2(-n.y, -n.x), L2, null, { major: zone !== "village" });
  }
  function junctionTurn(p, dir, R){ // tourne : la rue quittée continue, l'autre côté existe aussi
    const t = tan(p.a), n = nrm(p.a), J = { x: p.x + t.x * R, y: p.y + t.y * R };
    street(p.s, J.x, J.y, p.a, 140 + rnd() * 160, null, { major: zone !== "village", bare: zone !== "village" });
    street(p.s, J.x, J.y, Math.atan2(-dir * n.y, -dir * n.x), 140 + rnd() * 180, zone === "village" ? nextStreet() : null, { major: zone !== "village" });
  }
  function ring(p, R){ // rond-point : anneau et branches
    const n = nrm(p.a), C = { x: p.x - n.x * R, y: p.y - n.y * R };
    F.rings.push({ s: p.s, x: C.x, y: C.y, r: R });
    const a0 = Math.atan2(p.y - C.y, p.x - C.x);
    for (let k = 0; k < 4; k++){
      const a = a0 + k * Math.PI / 2 + Math.PI / 4;
      street(p.s, C.x + Math.cos(a) * R, C.y + Math.sin(a) * R, a, 100 + rnd() * 140, k === 1 ? nextStreet() : null, { bare: false });
    }
  }
  function buildingsAlong(p, len){
    if (zone !== "village") return;
    const t = tan(p.a), n = nrm(p.a);
    for (let d = 8; d < len; d += 15){
      [-1, 1].forEach(side => { if (rnd() < .78){ const lat = side * (18 + rnd() * 9); F.blocks.push({ s: p.s + d, x: p.x + t.x * d + n.x * lat, y: p.y + t.y * d + n.y * lat, w: 11 + rnd() * 6, h: 10 + rnd() * 9, a: p.a }); } });
    }
  }

  function plan(){
    const drift = ga - NORTH;
    const dirTo = () => drift > .5 ? -1 : drift < -.5 ? 1 : (rnd() < .5 ? -1 : 1);
    if (zone === "village"){
      const r = rnd();
      if (r < .42 || gs - lastTurn < 160){
        const len = 60 + rnd() * 50;
        queue.push({ len, k: 0, start: p => { crossing(p); buildingsAlong(p, len); } });
      } else if (r < .78){
        const dir = dirTo(), name = nextStreet(), R = 10;
        queue.push({ len: 60 + rnd() * 40, k: 0, start: p => buildingsAlong(p, 90) });
        queue.push({ len: Math.PI / 2 * R, k: dir / R, start: p => { junctionTurn(p, dir, R); events.push({ s: p.s, kind: "turn", dir, street: name }); curName = name; lastTurn = p.s; } });
      } else {
        const exit = drift < -.5 ? 2 : (rnd() < .55 ? 2 : 3), around = exit === 2 ? 80 : 170, name = nextStreet(), R = 14, r2 = 9;
        queue.push({ len: 70, k: 0, start: p => buildingsAlong(p, 60) });
        queue.push({ len: 40 / 180 * Math.PI * r2, k: 1 / r2, start: p => events.push({ s: p.s, kind: "round", exit, dir: exit === 2 ? 0 : -1, street: name }) });
        queue.push({ len: around / 180 * Math.PI * R, k: -1 / R, start: p => { ring(p, R); curName = name; lastTurn = p.s; } });
        queue.push({ len: 40 / 180 * Math.PI * r2, k: 1 / r2 });
      }
    } else if (zone === "col"){
      const R = 24 + rnd() * 12, d = rnd() < .5 ? 1 : -1;
      queue.push({ len: 50 + rnd() * 50, k: 0 }, { len: Math.PI * R, k: d / R }, { len: 60 + rnd() * 50, k: 0 }, { len: Math.PI * R, k: -d / R });
    } else {
      const r = rnd();
      if (r < .14 && gs - lastTurn > 600){
        const dir = dirTo(), name = nextD(), R = 16;
        queue.push({ len: 90, k: 0 });
        queue.push({ len: Math.PI / 2 * R, k: dir / R, start: p => { junctionTurn(p, dir, R); events.push({ s: p.s, kind: "turn", dir, street: name }); curName = name; lastTurn = p.s; } });
      } else if (r < .4){
        queue.push({ len: 120 + rnd() * 200, k: 0, start: p => crossing(p) });
      } else {
        const R = 130 + rnd() * 240; let d = rnd() < .5 ? 1 : -1;
        if (Math.abs(drift) > .7) d = -Math.sign(drift);
        queue.push({ len: (.4 + rnd() * .9) * R, k: d / R });
      }
    }
  }
  function onZone(p){
    if (zone === "village"){
      const n = nrm(p.a);
      F.labels.push({ s: p.s, x: p.x + n.x * 110, y: p.y + n.y * 110, text: TOWNS[ti++ % TOWNS.length], kind: "town" });
      curName = nextStreet(); eventPlaced = false;
    } else {
      if (!/^D/.test(curName)) curName = nextD();
      if (zone === "col"){ const n = nrm(p.a); F.labels.push({ s: p.s, x: p.x + n.x * 80, y: p.y + n.y * 80, text: "Col de l'Espigoulier", kind: "col" }); curName = "Route du Col"; }
    }
  }
  function decorate(p){
    const n = nrm(p.a), t = tan(p.a);
    const at2 = (lat, lon) => ({ x: p.x + n.x * lat + t.x * lon, y: p.y + n.y * lat + t.y * lon });
    if (zone === "village"){
      if (rnd() < .14){ const side = rnd() < .5 ? -1 : 1, c = at2(side * 34, 0); F.pois.push({ s: p.s, x: c.x, y: c.y, type: "fuel", price: (1.84 + rnd() * .14).toFixed(2).replace(".", ",") }); }
      if (!eventPlaced && rnd() < .2){ eventPlaced = true; const c = at2((rnd() < .5 ? -1 : 1) * 60, 20); F.pois.push({ s: p.s, x: c.x, y: c.y, type: "event", text: pick(["Sortie du dimanche", "Café moto", "Balade des cols"]), sub: (8 + Math.floor(rnd() * 20)) + " inscrits" }); }
    } else if (zone === "campagne"){
      for (let i = 0; i < 3; i++){ const side = rnd() < .5 ? -1 : 1, w = 60 + rnd() * 90, c = at2(side * (w / 2 + 30 + rnd() * 140), (rnd() - .5) * 100); F.fields.push({ s: p.s, x: c.x, y: c.y, w, h: 50 + rnd() * 90, a: p.a + (rnd() - .5) * .6 }); }
      if (rnd() < .08){ const c = at2((rnd() < .5 ? -1 : 1) * 30, 0); F.pois.push({ s: p.s, x: c.x, y: c.y, type: "fuel", price: (1.84 + rnd() * .14).toFixed(2).replace(".", ",") }); }
    } else {
      const count = zone === "col" ? 3 : 5;
      for (let i = 0; i < count; i++){ const side = rnd() < .5 ? -1 : 1, r = 30 + rnd() * 70, c = at2(side * (r + 24 + rnd() * 220), (rnd() - .5) * 100); F.forest.push({ s: p.s, x: c.x, y: c.y, r }); }
    }
  }
  function extend(){
    if (!queue.length) plan();
    const seg = queue[0];
    if (!seg.started){ seg.started = true; if (seg.start) seg.start({ x: gx, y: gy, a: ga, s: gs }); }
    const ds = Math.min(STEP, seg.len);
    ga += seg.k * ds; gx += Math.cos(ga) * ds; gy += Math.sin(ga) * ds; gs += ds;
    seg.len -= ds; if (seg.len <= 1e-3) queue.shift();
    pts.push({ x: gx, y: gy, a: ga, s: gs, k: seg.k, zone, name: curName });
    zoneLeft -= ds;
    if (zoneLeft <= 0 && queue.length === 0){ zi = (zi + 1) % ZONES.length; zone = ZONES[zi]; zoneLeft = zone === "col" ? 1100 : zone === "village" ? 1000 + rnd() * 500 : 700 + rnd() * 600; onZone(pts[pts.length - 1]); }
    if (pts.length % 30 === 0) decorate(pts[pts.length - 1]);
  }
  function at(s){
    const i = (s - pts[0].s) / STEP, i0 = Math.max(0, Math.min(pts.length - 2, Math.floor(i))), f = Math.min(1, Math.max(0, i - i0));
    const A = pts[i0], B = pts[i0 + 1];
    return { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, a: A.a + (B.a - A.a) * f, k: A.k, zone: A.zone, name: A.name };
  }

  // départ : domicile dans sa zone de confidentialité
  pts.push({ x: 0, y: 0, a: NORTH, s: 0, k: 0, zone, name: curName });
  F.marks.push({ s: 0, x: 0, y: 30, r: 190, kind: "home" });
  F.labels.push({ s: 0, x: 120, y: -40, text: TOWNS[ti++], kind: "town" });
  while (gs < 3600) extend();

  // --- trajet
  const DESTS = ["Café du Col", "Col de l'Espigoulier", "Sortie du dimanche", "Station de Cuges", "Belvédère de la Sainte-Baume"];
  let dest = { s: 3400, name: DESTS[0], n: 1 }, destI = 1;
  let camS = 40, camA = NORTH, speed = 9, last = performance.now();
  const others = []; let nextSpawn = 900, pulse = null;
  const RIDERS = [["Léo", "Ducati Monster"], ["Inès", "Yamaha MT-07"], ["Malik", "BMW R 1250 GS"], ["Chloé", "Triumph Street Triple"], ["Hugo", "Kawasaki Z900"]];
  let ridx = 0, invisible = true, lastVis = null;

  // projection écran du point d'ancrage (carte inclinée en CSS)
  function project(px, py){
    const m = new DOMMatrix(getComputedStyle(cv).transform);
    const ox = W * .5, oy = H;
    const p = m.transformPoint(new DOMPoint(px - ox, py - oy, 0, 1));
    return { x: p.x / p.w + ox + cv.offsetLeft, y: p.y / p.w + oy + cv.offsetTop };
  }
  function size(){
    DPR = hero.offsetWidth < 900 ? .62 : .78; // calque incliné : une résolution réduite reste nette
    W = cv.offsetWidth; H = cv.offsetHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    const narrow = hero.offsetWidth < 900;
    Z = narrow ? 1.35 : 1.7;
    // centre horizontal : milieu du panneau GPS ; hauteur : juste au-dessus du bas du panneau
    const box = UI.box.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const cx = box.left - hr.left + box.width / 2, targetY = box.bottom - hr.top - (narrow ? 70 : 64);
    AXF = (cx - cv.offsetLeft) / W;
    let lo = .3, hi = .99;
    for (let i = 0; i < 24; i++){ const mid = (lo + hi) / 2; project(W * AXF, H * mid).y < targetY ? lo = mid : hi = mid; }
    AYF = (lo + hi) / 2;
    const scr = project(W * AXF, H * AYF);
    UI.cur.style.left = UI.cross.style.left = scr.x + "px";
    UI.cur.style.top = (scr.y + 30) + "px";
    UI.cross.style.top = (scr.y - 112) + "px";
  }

  const sprite = (r, c0, c1) => { const c = document.createElement("canvas"); c.width = c.height = r * 2; const x = c.getContext("2d"); const g = x.createRadialGradient(r, r, 0, r, r, r); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c; };
  const GLOW_RIDER = sprite(24, "rgba(169,200,255,.6)", "rgba(169,200,255,0)"), GLOW_ME = sprite(48, "rgba(111,166,255,.5)", "rgba(111,166,255,0)");
  function upcoming(){
    for (const e of events){ if (e.s > camS - 2){ const d = e.s - camS; if (d < 2600) return { e, d }; break; } }
    return null;
  }
  const ORD = { 2: "deuxième", 3: "troisième" };
  function phrase(e){ return e.kind === "round" ? "au rond-point, prenez la " + ORD[e.exit] + " sortie" : "tournez à " + (e.dir > 0 ? "droite" : "gauche") + " sur " + e.street; }
  const ICON = {
    straight: "M12 20V5M6 11l6-6 6 6",
    right: "M8 20V12a4 4 0 0 1 4-4h7M15 4l4 4-4 4",
    left: "M16 20V12a4 4 0 0 0-4-4H5M9 4 5 8l4 4",
    round: "M12 21v-6M12 15a4 4 0 1 1 4-4M16 11V5M13 8l3-3 3 3"
  };
  function fmt(m){ return m >= 1000 ? (m / 1000).toFixed(1).replace(".", ",") + " km" : Math.max(10, Math.round(m / 10) * 10) + " m"; }

  function say(text){
    if (muted || !UI.voice) return;
    UI.voice.textContent = "« " + text.charAt(0).toUpperCase() + text.slice(1) + " »";
    UI.voice.classList.add("on");
    clearTimeout(say.t); say.t = setTimeout(() => UI.voice.classList.remove("on"), 2600);
  }
  function toast(html, ms){
    UI.toast.innerHTML = html; UI.toast.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(() => UI.toast.classList.remove("on"), ms || 4200);
  }

  const setT = (node, v) => { if (node.__v !== v){ node.__v = v; node.textContent = v; } };
  const setD = d => { if (UI.arrow.__d !== d){ UI.arrow.__d = d; UI.arrow.setAttribute("d", d); } };
  function updateUI(){
    const here = at(camS), up = upcoming();
    if (up){
      const e = up.e;
      setD(e.kind === "round" ? ICON.round : e.dir > 0 ? ICON.right : ICON.left);
      setT(UI.exit, e.kind === "round" ? e.exit : ""); UI.exit.hidden = e.kind !== "round";
      setT(UI.dist, fmt(up.d));
      setT(UI.text, e.kind === "round" ? "Au rond-point, " + e.exit + "e sortie" : "Tournez à " + (e.dir > 0 ? "droite" : "gauche"));
      setT(UI.street, "sur " + e.street);
      if (up.d < 420 && !e.a1){ e.a1 = true; say("dans " + (Math.round(up.d / 50) * 50) + " mètres, " + phrase(e)); }
      if (up.d < 70 && !e.a2){ e.a2 = true; say(phrase(e)); }
    } else {
      setD(ICON.straight); UI.exit.hidden = true;
      const nxt = events.find(e => e.s > camS);
      setT(UI.dist, nxt ? fmt(nxt.s - camS) : "3,0 km");
      setT(UI.text, "Continuez"); setT(UI.street, "sur " + here.name);
    }
    setT(UI.cur, here.name);
    setT(UI.limit, LIMIT[here.zone]);
    const rem = Math.max(0, dest.s - camS), min = Math.max(1, Math.round(rem / 14 / 60));
    const arr = new Date(Date.now() + min * 60000);
    setT(UI.eta, String(arr.getHours()).padStart(2, "0") + ":" + String(arr.getMinutes()).padStart(2, "0"));
    setT(UI.etaMin, min + " min"); setT(UI.etaKm, fmt(rem));
    setT(UI.dest, "Étape " + dest.n + " : " + dest.name);
    const vis = invisible ? "Invisible" : "500 m";
    if (vis !== lastVis){ lastVis = vis; ride.visTxt = vis; }
    const near = F.roam.filter(r => r.s > camS - 300 && r.s < camS + 900).length + others.length;
    setT(UI.riders, showRiders ? near : "–");
  }

  function draw(){
    const ax = W * AXF, ay = H * AYF;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cam = at(camS);
    ctx.save();
    ctx.translate(ax, ay); ctx.scale(Z, Z); ctx.rotate(NORTH - camA); ctx.translate(-cam.x, -cam.y);
    const lo = camS - 320, hi = camS + 950, inR = f => f.s > lo && f.s < hi;
    ctx.lineCap = "round"; ctx.lineJoin = "round";

    // zone de confidentialité (domicile)
    F.marks.forEach(m => { if (!inR({ s: m.s + 1 }) && camS > 900) return;
      ctx.fillStyle = "rgba(47,123,255,.08)"; ctx.strokeStyle = "rgba(111,166,255,.6)"; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      upright(m.x, m.y + m.r * .55, () => { pill("Zone de confidentialité", "#6FA6FF", "#000000"); });
      upright(m.x + 26, m.y + 46, () => { ctx.fillStyle = "#6FA6FF"; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(0, -8); ctx.lineTo(9, 1); ctx.lineTo(6, 1); ctx.lineTo(6, 9); ctx.lineTo(-6, 9); ctx.lineTo(-6, 1); ctx.closePath(); ctx.fill(); });
    });
    // champs, forêts
    ctx.lineWidth = 1.5;
    F.fields.forEach(f => { if (!inR(f)) return; ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.fillStyle = "rgba(30,33,41,.6)"; ctx.fillRect(-f.w/2, -f.h/2, f.w, f.h); ctx.strokeStyle = "rgba(47,123,255,.2)"; ctx.strokeRect(-f.w/2, -f.h/2, f.w, f.h); ctx.restore(); });
    ctx.fillStyle = "rgba(16,18,24,.85)";
    F.forest.forEach(f => { if (!inR(f)) return; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
    // bâtiments
    ctx.fillStyle = "#16181E"; ctx.strokeStyle = "#2A2E37"; ctx.lineWidth = 1;
    F.blocks.forEach(b => { if (!inR(b)) return; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h); ctx.strokeRect(-b.w/2, -b.h/2, b.w, b.h); ctx.restore(); });
    // réseau : rues puis routes principales, et ronds-points
    const lines = (filter, w) => F.streets.forEach(st => { if (!inR(st) || !filter(st)) return; ctx.lineWidth = w; ctx.beginPath(); st.line.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
    ctx.strokeStyle = "#000000"; lines(s => !s.major, 13); lines(s => s.major, 18);
    F.rings.forEach(r => { if (!inR(r)) return; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke(); });
    ctx.strokeStyle = "#262A33"; lines(s => !s.major, 9);
    ctx.strokeStyle = "#2A2E37"; lines(s => s.major, 13);
    F.rings.forEach(r => { if (!inR(r)) return; ctx.strokeStyle = "#2A2E37"; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "rgba(20,22,28,.95)"; ctx.beginPath(); ctx.arc(r.x, r.y, r.r - 6, 0, Math.PI * 2); ctx.fill(); });

    // itinéraire : chaussée, parcouru (gris), à venir (bleu)
    const i0 = Math.max(0, Math.floor((lo - pts[0].s) / STEP)), i1 = Math.min(pts.length - 1, Math.ceil((hi - pts[0].s) / STEP));
    const ic = Math.max(i0, Math.min(i1, Math.floor((camS - pts[0].s) / STEP)));
    const poly = (a, b) => { ctx.beginPath(); for (let i = a; i <= b; i++){ const p = pts[i]; i === a ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); } };
    poly(i0, i1); ctx.strokeStyle = "#000000"; ctx.lineWidth = 22; ctx.stroke(); ctx.strokeStyle = "#2A2E37"; ctx.lineWidth = 16; ctx.stroke();
    poly(i0, ic); ctx.strokeStyle = "#3A3F4A"; ctx.lineWidth = 7; ctx.stroke();
    poly(ic, i1); ctx.strokeStyle = "rgba(47,123,255,.35)"; ctx.lineWidth = 24; ctx.stroke(); ctx.strokeStyle = "#2F7BFF"; ctx.lineWidth = 11; ctx.stroke();
    // flèche de la prochaine manœuvre, posée sur la route
    const up = upcoming();
    if (up && up.d < 600){
      const ia = Math.max(i0, Math.floor((up.e.s - 26 - pts[0].s) / STEP)), ib = Math.min(i1, Math.floor((up.e.s + (up.e.kind === "round" ? 60 : 30) - pts[0].s) / STEP));
      if (ib > ia){ poly(ia, ib); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke(); const B = pts[ib], A = pts[ib - 1]; const aa = Math.atan2(B.y - A.y, B.x - A.x);
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(B.x + Math.cos(aa) * 9, B.y + Math.sin(aa) * 9); ctx.lineTo(B.x + Math.cos(aa + 2.4) * 9, B.y + Math.sin(aa + 2.4) * 9); ctx.lineTo(B.x + Math.cos(aa - 2.4) * 9, B.y + Math.sin(aa - 2.4) * 9); ctx.closePath(); ctx.fill(); }
    }
    // étape (destination)
    if (dest.s < hi){ const d = at(dest.s); upright(d.x, d.y, () => {
      ctx.fillStyle = "#6FA6FF"; ctx.beginPath(); ctx.arc(0, -26, 14, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-6, -15); ctx.lineTo(0, -4); ctx.lineTo(6, -15); ctx.fill();
      ctx.fillStyle = "#000000"; ctx.font = "800 15px 'Barlow Condensed', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(dest.n, 0, -25);
      ctx.translate(0, -56); pill("Étape " + dest.n + " : " + dest.name, "#6FA6FF", "#000000");
    }); }

    // points d'intérêt
    F.pois.forEach(o => { if (!inR(o)) return; upright(o.x, o.y, () => {
      if (o.type === "fuel"){
        ctx.fillStyle = "#07122A"; ctx.strokeStyle = "#6FA6FF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#6FA6FF"; ctx.fillRect(-6, -6, 8, 12); ctx.fillRect(3, -3, 3, 8);
        ctx.translate(0, -28); pill("SP98 " + o.price + " €", "#07122A", "#F3F5F9", "#6FA6FF");
      } else {
        ctx.fillStyle = "#A9C8FF"; ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(0, 2); ctx.lineTo(6, -8); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(-6, -24, 12, 11); ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(6, -20); ctx.stroke();
        ctx.translate(0, -48); pill(o.text + " · " + o.sub, "#A9C8FF", "#fff");
      }
    }); });
    // étiquettes
    F.labels.forEach(l => { if (!inR(l)) return; upright(l.x, l.y, () => {
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (l.kind === "road"){ ctx.font = "700 13px Barlow, system-ui, sans-serif"; const w = ctx.measureText(l.text).width + 14; ctx.fillStyle = "#6FA6FF"; rr(-w/2, -10, w, 20, 4); ctx.fill(); ctx.fillStyle = "#000000"; ctx.fillText(l.text, 0, 1); }
      else if (l.kind === "street"){ ctx.font = "600 12px Barlow, system-ui, sans-serif"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.9)"; ctx.strokeText(l.text, 0, 0); ctx.fillStyle = "rgba(205,212,225,.85)"; ctx.fillText(l.text, 0, 0); }
      else { ctx.font = (l.kind === "town" ? "800 24px" : "700 18px") + " 'Barlow Condensed', system-ui, sans-serif"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(0,0,0,.85)"; ctx.strokeText(l.text.toUpperCase(), 0, 0); ctx.fillStyle = l.kind === "town" ? "rgba(236,240,247,.85)" : "rgba(111,166,255,.95)"; ctx.fillText(l.text.toUpperCase(), 0, 0);
        if (l.kind === "col"){ ctx.font = "600 13px Barlow, system-ui, sans-serif"; ctx.fillStyle = "rgba(147,160,186,.95)"; ctx.fillText("728 m", 0, 20); } }
    }); });
    // riders à proximité (Premium) et en sens inverse
    const dot = (x, y) => { ctx.drawImage(GLOW_RIDER, x - 24, y - 24); ctx.fillStyle = "#A9C8FF"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
    if (showRiders){
      F.roam.forEach(r => { if (!inR(r)) return; const L = r.line, f = r.t * (L.length - 1), i = Math.min(L.length - 2, Math.floor(f)), u = f - i; dot(L[i][0] + (L[i + 1][0] - L[i][0]) * u, L[i][1] + (L[i + 1][1] - L[i][1]) * u); });
      others.forEach(o => { const p = at(o.s), n = nrm(p.a); dot(p.x - n.x * 3, p.y - n.y * 3); });
    }
    if (pulse){
      const k = Math.min(1, (performance.now() - pulse.t) / 1400);
      ctx.strokeStyle = "rgba(111,166,255," + (1 - k) + ")"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(pulse.x, pulse.y, 10 + k * 70, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(pulse.x, pulse.y, 6 + k * 40, 0, Math.PI * 2); ctx.stroke();
      if (k >= 1) pulse = null;
    }
    ctx.restore();

    // le rider : flèche de position, cap en haut
    ctx.save(); ctx.translate(ax, ay);
    ctx.drawImage(GLOW_ME, -48, -48);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2F7BFF"; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 10); ctx.lineTo(0, 4); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();
    ctx.restore();

    function upright(x, y, fn){ ctx.save(); ctx.translate(x, y); ctx.rotate(camA - NORTH); ctx.scale(1 / Z, 1 / Z); fn(); ctx.restore(); }
    function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function pill(text, bg, fg, border){ ctx.font = "700 12px Barlow, system-ui, sans-serif"; const w = ctx.measureText(text).width + 18; ctx.fillStyle = bg; rr(-w/2, -11, w, 22, 11); ctx.fill(); if (border){ ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.stroke(); } ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, 1); }
  }

  step.n = 0;
  function step(dt){
    let kmax = 0;
    for (let s = camS; s < camS + 70; s += 6) kmax = Math.max(kmax, Math.abs(at(s).k));
    const here = at(camS);
    const target = Math.min(LIMIT[here.zone] / 3.6, kmax ? Math.sqrt(3.4 / kmax) : 99);
    speed += (target - speed) * Math.min(1, dt * (target < speed ? 1.8 : .8));
    const TIME = 2.2; // le temps de la simulation passe plus vite
    camS += speed * dt * TIME; ride.dist += speed * dt * TIME;
    const da = at(camS + 10).a - camA; camA += da * Math.min(1, dt * 3.4);
    while (pts[pts.length - 1].s < camS + 2300) extend();
    if (pts[0].s < camS - 800){ pts.splice(0, Math.floor((camS - 800 - pts[0].s) / STEP)); }
    if ((++step.n % 40) === 0) for (const key in F){ if (key === "marks") continue; const arr = F[key], cut = camS - 800; let j = 0; for (let i = 0; i < arr.length; i++) if (arr[i].s >= cut) arr[j++] = arr[i]; arr.length = j; }
    while (events.length && events[0].s < camS - 50) events.shift();
    F.roam.forEach(r => { r.t += r.v * dt; if (r.t > 1 || r.t < 0){ r.v = -r.v; r.t = Math.max(0, Math.min(1, r.t)); } });
    // motards en face : croisement
    if (ride.dist > nextSpawn){ others.push({ s: camS + 1000, v: 14, crossed: false, who: RIDERS[ridx++ % RIDERS.length] }); nextSpawn = ride.dist + 1500 + rnd() * 1500; }
    for (let i = others.length - 1; i >= 0; i--){
      const o = others[i]; o.s -= o.v * dt * TIME;
      if (!o.crossed && o.s <= camS){ o.crossed = true; const p = at(camS); pulse = { x: p.x, y: p.y, t: performance.now() }; crossToast(o.who); }
      if (o.s < camS - 400) others.splice(i, 1);
    }
    // zone de confidentialité
    const home = F.marks[0], inside = Math.hypot(here.x - home.x, here.y - home.y) < home.r;
    if (invisible && !inside){ invisible = false; toast("<b>Sortie de la zone de confidentialité.</b> Votre position est de nouveau visible, avec une précision de 500 m."); }
    // étape atteinte
    if (camS >= dest.s){ toast("<b>Étape " + dest.n + " atteinte : " + dest.name + ".</b> Guidage vers l'étape suivante."); dest = { s: camS + 2600 + rnd() * 1800, name: DESTS[destI++ % DESTS.length], n: dest.n + 1 }; }
    ride.speed = speed * 3.6;
    ride.heading = ((camA - NORTH) * 180 / Math.PI % 360 + 360) % 360;
    ride.lean = Math.atan(speed * speed * here.k / 9.81) * 180 / Math.PI;
    ride.visible = !invisible;
  }
  function crossToast(who){
    UI.cross.querySelector("b").textContent = "Croisement : " + who[0];
    UI.cross.querySelector("span").textContent = who[1] + ", enregistré dans vos croisements";
    UI.cross.classList.add("on"); clearTimeout(crossToast.t); crossToast.t = setTimeout(() => UI.cross.classList.remove("on"), 3200);
  }

  // --- boutons de l'écran GPS
  $id("gSos").addEventListener("click", () => toast("<b>Alerte SOS :</b> dans l'application, le bouton lance un décompte de 10 secondes, puis votre position exacte est transmise aux membres IzenRide à proximité. <a href=\"#securite\">Voir la démonstration</a>", 6500));
  $id("gShare").addEventListener("click", () => toast("<b>Lien de suivi créé (démonstration).</b> Vos proches peuvent suivre votre position, votre vitesse et votre heure d'arrivée, sans application. Valable 24 heures, code 4 8 2 1 9.", 6000));
  const vb = $id("gVoiceBtn");
  vb.addEventListener("click", () => { muted = !muted; vb.setAttribute("aria-pressed", String(!muted)); $id("gVoiceIco").setAttribute("d", muted ? "M11 5 6 9H3v6h3l5 4V5ZM22 9l-6 6M16 9l6 6" : "M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"); toast(muted ? "<b>Guidage vocal désactivé.</b> Les instructions restent affichées." : "<b>Guidage vocal activé.</b> Disponible dans les 9 langues de l'application."); if (muted) UI.voice.classList.remove("on"); });
  const lb = $id("gLayers");
  lb.addEventListener("click", () => { showRiders = !showRiders; lb.setAttribute("aria-pressed", String(showRiders)); toast(showRiders ? "<b>Riders à proximité affichés.</b> Fonction incluse dans l'abonnement Premium." : "<b>Riders à proximité masqués.</b>"); });

  let frame = 0;
  function loop(now){
    const el = now - last;
    if (el >= 31){ // ~30 images par seconde suffisent pour une carte qui défile
      const dt = Math.min(.08, el / 1000); last = now;
      if (visible && !document.hidden){ step(dt); draw(); if ((++frame % 6) === 0) updateUI(); updateCluster(); }
    }
    requestAnimationFrame(loop);
  }
  size();
  addEventListener("resize", () => { size(); draw(); });
  addEventListener("load", size);
  if (document.fonts) document.fonts.ready.then(size);
  setTimeout(size, 600);
  new IntersectionObserver(e => visible = e[0].isIntersecting).observe(hero);
  if (REDUCE){ camS = 260; step(.016); speed = 0; ride.speed = 0; draw(); updateUI(); updateCluster(); return; }
  requestAnimationFrame(t => { last = t; loop(t); });
})();

const $ = id => document.getElementById(id);
const el = { spd: $("spd"), cap: $("cap"), lean: $("lean"), km: $("km"), arc: $("gaugeArc"), vis: $("visV") };
const CARDINAL = ["N","NE","E","SE","S","SO","O","NO"];
function updateCluster(){
  const set = (k, v, html) => { if (updateCluster[k] !== v){ updateCluster[k] = v; html ? (el[k].innerHTML = v) : (el[k].textContent = v); } };
  const s = Math.round(ride.speed);
  set("spd", s);
  if (updateCluster.arcV !== s){ updateCluster.arcV = s; el.arc.setAttribute("stroke-dashoffset", (100 - Math.min(100, s / 130 * 100)).toFixed(1)); }
  const h = Math.round(ride.heading) % 360;
  set("cap", CARDINAL[Math.round(h / 45) % 8] + " " + String(h).padStart(3, "0") + "°");
  const lean = Math.round(ride.lean);
  set("lean", (lean > 0 ? "D " : lean < 0 ? "G " : "") + Math.abs(lean) + "°");
  set("km", (ride.dist / 1000).toFixed(1).replace(".", ",") + "<i>km</i>", true);
  set("vis", ride.visible ? "500 m" : "Invisible");
}

/* ===== En-tête, progression, bandeau GPS ===== */
(function nav(){
  const top = $("top"), bar = $("progress");
  const steps = [...document.querySelectorAll("main > section[data-step]")];
  const links = [...document.querySelectorAll(".nav a")];
  const turns = ["M12 20V5M6 11l6-6 6 6", "M8 20V12a4 4 0 0 1 4-4h7M15 4l4 4-4 4", "M16 20V12a4 4 0 0 0-4-4H5M9 4 5 8l4 4"];
  let tops = [], maxY = 0, ticking = false;
  const measure = () => { tops = steps.map(s => s.offsetTop); maxY = document.documentElement.scrollHeight - innerHeight; };
  measure(); addEventListener("resize", measure); addEventListener("load", measure); setTimeout(measure, 1500);
  function onScroll(){
    const y = scrollY, max = maxY;
    ride.vel += (y - ride.lastY); ride.lastY = y;
    top.classList.toggle("solid", y > 40);
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    const probe = y + innerHeight * .35;
    let cur = 0; tops.forEach((t, i) => { if (t <= probe) cur = i; });
    links.forEach(a => a.classList.toggle("here", a.getAttribute("href") === "#" + steps[cur].id));
    if (REDUCE) updateCluster();
  }
  addEventListener("scroll", () => { if (!ticking){ ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  onScroll();
})();

/* ===== Croisement : carte + carnet ===== */
(function crossing(){
  if (!document.getElementById("mapcard")) return;
  const card = $("mapcard"), cv = $("xmap"), ctx = cv.getContext("2d"), log = $("logbook"), count = $("xcount");
  const RIDERS = [
    { n: "Léo", c: "#A9C8FF", m: "Ducati Monster", p: "Croisement à 300 m, D2 Gémenos" },
    { n: "Inès", c: "#6FA6FF", m: "Yamaha MT-07", p: "Même route, Col de l'Espigoulier" },
    { n: "Malik", c: "#6FA6FF", m: "BMW R 1250 GS", p: "Même endroit, Route des Crêtes" },
    { n: "Chloé", c: "#2F7BFF", m: "Triumph Street Triple", p: "3 fois sur la même route" },
    { n: "Hugo", c: "#6FA6FF", m: "Kawasaki Z900", p: "Croisement à 450 m, Corniche Kennedy" }
  ];
  let W, H, roads = [], streets = [], X, visible = false, idx = 0, n = 12;
  function bez(p, t){ const u = 1 - t; return { x: u*u*u*p[0].x + 3*u*u*t*p[1].x + 3*u*t*t*p[2].x + t*t*t*p[3].x, y: u*u*u*p[0].y + 3*u*u*t*p[1].y + 3*u*t*t*p[2].y + t*t*t*p[3].y }; }
  function size(){
    const r = card.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = r.width; H = r.height; cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    X = { x: W * .52, y: H * .38 };
    roads = [
      [{x:-20,y:H*.75},{x:W*.2,y:H*.6},{x:X.x-W*.2,y:X.y+H*.12},X],
      [{x:W+20,y:H*.12},{x:W*.85,y:H*.2},{x:X.x+W*.15,y:X.y-H*.1},X]
    ];
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    streets = [];
    for (let i = 0; i < 16; i++){
      const a = {x: rnd()*W, y: rnd()*H}, b = {x: rnd()*W, y: rnd()*H};
      streets.push([a, {x: a.x + (rnd()-.5)*W*.6, y: a.y + (rnd()-.5)*H*.6}, {x: b.x + (rnd()-.5)*W*.6, y: b.y + (rnd()-.5)*H*.6}, b, rnd() > .7]);
    }
  }
  function curve(p, color, w){ ctx.beginPath(); ctx.moveTo(p[0].x,p[0].y); ctx.bezierCurveTo(p[1].x,p[1].y,p[2].x,p[2].y,p[3].x,p[3].y); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
  function base(){ // le fond de carte est dessiné une fois, puis recopié
    const key = cv.width + "x" + cv.height;
    if (base.key !== key){
      ctx.clearRect(0,0,W,H);
      ctx.lineCap = "round";
      streets.forEach(s => curve(s, s[4] ? "#1E2129" : "#16181E", s[4] ? 6 : 3));
      roads.forEach(p => { curve(p, "#1E2129", 16); curve(p, "#2A2E37", 8); });
      base.c = document.createElement("canvas"); base.c.width = cv.width; base.c.height = cv.height;
      base.c.getContext("2d").drawImage(cv, 0, 0); base.key = key; return;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base.c, 0, 0); ctx.restore();
  }
  function rider(p, t, color){
    for (let k = 0; k < 22; k++){
      const tt = t - k * .012; if (tt < 0) break;
      const q = bez(p, tt); ctx.globalAlpha = (1 - k/22) * .8;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(q.x, q.y, 4 - k*.12, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const h = bez(p, t), g = ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,30);
    g.addColorStop(0, color); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x,h.y,30,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(h.x,h.y,4.5,0,Math.PI*2); ctx.fill();
  }
  function addEntry(animate){
    const r = RIDERS[idx % RIDERS.length]; idx++;
    const d = new Date(Date.now() - (animate ? 0 : (3 - idx) * 26 * 60000));
    const row = document.createElement("div"); row.className = "entry";
    if (!animate) row.style.animation = "none";
    row.innerHTML = '<span class="av"></span><div><b></b><span></span></div><time></time>';
    row.querySelector(".av").style.background = r.c; row.querySelector(".av").textContent = r.n[0];
    row.querySelector("b").textContent = r.n + " · " + r.m;
    row.querySelector(".entry > div > span").textContent = r.p;
    row.querySelector("time").textContent = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    log.prepend(row);
    while (log.children.length > (W < 420 ? 2 : 3)) log.lastChild.remove();
  }
  size(); addEventListener("resize", () => { size(); base(); });
  addEntry(false); addEntry(false); addEntry(false);
  const cols = [tok("--glow"), tok("--trail")];
  if (REDUCE){ base(); roads.forEach((p,i) => rider(p, 1, cols[i])); return; }
  new IntersectionObserver(e => visible = e[0].isIntersecting).observe(card);
  const RIDE = 3400, HOLD = 1600; let start = null, fired = false;
  function tick(now){
    if (now - (tick.l || 0) < 31){ requestAnimationFrame(tick); return; } tick.l = now;
    if (start === null) start = now;
    const e = (now - start) % (RIDE + HOLD);
    if (visible && !document.hidden){
      base();
      if (e < RIDE){ fired = false; const t = e / RIDE; const ease = t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; roads.forEach((p,i) => rider(p, ease, cols[i])); }
      else {
        const k = (e - RIDE) / HOLD;
        roads.forEach((p,i) => { ctx.globalAlpha = 1 - k; rider(p, 1, cols[i]); });
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = cols[0]; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(X.x, X.y, 10 + k*70, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(X.x, X.y, 6 + k*40, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
        if (!fired){ fired = true; n++; count.textContent = n; addEntry(true); }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ===== SOS : démonstration du décompte ===== */
(function sos(){
  const btn = $("sosBtn"), ring = $("sosRing"), lbl = $("sosLbl"), sub = $("sosSub"), msg = $("sosMsg"), cancel = $("sosCancel");
  let timer = null, left = 0;
  function reset(text){
    clearInterval(timer); timer = null;
    btn.classList.remove("counting"); ring.style.transition = "none"; ring.setAttribute("stroke-dashoffset", "100");
    lbl.textContent = "SOS"; sub.textContent = "Démonstration"; cancel.hidden = true; msg.textContent = text;
  }
  btn.addEventListener("click", () => {
    if (timer) return;
    left = 10; btn.classList.add("counting"); cancel.hidden = false;
    lbl.textContent = left; sub.textContent = "secondes";
    msg.textContent = "Décompte en cours. Appuyez sur « Je vais bien » pour annuler.";
    ring.style.transition = "none"; ring.setAttribute("stroke-dashoffset", "100");
    requestAnimationFrame(() => { ring.style.transition = "stroke-dashoffset 10s linear"; ring.setAttribute("stroke-dashoffset", "0"); });
    timer = setInterval(() => {
      left--; lbl.textContent = left;
      if (left <= 0){ reset("Fin de la démonstration. Dans l'application, votre position exacte serait maintenant transmise aux membres IzenRide à proximité. Vos contacts d'urgence peuvent ensuite être appelés directement."); lbl.textContent = "SOS"; }
    }, 1000);
  });
  cancel.addEventListener("click", () => { reset("Alerte annulée. Rien n'a été envoyé."); btn.focus(); });
})();

/* ===== Précision de la position ===== */
(function precision(){
  const btns = [...document.querySelectorAll(".seg button")], halo = $("precHalo"), dot = $("precDot");
  btns.forEach(b => b.addEventListener("click", () => {
    btns.forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    const r = +b.dataset.r;
    halo.setAttribute("r", r || 1); halo.style.opacity = r ? 1 : 0; dot.style.opacity = r ? 1 : 0;
    $("precT").textContent = b.dataset.t; $("precD").textContent = b.dataset.d;
  }));
})();

/* ===== Message vocal : barres ===== */
(function(){ const b = document.getElementById("bars"); if (!b) return;
  [6,12,18,9,14,20,11,7,16,10,18,8,13,6,10,15,7].forEach(h => { const i = document.createElement("i"); i.style.height = h + "px"; b.appendChild(i); });
})();

/* ===== Carrousel d'écrans ===== */
(function carousel(){
  const box = $("carousel"), chips = $("chips");
  let cur = 0;
  const items = SCREENS.map((s, i) => {
    const it = document.createElement("div"); it.className = "item";
    it.innerHTML = '<div class="phone"><img decoding="async" width="540" height="1104"></div>';
    const img = it.querySelector("img"); img.src = "assets/screens/" + s.file; img.alt = "Écran " + s.name + " : " + s.desc;
    it.addEventListener("click", () => go(i));
    box.appendChild(it);
    const c = document.createElement("button"); c.type = "button"; c.textContent = s.name;
    c.addEventListener("click", () => go(i)); chips.appendChild(c);
    return it;
  });
  const chipBtns = [...chips.children];
  function go(i){
    cur = (i + SCREENS.length) % SCREENS.length;
    const narrow = innerWidth < 700;
    items.forEach((it, j) => {
      let d = j - cur;
      if (d > SCREENS.length / 2) d -= SCREENS.length;
      if (d < -SCREENS.length / 2) d += SCREENS.length;
      const a = Math.abs(d);
      const x = d * (narrow ? 58 : 72), rot = Math.max(-50, Math.min(50, -d * 32));
      it.style.transform = "translateX(" + x + "%) translateZ(" + (-a * 160) + "px) rotateY(" + rot + "deg)";
      it.style.opacity = a > 3 ? 0 : 1 - a * .18;
      it.style.zIndex = 10 - a;
      it.style.pointerEvents = a > 3 ? "none" : "auto";
      it.classList.toggle("cur", d === 0);
      it.setAttribute("aria-hidden", d === 0 ? "false" : "true"); it.inert = d !== 0;
    });
    chipBtns.forEach((c, j) => c.setAttribute("aria-current", j === cur ? "true" : "false"));
    $("capName").textContent = SCREENS[cur].name;
    $("capDesc").textContent = SCREENS[cur].desc;
    $("capCount").textContent = (cur + 1) + " / " + SCREENS.length;
  }
  $("prevB").addEventListener("click", () => go(cur - 1));
  $("nextB").addEventListener("click", () => go(cur + 1));
  box.addEventListener("keydown", e => {
    if (e.key === "ArrowRight"){ e.preventDefault(); go(cur + 1); }
    if (e.key === "ArrowLeft"){ e.preventDefault(); go(cur - 1); }
  });
  let sx = null;
  box.addEventListener("pointerdown", e => { sx = e.clientX; });
  addEventListener("pointerup", e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  });
  addEventListener("resize", () => go(cur));
  go(0);
})();

/* ===== Loupe : agrandissement des écrans au survol, plein écran au clic ===== */
(function zoom(){
  const peek = document.getElementById("zoomPeek"), box = document.getElementById("zoomBox");
  const pImg = peek.querySelector("img"), pCap = peek.querySelector("figcaption");
  const bImg = box.querySelector("img"), bCap = box.querySelector("figcaption");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  let lastFocus = null, hideT = null;
  const label = img => (img.alt || "").replace(/^Écran\s*/, "");
  const target = el => {
    const img = el.closest(".phone") && el.closest(".phone").querySelector("img");
    if (!img || el.closest(".zoom-peek") || el.closest(".zoom-box")) return null;
    if (el.closest(".carousel") && !el.closest(".item.cur")) return null; // dans le carrousel : seulement l'écran central
    return img;
  };
  function mark(){ document.querySelectorAll(".phone img").forEach(i => { i.classList.add("zoomable"); const ph = i.closest(".phone"); if (!ph.hasAttribute("tabindex")){ ph.tabIndex = 0; ph.setAttribute("role","button"); ph.setAttribute("aria-label","Agrandir : " + label(i)); } }); }
  function place(img, x){
    const r = img.getBoundingClientRect(), vw = innerWidth, h = Math.round(Math.min(innerHeight * .7, 640, Math.max(r.height * 1.4, 460))), w = h * 540 / 1104, gap = 28;
    peek.style.height = h + "px";
    let left = (r.left + r.width / 2 < vw / 2) ? r.right + gap : r.left - gap - w;
    if (left < 16 || left + w > vw - 16) left = Math.max(16, Math.min(vw - w - 16, (x ?? vw / 2) > vw / 2 ? 24 : vw - w - 24));
    peek.style.left = left + "px";
  }
  if (canHover){
    document.addEventListener("pointerover", e => {
      const img = target(e.target); if (!img) return;
      clearTimeout(hideT);
      if (pImg.src !== img.currentSrc){ pImg.src = img.currentSrc || img.src; pCap.textContent = label(img); }
      place(img, e.clientX); peek.classList.add("on");
    });
    document.addEventListener("pointerout", e => {
      if (!target(e.target)) return;
      if (e.relatedTarget && target(e.relatedTarget) === target(e.target)) return;
      hideT = setTimeout(() => peek.classList.remove("on"), 60);
    });
    addEventListener("scroll", () => peek.classList.remove("on"), { passive: true });
  }
  function open(img){
    peek.classList.remove("on"); lastFocus = document.activeElement;
    bImg.src = img.currentSrc || img.src; bImg.alt = img.alt; bCap.textContent = label(img);
    box.hidden = false; document.getElementById("zoomClose").focus();
  }
  function close(){ box.hidden = true; if (lastFocus) lastFocus.focus(); }
  document.addEventListener("click", e => {
    if (e.target.closest(".zoom-box")){ if (e.target.closest("figure img")) return; close(); return; }
    const img = target(e.target); if (img){ e.preventDefault(); open(img); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !box.hidden) close();
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("phone")){ const img = target(e.target.querySelector("img")); if (img){ e.preventDefault(); open(img); } }
  });
  mark(); setTimeout(mark, 800);
})();
