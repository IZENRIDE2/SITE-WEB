<?php
/**
 * Espace pro — accès verrouillé.
 *
 * L'adresse publique reste /espace-pro.html (réécrite vers ce fichier par .htaccess).
 * Trois sortes de comptes : l'administrateur IzenRide (statistiques et console des comptes), les
 * maisons mères et les magasins (créés depuis la console, voir espace-pro-lib.php).
 * Les identifiants de l'administrateur ne sont
 * PAS dans le dépôt (qui est public) : ils sont lus dans deux variables d'environnement de
 * l'hébergement OVH (onglet « Variables d'environnement ») :
 *
 *   ESPACE_PRO_ADMIN_EMAIL          l'adresse e-mail de connexion
 *   ESPACE_PRO_ADMIN_MOT_DE_PASSE   le mot de passe (12 caractères au moins), ou son empreinte
 *                                   bcrypt (commençant par $2y$)
 *
 * À défaut, ils sont lus dans un fichier placé au-dessus du dossier du site (voir plus bas).
 *
 * Tant qu'aucun compte n'est défini, PERSONNE ne peut se connecter : la page est verrouillée
 * pour tout le monde.
 */
declare(strict_types=1);

const IZR_PRO = true;
require __DIR__ . '/espace-pro-lib.php';

const IZR_PRO_ESSAIS_MAX = 8;        // échecs tolérés par adresse IP…
const IZR_PRO_FENETRE = 900;         // …sur 15 minutes
const IZR_PRO_DUREE_SESSION = 7200;  // 2 heures sans activité

function izr_env(string $cle): string
{
    foreach ([getenv($cle), $_SERVER[$cle] ?? null, $_ENV[$cle] ?? null] as $v) {
        if (is_string($v) && $v !== '') {
            return $v;
        }
    }
    return '';
}

function izr_fichier_essais(): string
{
    return sys_get_temp_dir() . '/izr-pro-' . hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'inconnu') . '.json';
}

function izr_essais(): array
{
    $brut = @file_get_contents(izr_fichier_essais());
    $d = is_string($brut) ? json_decode($brut, true) : null;
    if (!is_array($d) || !isset($d['n'], $d['t']) || (time() - (int) $d['t']) > IZR_PRO_FENETRE) {
        return ['n' => 0, 't' => time()];
    }
    return ['n' => (int) $d['n'], 't' => (int) $d['t']];
}

function izr_noter_echec(): void
{
    $d = izr_essais();
    $d['n']++;
    @file_put_contents(izr_fichier_essais(), json_encode($d), LOCK_EX);
}

$adminEmail = strtolower(trim(izr_env('ESPACE_PRO_ADMIN_EMAIL')));
$adminSecret = izr_env('ESPACE_PRO_ADMIN_MOT_DE_PASSE');
// Solution de repli si l'hébergement n'offre pas de variables d'environnement : un fichier placé
// AU-DESSUS du dossier du site (donc jamais servi ni versionné), /espace-pro-admin.php, qui contient
//   <?php return ['email' => '…', 'mot_de_passe' => '…'];
if ($adminEmail === '' || $adminSecret === '') {
    $fichierCompte = dirname(__DIR__) . '/espace-pro-admin.php';
    if (is_file($fichierCompte)) {
        $compte = require $fichierCompte;
        if (is_array($compte)) {
            $adminEmail = strtolower(trim((string) ($compte['email'] ?? '')));
            $adminSecret = (string) ($compte['mot_de_passe'] ?? '');
        }
    }
}
$estEmpreinte = strncmp($adminSecret, '$2y$', 4) === 0;
$configure = $adminEmail !== '' && ($estEmpreinte || strlen($adminSecret) >= 12);
// La session est liée aux identifiants en vigueur : les changer déconnecte tout le monde.
$empreinteCompte = hash('sha256', $adminEmail . '|' . $adminSecret);

header('Cache-Control: no-store, private');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

session_name('izr_pro');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
if (empty($_SESSION['jeton'])) {
    $_SESSION['jeton'] = bin2hex(random_bytes(32));
}

$connecte = $configure
    && ($_SESSION['admin'] ?? false) === true
    && hash_equals($empreinteCompte, (string) ($_SESSION['compte'] ?? ''))
    && (time() - (int) ($_SESSION['vu'] ?? 0)) <= IZR_PRO_DUREE_SESSION;
// Compte de maison mère ou de magasin : il doit toujours exister, être actif et porter le même
// mot de passe qu'à la connexion (le suspendre ou régénérer son mot de passe ferme sa session).
$partenaire = null;
if (!$connecte && is_string($_SESSION['partenaire'] ?? null)) {
    $idP = $_SESSION['partenaire'];
    $cP = izr_comptes_lire()[$idP] ?? null;
    if (isset(izr_annuaire()[$idP]) && is_array($cP) && !empty($cP['actif']) && !empty($cP['empreinte'])
        && hash_equals(izr_empreinte_session($idP, $cP), (string) ($_SESSION['compte'] ?? ''))
        && (time() - (int) ($_SESSION['vu'] ?? 0)) <= IZR_PRO_DUREE_SESSION) {
        $partenaire = $idP;
    }
}
if (!$connecte && $partenaire === null) {
    unset($_SESSION['admin'], $_SESSION['partenaire'], $_SESSION['compte'], $_SESSION['vu']);
}

