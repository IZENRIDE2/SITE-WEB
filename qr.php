<?php
/**
 * Page ouverte par le QR code d'un magasin : /m/<identifiant>-<année> (réécrit par .htaccess).
 * Un QR code imprimé ne peut pas expirer tout seul : c'est cette page qui applique sa validité.
 */
declare(strict_types=1);

const IZR_PRO = true;
require __DIR__ . '/espace-pro-lib.php';
const IZR_FUSEAU_QR = 'Europe/Paris'; // la validité s'entend à l'heure française, celle des magasins
// Campagnes : année du QR code => [premier jour, lendemain du dernier jour]
const IZR_QR_CAMPAGNES = ['2027' => ['2027-01-01', '2028-01-01']];

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$annuaire = require __DIR__ . '/espace-pro-annuaire.php';
$code = (string) ($_GET['code'] ?? '');
$annee = substr($code, -4);
$id = substr($code, 0, -5);
$magasin = $annuaire[$id] ?? null;
if (!preg_match('/^[a-z0-9-]+-\d{4}$/', $code) || !isset(IZR_QR_CAMPAGNES[$annee]) || $magasin === null || $magasin['type'] !== 'magasin') {
    http_response_code(404);
    readfile(__DIR__ . '/404.html');
    exit;
}
$fuseau = new DateTimeZone(IZR_FUSEAU_QR);
$debut = new DateTimeImmutable(IZR_QR_CAMPAGNES[$annee][0], $fuseau);
$fin = new DateTimeImmutable(IZR_QR_CAMPAGNES[$annee][1], $fuseau);
$maintenant = new DateTimeImmutable('now', $fuseau);
$etat = $maintenant < $debut ? 'avant' : ($maintenant >= $fin ? 'apres' : 'valide');
$nom = htmlspecialchars($magasin['nom'], ENT_QUOTES, 'UTF-8');
if ($etat !== 'valide') {
    http_response_code(410);
} else {
    // Un scan = une ouverture de la page pendant la validité, hors robots et préchargements.
    $agent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    $prechargement = stripos(($_SERVER['HTTP_SEC_PURPOSE'] ?? '') . ($_SERVER['HTTP_PURPOSE'] ?? '') . ($_SERVER['HTTP_X_MOZ'] ?? ''), 'pre') !== false;
    $robot = $agent === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|monitor|headless/i', $agent) === 1;
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && !$prechargement && !$robot) {
        izr_scan_noter($id);
    }
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= $nom ?> vous invite sur IzenRide</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#000000">
<meta name="apple-itunes-app" content="app-id=6476877458">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/barlow-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css?v=20261020">
<link rel="stylesheet" href="/assets/css/site.css?v=20261102b">
<link rel="stylesheet" href="/assets/css/page.css?v=20261102">
<style>
.qr-accueil{max-width:560px;margin:calc(68px + clamp(40px,10vw,96px)) auto clamp(48px,10vw,112px);padding:0 20px;text-align:center}
.qr-accueil h1{font-family:var(--body);font-weight:700;font-size:clamp(2.2rem,6vw,3.2rem);line-height:1.05;letter-spacing:-.03em;margin:14px 0 16px}
.qr-accueil .lede{color:var(--mute);margin:0 0 32px}
.qr-accueil .btn{min-height:52px;justify-content:center}
.qr-accueil .qr-note{margin:24px 0 0;font-size:.95rem;color:var(--mute)}
</style>
</head>
<body class="page">
<a class="skip" href="#contenu">Aller au contenu</a>

<header class="top solid">
  <div class="wrap">
    <a class="brand" href="/" aria-label="IzenRide, accueil"><img src="/assets/img/logo.png" alt="" width="36" height="36"><span>Izen<b>Ride</b></span></a>
    <nav class="nav" aria-label="Navigation principale">
      <a href="/gps-moto-gratuit.html">GPS moto</a>
      <a href="/communaute-moto.html">Communauté</a>
      <a href="/sorties-moto.html">Sorties</a>
      <a href="/securite-moto.html">Sécurité</a>
      <a href="/balades-moto-provence.html">Balades</a>
      <a href="/espace-pro.html">Espace pro</a>
    </nav>
    <a class="btn btn-primary" href="/#telecharger">Télécharger</a>
  </div>
</header>

<main id="contenu">
  <section class="qr-accueil" aria-labelledby="page-title">
<?php if ($etat === 'valide') : ?>
    <span class="kicker">De la part de <?= $nom ?></span>
    <h1 id="page-title">Bienvenue sur IzenRide</h1>
    <p class="lede">Le GPS et la communauté des motards : itinéraires, sorties entre motards et sécurité sur la route.</p>
    <a class="btn btn-primary" href="/#telecharger">Télécharger l'application</a>
<?php elseif ($etat === 'avant') : ?>
    <span class="kicker"><?= $nom ?></span>
    <h1 id="page-title">Ce QR code n'est pas encore actif</h1>
    <p class="lede">Il sera utilisable à partir du <?= $debut->format('d/m/Y') ?>.</p>
    <a class="btn btn-primary" href="/">Découvrir IzenRide</a>
<?php else : ?>
    <span class="kicker"><?= $nom ?></span>
    <h1 id="page-title">Ce QR code a expiré</h1>
    <p class="lede">Il était valable jusqu'au <?= $fin->modify('-1 day')->format('d/m/Y') ?>. Demandez le nouveau QR code à votre magasin.</p>
    <a class="btn btn-primary" href="/">Découvrir IzenRide</a>
<?php endif; ?>
  </section>
</main>
<footer>
  <div class="wrap">
    <div class="foot-row">
      <a class="brand" href="/"><img src="/assets/img/logo.png" alt="" width="36" height="36"><span>Izen<b>Ride</b></span></a>
      <p class="motto">Pensé pour la route.</p>
      <div class="foot-links" aria-label="Réseaux sociaux">
        <a href="https://www.instagram.com/izenride/" rel="noopener">Instagram</a>
        <a href="https://www.tiktok.com/@IZENRIDE" rel="noopener">TikTok</a>
        <a href="https://www.youtube.com/@IZENRIDE" rel="noopener">YouTube</a>
      </div>
    </div>
    <nav class="foot-links foot-discover" aria-label="Découvrir IzenRide">
      <span class="lbl">Découvrir</span>
      <a href="/gps-moto-gratuit.html">GPS moto gratuit</a>
      <a href="/communaute-moto.html">Communauté moto</a>
      <a href="/sorties-moto.html">Sorties moto</a>
      <a href="/securite-moto.html">Sécurité à moto</a>
      <a href="/balades-moto-provence.html">Balades moto en Provence</a>
      <a href="/espace-pro.html">Espace pro</a>
    </nav>
    <nav class="foot-links" aria-label="Informations légales">
      <a href="/cgu.html">CGU</a>
      <a href="/cgv.html">CGV</a>
      <a href="/mentions-legales.html">Mentions légales</a>
      <a href="/confidentialite.html">Confidentialité</a>
      <a href="/suppression-compte.html">Supprimer mon compte</a>
      <a href="/support.html">Aide</a>
      <a href="mailto:support@izenride.com">support@izenride.com</a>
    </nav>
    <p>© 2026 IZEN RIDE SAS, 4 rue Massilie, 13420 Gémenos. RCS Marseille 981 848 922.</p>
  </div>
</footer>
</body>
</html>
