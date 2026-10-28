/* IzenRide v2 – effets : apparitions au défilement, halo souris sur les cartes,
   champ de particules qui change de forme selon la section (route, riders, radar, étoiles).
   Coupé si « Réduire les animations » est activé. Aucune dépendance. */
(function(){
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- 1. Apparitions ---------- */
  var sel = ".band .head, .band .sec-lead > *, .feat, .tile, .panel, .tier, .price-card, .proof-item, .faq details, .timeline li, .current, .cmp-wrap, .xblock, .nav-stage > *, .get .wrap > *";
  var items = [].slice.call(document.querySelectorAll(sel));
  if (!reduce && "IntersectionObserver" in window){
    root.classList.add("fx");
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    items.forEach(function(el){
      var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
      el.classList.add("rv", "d" + Math.min(3, sib % 4));
      // déjà visible au chargement : pas d'animation
      if (el.getBoundingClientRect().top < innerHeight * .92) el.classList.add("in"); else io.observe(el);
    });
  }

  /* ---------- 2. Halo qui suit la souris ---------- */
  if (matchMedia("(hover: hover)").matches){
    [].forEach.call(document.querySelectorAll(".feat, .tile, .panel, .tier, .price-card, .proof-item, .current"), function(c){
      c.classList.add("fx-spot");
      c.addEventListener("pointermove", function(e){
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  /* ---------- 3. Champ de particules ---------- */
  if (reduce) return;
  var cv = document.createElement("canvas"); cv.id = "fxField"; cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1;
  var N = innerWidth < 700 ? 520 : 1100;
  var P = new Float32Array(N * 2), V = new Float32Array(N * 2), T = new Float32Array(N * 2), S = new Float32Array(N), A = new Float32Array(N);
  function rnd(a, b){ return a + Math.random() * (b - a); }
  for (var i = 0; i < N; i++){ S[i] = rnd(.8, 2.1); A[i] = rnd(.35, 1); }

  /* Formes cibles, coordonnées normalisées (0..1) */
  var shapes = {
    // route : deux bords d'une route sinueuse en perspective + pointillés centraux
    road: function(i){
      var t = (i % 340) / 340, lane = Math.floor(i / 340) % 3;          // 0 bord gauche, 1 centre, 2 bord droit
      var y = .22 + t * .86, persp = .08 + t * .62;
      var cx = .5 + Math.sin(t * 3.4 + .6) * .22 * (1 - t * .35);
      var off = (lane - 1) * persp * .5;
      if (lane === 1 && (Math.floor(t * 34) % 2)) off += 9;              // pointillés : on sort de l'écran une fois sur deux
      return [cx + off + rnd(-.004, .004), y + rnd(-.003, .003)];
    },
    // riders : amas lumineux reliés (communauté)
    riders: function(i){
      var k = i % 9, seeds = [[.18,.3],[.32,.62],[.5,.4],[.66,.7],[.8,.32],[.88,.6],[.42,.85],[.12,.78],[.6,.16]];
      var c = seeds[k], r = Math.pow(Math.random(), 1.8) * .065;
      var a = Math.random() * 6.283;
      return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 1.4];
    },
    // radar : anneaux concentriques autour d'un point (sécurité, visibilité)
    radar: function(i){
      var ring = 1 + (i % 5), a = (i / N) * 6.283 * 7 + ring;
      var r = ring * .085;
      return [.72 + Math.cos(a) * r * .62, .52 + Math.sin(a) * r];
    },
    // étoiles : ciel de nuit dispersé
    stars: function(){ return [Math.random(), Math.random()]; }
  };
  var order = [["navigation","road"],["communaute","riders"],["securite","radar"],["ecrans","stars"],["premium","road"],["nouveautes","stars"],["faq","stars"],["telecharger","radar"]];
  var current = "";
  function setShape(name){
    if (name === current) return; current = name;
    var f = shapes[name];
    for (var i = 0; i < N; i++){ var p = f(i); T[2*i] = p[0]; T[2*i+1] = p[1]; }
  }
  function resize(){
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener("resize", resize, { passive: true });
  setShape("stars");
  for (var j = 0; j < N; j++){ P[2*j] = T[2*j] * W; P[2*j+1] = T[2*j+1] * H; }

  /* Section courante → forme ; visible seulement après le hero */
  var secs = order.map(function(o){ return [document.getElementById(o[0]), o[1]]; }).filter(function(o){ return o[0]; });
  var hero = document.getElementById("accueil"), visible = false;
  function onScroll(){
    var y = innerHeight * .45, name = null;
    secs.forEach(function(s){ var r = s[0].getBoundingClientRect(); if (r.top < y && r.bottom > y) name = s[1]; });
    var past = !hero || hero.getBoundingClientRect().bottom < innerHeight * .6;
    visible = past; cv.classList.toggle("on", past);
    if (name) setShape(name);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var last = 0, t0 = performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    if (!visible || document.hidden || now - last < 33) return;   // ~30 images/s, en pause sous le hero
    last = now; var tt = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < N; i++){
      var ix = 2*i, iy = ix + 1;
      var tx = T[ix] * W + Math.sin(tt * .6 + i) * 2.2, ty = T[iy] * H + Math.cos(tt * .5 + i * 1.7) * 2.2;
      V[ix] = (V[ix] + (tx - P[ix]) * .012) * .88; V[iy] = (V[iy] + (ty - P[iy]) * .012) * .88;
      P[ix] += V[ix]; P[iy] += V[iy];
      if (P[ix] < -10 || P[ix] > W + 10 || P[iy] < -10 || P[iy] > H + 10) continue;
      var tw = .55 + .45 * Math.sin(tt * 1.3 + i * 2.3);
      ctx.globalAlpha = A[i] * tw * .85;
      ctx.fillStyle = i % 7 === 0 ? "#A9C8FF" : "#6FA6FF";
      ctx.fillRect(P[ix], P[iy], S[i], S[i]);
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();