$erreur = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $jetonOk = hash_equals($_SESSION['jeton'], (string) ($_POST['jeton'] ?? ''));
    $action = (string) ($_POST['action'] ?? '');

    if ($jetonOk && $action === 'deconnexion') {
        $_SESSION = [];
        session_regenerate_id(true);
        header('Location: /espace-pro.html', true, 303);
        exit;
    }

    if ($action === 'connexion') {
        $essais = izr_essais();
        if (!$jetonOk) {
            $erreur = 'La page a expiré. Rechargez-la et réessayez.';
        } elseif ($essais['n'] >= IZR_PRO_ESSAIS_MAX) {
            http_response_code(429);
            $erreur = 'Trop de tentatives. Réessayez dans un quart d\'heure.';
        } else {
            $email = strtolower(trim((string) ($_POST['email'] ?? '')));
            $motDePasse = (string) ($_POST['mot_de_passe'] ?? '');
            $emailOk = $configure && hash_equals($adminEmail, $email);
            $secretOk = $estEmpreinte
                ? password_verify($motDePasse, $adminSecret)
                : hash_equals($adminSecret, $motDePasse);
            if ($emailOk && $secretOk) {
                session_regenerate_id(true);
                $_SESSION['admin'] = true;
                $_SESSION['compte'] = $empreinteCompte;
                $_SESSION['vu'] = time();
                $_SESSION['jeton'] = bin2hex(random_bytes(32));
                @unlink(izr_fichier_essais());
                header('Location: /espace-pro.html', true, 303);
                exit;
            }
            $idP = $emailOk ? null : izr_verifier_partenaire($email, $motDePasse);
            if ($idP !== null) {
                session_regenerate_id(true);
                unset($_SESSION['admin']);
                $_SESSION['partenaire'] = $idP;
                $_SESSION['compte'] = izr_empreinte_session($idP, izr_comptes_lire()[$idP]);
                $_SESSION['vu'] = time();
                $_SESSION['jeton'] = bin2hex(random_bytes(32));
                @unlink(izr_fichier_essais());
                header('Location: /espace-pro.html', true, 303);
                exit;
            }
            izr_noter_echec();
            usleep(700000);
            http_response_code(401);
            $erreur = 'Identifiant ou mot de passe incorrect.';
        }
    }
}

if ($connecte || $partenaire !== null) {
    $_SESSION['vu'] = time();
    // Les statistiques et la console des comptes sont réservées à l'administrateur.
    $izrVue = !$connecte ? 'accueil' : (($_GET['vue'] ?? '') === 'comptes' ? 'comptes' : 'stats');
    $izrPartenaire = $partenaire !== null ? izr_annuaire()[$partenaire] : null;
    $izrConsole = ['message' => '', 'erreur' => '', 'generes' => []];
    $izrErreurValidation = '';
    if ($partenaire !== null && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'valider') {
        $izrErreurValidation = $jetonOk ? izr_valider_compte($partenaire, $_POST) : 'La page a expiré. Rechargez-la et réessayez.';
        if ($izrErreurValidation === '') {
            // Les informations partent dès la validation. Si l'envoi échoue, le compte reste validé
            // et la console propose « Envoyer les informations ».
            izr_envoyer_informations($partenaire);
            header('Location: /espace-pro.html', true, 303);
            exit;
        }
    }
    $izrIdPartenaire = $partenaire;
    $izrCompte = $partenaire !== null ? (izr_comptes_lire()[$partenaire] ?? []) : [];
    if ($izrVue === 'comptes' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($jetonOk) {
            $izrConsole = izr_console_traiter($_POST);
        } else {
            $izrConsole['erreur'] = 'La page a expiré. Rechargez-la et réessayez.';
        }
    }
    define('IZR_PRO_OK', true);
    require __DIR__ . '/espace-pro-contenu.php';
    exit;
}

$titre = 'Connexion à l\'espace pro — IzenRide';
$jeton = htmlspecialchars($_SESSION['jeton'], ENT_QUOTES, 'UTF-8');
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= $titre ?></title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#000000">
<meta name="apple-itunes-app" content="app-id=6476877458">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/barlow-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/fonts.css?v=20261020">
<link rel="stylesheet" href="assets/css/site.css?v=20261102b">
<link rel="stylesheet" href="assets/css/page.css?v=20261102">
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
    <a class="btn btn-primary" href="/#telecharger">Télécharger</a>
  </div>
</header>

<main id="contenu">
  <section class="pro-acces" aria-labelledby="page-title">
    <span class="kicker">Espace pro</span>
    <h1 id="page-title">Connexion à l'espace pro</h1>
    <p class="lede">Cet espace est réservé. Connectez-vous avec votre compte professionnel.</p>
    <form class="pro-carte" method="post" action="espace-pro.html" autocomplete="on">
      <input type="hidden" name="jeton" value="<?= $jeton ?>">
      <input type="hidden" name="action" value="connexion">
<?php if ($erreur !== '') : ?>
      <p class="pro-alerte" role="alert"><?= htmlspecialchars($erreur, ENT_QUOTES, 'UTF-8') ?></p>
<?php endif; ?>
<?php if (!$configure) : ?>
      <p class="pro-note" role="status">L'accès est en cours de configuration : aucune connexion n'est possible pour l'instant.</p>
<?php endif; ?>
      <div class="pro-champ">
        <label for="email">Identifiant ou adresse e-mail</label>
        <input id="email" name="email" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false">
      </div>
      <div class="pro-champ">
        <label for="mot_de_passe">Mot de passe</label>
        <input id="mot_de_passe" name="mot_de_passe" type="password" required autocomplete="current-password">
      </div>
      <button class="btn btn-primary" type="submit">Se connecter</button>
      <p class="pro-note">Vous êtes une enseigne ou un magasin moto ? Écrivez-nous à <a href="mailto:support@izenride.com">support@izenride.com</a> pour demander un accès.</p>
    </form>
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
