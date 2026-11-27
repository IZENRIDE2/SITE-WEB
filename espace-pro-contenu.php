<?php
// Contenu réservé : servi uniquement par espace-pro.php après connexion.
if (!defined('IZR_PRO_OK')) { http_response_code(404); exit; }
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Espace pro pour les enseignes et magasins moto — IzenRide</title>
<link rel="canonical" href="https://izenride.fr/espace-pro.html">
<meta name="description" content="L'espace pro IzenRide pour les enseignes et les magasins moto : un QR code par magasin, un accès par enseigne et le suivi des inscriptions. Ouverture prochaine.">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="website">
<meta property="og:title" content="Espace pro pour les enseignes et magasins moto — IzenRide">
<meta property="og:description" content="L'espace pro IzenRide pour les enseignes et les magasins moto : un QR code par magasin, un accès par enseigne et le suivi des inscriptions. Ouverture prochaine.">
<meta property="og:url" content="https://izenride.fr/espace-pro.html">
<meta property="og:site_name" content="IzenRide">
<meta property="og:locale" content="fr_FR">
<meta property="og:image" content="https://izenride.fr/assets/img/og-izenride.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="IzenRide, l'application GPS et communauté moto">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Espace pro pour les enseignes et magasins moto — IzenRide">
<meta name="twitter:description" content="L'espace pro IzenRide pour les enseignes et les magasins moto : un QR code par magasin, un accès par enseigne et le suivi des inscriptions. Ouverture prochaine.">
<meta name="twitter:image" content="https://izenride.fr/assets/img/og-izenride.jpg">
<meta name="apple-itunes-app" content="app-id=6476877458">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/barlow-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/fonts.css?v=20261020">
<link rel="stylesheet" href="assets/css/site.css?v=20261102b">
<link rel="stylesheet" href="assets/css/page.css?v=20261102">
<script type="application/ld+json">{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "IzenRide", "item": "https://izenride.fr/"}, {"@type": "ListItem", "position": 2, "name": "Espace pro", "item": "https://izenride.fr/espace-pro.html"}]}</script>
<script defer src="https://izeninfo.fr/stats/t.js" data-site="izenride"></script>
<style>
.pro-acces{max-width:460px;margin:clamp(40px,8vw,96px) auto;padding:0 20px}
.pro-acces h1{font-family:var(--body);font-weight:700;font-size:clamp(2rem,4vw,2.8rem);line-height:1.05;letter-spacing:-.03em;margin:14px 0 12px}
.pro-acces .lede{color:var(--mute);margin:0 0 28px}
.pro-carte{background:var(--deck);border:1px solid var(--line);border-radius:var(--r-lg);padding:28px;display:flex;flex-direction:column;gap:18px}
.pro-champ{display:flex;flex-direction:column;gap:6px}
.pro-champ label{font-size:.95rem;font-weight:500}
.pro-champ input{min-height:48px;box-sizing:border-box;padding:0 14px;border:1px solid #5A6375;border-radius:10px;background:var(--asphalt);color:var(--ink);font:inherit}
.pro-champ input:focus{outline:2px solid var(--glow);outline-offset:2px}
.pro-carte .btn{min-height:50px;justify-content:center;border:0;cursor:pointer;font:inherit;font-weight:600}
.pro-alerte{margin:0;padding:12px 14px;border:1px solid var(--sos);border-radius:10px;background:#1A0F10;color:var(--ink);font-size:.95rem}
.pro-note{margin:0;font-size:.9rem;color:var(--mute)}
.pro-barre{border-bottom:1px solid var(--line);background:var(--deck)}
.pro-barre .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 24px;padding-block:10px;font-size:.95rem;color:var(--mute)}
.pro-barre form{margin:0}
.pro-barre button{min-height:44px;padding:0 16px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
</style>
</head>
<body class="page">
<a class="skip" href="#contenu">Aller au contenu</a>

<header class="top solid">
  <div class="wrap">
    <a class="brand" href="/" aria-label="IzenRide, accueil"><img src="assets/img/logo.png" alt="" width="36" height="36"><span>Izen<b>Ride</b></span></a>
    <nav class="nav" aria-label="Navigation principale">
      <a href="gps-moto-gratuit.html">GPS moto</a>
      <a href="communaute-moto.html">Communauté</a>
      <a href="sorties-moto.html">Sorties</a>
      <a href="securite-moto.html">Sécurité</a>
      <a href="balades-moto-provence.html">Balades</a>
      <a href="espace-pro.html" aria-current="page">Espace pro</a>
    </nav>
    <a class="btn btn-primary" href="#telecharger">Télécharger</a>
  </div>
</header>
<div class="pro-barre">
  <div class="wrap">
    <span>Connecté à l'espace pro en tant qu'administrateur IzenRide.</span>
    <form method="post" action="espace-pro.html">
      <input type="hidden" name="jeton" value="<?= htmlspecialchars($_SESSION['jeton'], ENT_QUOTES, 'UTF-8') ?>">
      <input type="hidden" name="action" value="deconnexion">
      <button type="submit">Se déconnecter</button>
    </form>
  </div>
</div>


<main id="contenu">
  <nav class="crumbs wrap" aria-label="Fil d'Ariane">
    <ol><li><a href="/">IzenRide</a></li><li aria-current="page">Espace pro</li></ol>
  </nav>

  <section class="page-hero wrap" aria-labelledby="page-title">
    <div>
      <span class="kicker">Enseignes et magasins moto</span>
      <h1 id="page-title">L'espace pro IzenRide, pour les magasins qui équipent les motards</h1>
      <p class="lede">Un QR code par magasin, un accès par enseigne et le suivi des inscriptions venues de chaque point de vente. L'espace pro ouvre prochainement à nos enseignes partenaires.</p>
      <div class="ctas">
          <a class="btn btn-primary" href="mailto:support@izenride.com?subject=Espace%20pro%20IzenRide">Demander un accès</a>
          <a class="btn btn-ghost" href="#fonctionnement">Voir le fonctionnement</a>
      </div>
      <ul class="facts"><li>Un QR code par magasin</li><li>Un accès par enseigne</li><li>Suivi par magasin</li><li>Ouverture prochaine</li></ul>
    </div>
    <div class="phone"><img src="assets/screens/v319b-carte.webp" alt="Écran Carte d'IzenRide avec les boutons Itinéraire et Croisements, le partage de position, l'alerte SOS et les stations" width="540" height="1104" loading="lazy" decoding="async"></div>
  </section>

  <section class="band" id="fonctionnement" aria-labelledby="fonctionnement-title">
    <div class="wrap">
      <div class="sec-lead">
        <div class="head">
          <span class="kicker">Fonctionnement</span>
          <h2 id="fonctionnement-title">Du QR code en boutique au suivi par magasin.</h2>
        </div>
        <p class="lede">Chaque magasin partenaire reçoit son propre QR code. Le motard le scanne en boutique, découvre l'application, et le magasin suit ce que son affiche a apporté.</p>
      </div>
      <div class="feat-grid cols-3">
        <article class="feat"><span class="fi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 14.5h3v3h-3zM20.5 17.5v3h-3"/></svg></span><h3>Un QR code par magasin</h3><p>Chaque point de vente a son code, à afficher en boutique. Il est propre au magasin et valable un an.</p></article>
        <article class="feat"><span class="fi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg></span><h3>Un accès par enseigne</h3><p>L'enseigne dispose d'un compte principal. C'est elle qui remet à chacun de ses magasins son premier accès.</p></article>
        <article class="feat"><span class="fi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l3.5-4 3 2.5L19 8"/></svg></span><h3>Un suivi par magasin</h3><p>Scans du QR code, inscriptions et forfaits Premium sont comptés par magasin, et regroupés par enseigne.</p></article>
      </div>
    </div>
  </section>

  <section class="band alt" id="acces" aria-labelledby="acces-title">
    <div class="wrap two-col">
      <div class="prose">
        <span class="kicker">Accès</span>
        <h2 id="acces-title">Chacun voit ce qui le concerne.</h2>
        <ul>
          <li><strong>Le magasin</strong> voit son QR code, ses chiffres et les demandes que les motards lui adressent.</li>
          <li><strong>L'enseigne</strong> voit l'ensemble de ses magasins et gère leurs accès.</li>
          <li><strong>IzenRide</strong> ouvre le compte de chaque enseigne et accompagne la mise en place.</li>
        </ul>
        <p class="note">L'espace pro est en cours de mise en place avec nos premières enseignes. Écrivez-nous pour être prévenu de son ouverture.</p>
      </div>
      <div class="prose">
        <span class="kicker">Côté motard</span>
        <h2>Une application gratuite, présentée en boutique.</h2>
        <p>Le motard qui scanne le QR code d'un magasin arrive sur une page aux couleurs d'IzenRide, d'où il télécharge l'application et peut contacter le magasin.</p>
        <a class="more" href="/#premium">Comparer l'offre gratuite et Premium</a>
      </div>
    </div>
  </section>

  <section class="band" id="questions" aria-labelledby="faq-title">
    <div class="wrap faq-layout">
      <div class="head">
        <span class="kicker">Questions fréquentes</span>
        <h2 id="faq-title">Espace pro : vos questions</h2>
        <p class="lede">Une autre question ? Écrivez-nous à <a href="mailto:support@izenride.com">support@izenride.com</a>.</p>
      </div>
      <div class="faq">
        <details open><summary>L'espace pro est-il déjà ouvert ?</summary><p>Pas encore. Il est en cours de mise en place avec nos premières enseignes partenaires. Écrivez-nous à <a href="mailto:support@izenride.com">support@izenride.com</a> pour être prévenu de l'ouverture.</p></details>
        <details><summary>À qui s'adresse-t-il ?</summary><p>Aux enseignes et aux magasins d'équipement, d'accessoires et d'entretien moto qui souhaitent présenter IzenRide à leurs clients.</p></details>
        <details><summary>Comment un magasin obtient-il son accès ?</summary><p>IzenRide ouvre le compte de l'enseigne, qui remet ensuite à chaque magasin son premier accès. Le magasin choisit son mot de passe à sa première connexion.</p></details>
      </div>
    </div>
  </section>

  <section class="band get" id="telecharger" aria-labelledby="get-title">
    <div class="wrap">
      <h2 id="get-title">Téléchargez<br>IzenRide.</h2>
      <p class="lede">Disponible gratuitement sur Android et iPhone, en 9 langues. Créez votre compte en quelques minutes et paramétrez votre visibilité dès la première utilisation.</p>
      <div class="ctas">
        <a class="store" href="https://play.google.com/store/apps/details?id=com.izenride.app" rel="noopener">
          <svg class="gp" viewBox="0 0 23 26" aria-hidden="true"><path fill="#00A0FF" d="M1.2.7C.9 1 .8 1.4.8 1.9v21.8c0 .5.1.9.4 1.2L13.3 12.8Z"/><path fill="#00F076" d="M1.2.7 13.3 12.8l3.6-3.6L2.9.4C2.3 0 1.6 0 1.2.7Z"/><path fill="#FF3A44" d="M1.2 24.9c.4.7 1.1.7 1.7.4l14-8.9-3.6-3.6Z"/><path fill="#FFD500" d="m16.9 9.2-3.6 3.6 3.6 3.6 4.1-2.3c1.2-.7 1.2-1.9 0-2.6Z"/></svg>
          <span><small>Disponible sur</small><b>Google Play</b></span>
        </a>
        <a class="store" href="https://apps.apple.com/fr/app/izenride/id6476877458" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>
          <span><small>Télécharger dans</small><b>l'App Store</b></span>
        </a>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <div class="foot-row">
      <a class="brand" href="/"><img src="assets/img/logo.png" alt="" width="36" height="36"><span>Izen<b>Ride</b></span></a>
      <p class="motto">Pensé pour la route.</p>
      <div class="foot-links" aria-label="Réseaux sociaux">
        <a href="https://www.instagram.com/izenride/" rel="noopener">Instagram</a>
        <a href="https://www.tiktok.com/@IZENRIDE" rel="noopener">TikTok</a>
        <a href="https://www.youtube.com/@IZENRIDE" rel="noopener">YouTube</a>
      </div>
    </div>
    <nav class="foot-links foot-discover" aria-label="Découvrir IzenRide">
      <span class="lbl">Découvrir</span>
      <a href="gps-moto-gratuit.html">GPS moto gratuit</a>
      <a href="communaute-moto.html">Communauté moto</a>
      <a href="sorties-moto.html">Sorties moto</a>
      <a href="securite-moto.html">Sécurité à moto</a>
      <a href="balades-moto-provence.html">Balades moto en Provence</a>
      <a href="espace-pro.html">Espace pro</a>
    </nav>
    <nav class="foot-links" aria-label="Informations légales">
      <a href="cgu.html">CGU</a>
      <a href="cgv.html">CGV</a>
      <a href="mentions-legales.html">Mentions légales</a>
      <a href="confidentialite.html">Confidentialité</a>
      <a href="suppression-compte.html">Supprimer mon compte</a>
      <a href="support.html">Aide</a>
      <a href="mailto:support@izenride.com">support@izenride.com</a>
    </nav>
    <p>© 2026 IZEN RIDE SAS, 4 rue Massilie, 13420 Gémenos. RCS Marseille 981 848 922.</p>
  </div>
</footer>
</body>
</html>
