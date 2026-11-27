<?php
// Contenu réservé : servi uniquement par espace-pro.php après connexion.
if (!defined('IZR_PRO_OK')) { http_response_code(404); exit; }
$izrTitres = ['stats' => 'Statistiques', 'comptes' => 'Comptes', 'accueil' => 'Votre espace'];
$izrJeton = izr_h($_SESSION['jeton']);
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= $izrTitres[$izrVue] ?> — Espace pro IzenRide</title>
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
.pro-vues{display:flex;gap:4px}
.pro-vues a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:10px;color:var(--mute);font-weight:600;text-decoration:none}
.pro-vues a:hover{color:var(--ink)}
.pro-vues a[aria-current="page"]{color:var(--ink);background:var(--asphalt);box-shadow:inset 0 0 0 1px var(--line)}
.pro-barre button{min-height:44px;padding:0 16px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
</style>
<link rel="stylesheet" href="assets/css/espace-pro.css?v=20261127e">
<?php if ($izrVue === 'stats') : ?>
<script defer src="assets/js/espace-pro-stats.js?v=20261127f"></script>
<?php endif; ?>
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
    <a class="btn btn-primary" href="/#telecharger">Télécharger</a>
  </div>
</header>


<main id="contenu">
<div class="pro-barre">
  <div class="wrap">
<?php if ($izrVue === 'accueil') : ?>
    <span>Connecté à l'espace pro : <?= izr_h($izrPartenaire['nom']) ?>.</span>
<?php else : ?>
    <nav class="pro-vues" aria-label="Administration">
      <a href="espace-pro.html"<?= $izrVue === 'stats' ? ' aria-current="page"' : '' ?>>Statistiques</a>
      <a href="espace-pro.html?vue=comptes"<?= $izrVue === 'comptes' ? ' aria-current="page"' : '' ?>>Comptes</a>
    </nav>
<?php endif; ?>
    <form method="post" action="espace-pro.html">
      <input type="hidden" name="jeton" value="<?= $izrJeton ?>">
      <input type="hidden" name="action" value="deconnexion">
      <button type="submit">Se déconnecter</button>
    </form>
  </div>
</div>
<?php if ($izrVue === 'stats') : ?>
  <script type="application/json" id="pro-donnees"><?= json_encode(izr_scans_30_jours(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
  <div class="ps" id="pro-stats"><noscript><p class="ps-note">Cette page a besoin de JavaScript pour afficher les statistiques.</p></noscript></div>
<?php elseif ($izrVue === 'comptes') : ?>
<?php izr_console_afficher($izrConsole, $izrJeton, $_GET); ?>
<?php else : ?>
  <div class="ps">
    <div><span class="kicker">Espace pro</span><h1>Bienvenue</h1><p class="lede"><?= izr_h($izrPartenaire['nom']) ?></p></div>
    <p class="ps-note"><strong>Votre accès est ouvert.</strong> Les outils de votre espace sont en cours de préparation : vous les retrouverez ici dès leur mise en ligne.</p>
  </div>
<?php endif; ?>
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
