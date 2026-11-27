<?php
/**
 * Espace pro — comptes des maisons mères et des magasins.
 *
 * Les comptes sont rangés dans un fichier placé AU-DESSUS du dossier du site (jamais servi, jamais
 * versionné) : espace-pro-comptes.json. Il ne contient que des empreintes bcrypt : un mot de passe
 * généré est affiché une seule fois à l'administrateur, puis il n'existe plus nulle part en clair.
 */
declare(strict_types=1);
if (!defined('IZR_PRO')) { http_response_code(404); exit; }

const IZR_FUSEAU_DAFFICHAGE = 'Europe/Paris'; // les dates de la console sont lues par l'équipe IzenRide, en France

function izr_h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function izr_annuaire(): array
{
    static $a = null;
    if ($a === null) {
        $a = require __DIR__ . '/espace-pro-annuaire.php';
    }
    return $a;
}

function izr_fichier_comptes(): string
{
    return dirname(__DIR__) . '/espace-pro-comptes.json';
}

function izr_comptes_lire(): array
{
    $brut = @file_get_contents(izr_fichier_comptes());
    $d = is_string($brut) ? json_decode($brut, true) : null;
    return is_array($d) ? $d : [];
}

/** Lit, modifie et réécrit le fichier des comptes sous verrou. Rend false si l'écriture échoue. */
function izr_comptes_modifier(callable $modifier): bool
{
    $fichier = izr_fichier_comptes();
    $verrou = @fopen($fichier . '.verrou', 'c');
    if ($verrou === false || !flock($verrou, LOCK_EX)) {
        return false;
    }
    try {
        $comptes = izr_comptes_lire();
        $modifier($comptes);
        $tmp = $fichier . '.tmp';
        $json = json_encode($comptes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false || @file_put_contents($tmp, $json) === false) {
            return false;
        }
        @chmod($tmp, 0600);
        return @rename($tmp, $fichier);
    } finally {
        flock($verrou, LOCK_UN);
        fclose($verrou);
    }
}

/** Douze caractères sans ambiguïté (ni 0/o, ni 1/l/i), en trois groupes faciles à recopier. */
function izr_mot_de_passe(): string
{
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    $s = '';
    for ($i = 0; $i < 12; $i++) {
        $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        if ($i === 3 || $i === 7) {
            $s .= '-';
        }
    }
    return $s;
}

function izr_empreinte_session(string $id, array $compte): string
{
    return hash('sha256', $id . '|' . ($compte['empreinte'] ?? ''));
}

/** Vérifie un identifiant de maison mère ou de magasin. Rend l'identifiant, ou null. */
function izr_verifier_partenaire(string $identifiant, string $motDePasse): ?string
{
    $comptes = izr_comptes_lire();
    $c = isset(izr_annuaire()[$identifiant]) ? ($comptes[$identifiant] ?? null) : null;
    // Une empreinte factice garde le même temps de réponse quand le compte n'existe pas.
    $empreinte = is_array($c) && !empty($c['empreinte']) ? (string) $c['empreinte'] : '$2y$10$gWugiSut7..4F5p3wnNCjeOFqAb6LnKMEundO3U1NlV5MbuVhBRrm';
    $ok = password_verify($motDePasse, $empreinte);
    if (!$ok || !is_array($c) || empty($c['empreinte']) || empty($c['actif'])) {
        return null;
    }
    izr_comptes_modifier(function (array &$tous) use ($identifiant): void {
        if (isset($tous[$identifiant])) {
            $tous[$identifiant]['derniere_connexion'] = time();
        }
    });
    return $identifiant;
}

function izr_fichier_scans(): string
{
    return dirname(__DIR__) . '/espace-pro-scans.json';
}

/** Compte un scan pour ce magasin, au jour courant (heure française). Format : {"2027-01-01": {"maxxess-nice": 3}}. */
function izr_scan_noter(string $id): void
{
    $fichier = izr_fichier_scans();
    $verrou = @fopen($fichier . '.verrou', 'c');
    if ($verrou === false || !flock($verrou, LOCK_EX)) {
        return;
    }
    try {
        $brut = @file_get_contents($fichier);
        $scans = is_string($brut) ? json_decode($brut, true) : null;
        if (!is_array($scans)) {
            if (is_string($brut) && $brut !== '') {
                return; // fichier illisible : on ne l'écrase pas
            }
            $scans = [];
        }
        $jour = (new DateTimeImmutable('now', new DateTimeZone(IZR_FUSEAU_DAFFICHAGE)))->format('Y-m-d');
        $scans[$jour][$id] = (int) ($scans[$jour][$id] ?? 0) + 1;
        $json = json_encode($scans);
        if ($json !== false && @file_put_contents($fichier . '.tmp', $json) !== false) {
            @chmod($fichier . '.tmp', 0600);
            @rename($fichier . '.tmp', $fichier);
        }
    } finally {
        flock($verrou, LOCK_UN);
        fclose($verrou);
    }
}

/** Les scans des 30 derniers jours, aujourd'hui en dernier : ['jours' => [dates], 'scans' => [id => [30 nombres]]]. */
function izr_scans_30_jours(): array
{
    $brut = @file_get_contents(izr_fichier_scans());
    $scans = is_string($brut) ? json_decode($brut, true) : null;
    $scans = is_array($scans) ? $scans : [];
    $aujourdhui = new DateTimeImmutable('today', new DateTimeZone(IZR_FUSEAU_DAFFICHAGE));
    $jours = [];
    $parMagasin = [];
    for ($i = 0; $i < 30; $i++) {
        $jour = $aujourdhui->modify('-' . (29 - $i) . ' days')->format('Y-m-d');
        $jours[] = $jour;
        foreach (($scans[$jour] ?? []) as $id => $n) {
            if (!isset($parMagasin[$id])) {
                $parMagasin[$id] = array_fill(0, 30, 0);
            }
            $parMagasin[$id][$i] = (int) $n;
        }
    }
    return ['jours' => $jours, 'scans' => $parMagasin];
}

function izr_date(?int $t): string
{
    if (!$t) {
        return '—';
    }
    $d = (new DateTimeImmutable('@' . $t))->setTimezone(new DateTimeZone(IZR_FUSEAU_DAFFICHAGE));
    return $d->format('d/m/Y à H:i');
}

/** Applique une action de la console. Rend ['message' => …, 'erreur' => …, 'generes' => [id => mot de passe]]. */
function izr_console_traiter(array $post): array
{
    $r = ['message' => '', 'erreur' => '', 'generes' => []];
    $annuaire = izr_annuaire();
    $action = (string) ($post['action'] ?? '');
    $id = (string) ($post['compte'] ?? '');
    $cibles = [];

    if ($action === 'generer' && isset($annuaire[$id])) {
        $cibles = [$id];
    } elseif ($action === 'generer_manquants') {
        $enseigne = (string) ($post['enseigne'] ?? '');
        $comptes = izr_comptes_lire();
        foreach ($annuaire as $i => $a) {
            if ($a['enseigne'] === $enseigne && $a['type'] === 'magasin' && empty($comptes[$i]['empreinte'])) {
                $cibles[] = $i;
            }
        }
        if (!$cibles) {
            $r['message'] = 'Tous les magasins de cette enseigne ont déjà un mot de passe.';
            return $r;
        }
    }

    if ($cibles) {
        @set_time_limit(120);
        $nouveaux = [];
        foreach ($cibles as $i) {
            $clair = izr_mot_de_passe();
            $nouveaux[$i] = ['clair' => $clair, 'empreinte' => password_hash($clair, PASSWORD_BCRYPT)];
        }
        $ok = izr_comptes_modifier(function (array &$tous) use ($nouveaux): void {
            foreach ($nouveaux as $i => $n) {
                $tous[$i] = array_merge(['actif' => true, 'derniere_connexion' => null], $tous[$i] ?? [], [
                    'empreinte' => $n['empreinte'],
                    'genere' => time(),
                ]);
            }
        });
        if (!$ok) {
            $r['erreur'] = 'Le fichier des comptes n\'a pas pu être écrit sur l\'hébergement. Aucun mot de passe n\'a été changé.';
            return $r;
        }
        foreach ($nouveaux as $i => $n) {
            $r['generes'][$i] = $n['clair'];
        }
        return $r;
    }

    if (($action === 'suspendre' || $action === 'reactiver') && isset($annuaire[$id])) {
        $actif = $action === 'reactiver';
        $ok = izr_comptes_modifier(function (array &$tous) use ($id, $actif): void {
            if (isset($tous[$id])) {
                $tous[$id]['actif'] = $actif;
            }
        });
        if (!$ok) {
            $r['erreur'] = 'Le fichier des comptes n\'a pas pu être écrit sur l\'hébergement.';
        } else {
            $r['message'] = $annuaire[$id]['nom'] . ($actif ? ' : compte réactivé.' : ' : compte suspendu. La connexion est refusée et la session en cours est fermée.');
        }
        return $r;
    }

    $r['erreur'] = 'Action inconnue.';
    return $r;
}

function izr_console_ligne(string $id, array $a, array $c, string $jeton, string $retour): string
{
    $aMdp = !empty($c['empreinte']);
    $actif = $aMdp && !empty($c['actif']);
    $etat = !$aMdp ? ['Sans mot de passe', 'pc-gris'] : ($actif ? ['Actif', 'pc-actif'] : ['Suspendu', 'pc-suspendu']);
    $champs = '<input type="hidden" name="jeton" value="' . $jeton . '"><input type="hidden" name="compte" value="' . izr_h($id) . '">';
    $form = '<form method="post" action="' . $retour . '">' . $champs;
    if (!$aMdp) {
        $actions = $form . '<button class="pc-btn pc-btn-fort" name="action" value="generer">Générer un mot de passe</button></form>';
    } else {
        $actions = '<details class="pc-details"><summary class="pc-btn">Nouveau mot de passe</summary>' . $form
            . '<p>L\'ancien mot de passe cessera de fonctionner tout de suite.</p><button class="pc-btn pc-btn-fort" name="action" value="generer">Confirmer</button></form></details>'
            . $form . '<button class="pc-btn" name="action" value="' . ($actif ? 'suspendre' : 'reactiver') . '">' . ($actif ? 'Suspendre' : 'Réactiver') . '</button></form>';
    }
    if ($a['type'] === 'magasin') {
        $actions .= '<a class="pc-btn" href="/assets/qr/2027/' . izr_h($id) . '.svg" download="qr-2027-' . izr_h($id) . '.svg">QR code 2027</a>';
    }
    return '<li><div class="pc-qui"><b>' . izr_h($a['nom']) . '</b><code>' . izr_h($id) . '</code></div>'
        . '<span class="pc-etat ' . $etat[1] . '">' . $etat[0] . '</span>'
        . '<span class="pc-date"><small>Mot de passe généré</small>' . izr_date($c['genere'] ?? null) . '</span>'
        . '<span class="pc-date"><small>Dernière connexion</small>' . izr_date($c['derniere_connexion'] ?? null) . '</span>'
        . '<div class="pc-actions">' . $actions . '</div></li>';
}

function izr_console_afficher(array $resultat, string $jeton, array $get): void
{
    $annuaire = izr_annuaire();
    $comptes = izr_comptes_lire();
    $enseignes = array_values(array_unique(array_column($annuaire, 'enseigne')));
    $vue = in_array($get['enseigne'] ?? '', $enseignes, true) ? (string) $get['enseigne'] : '';
    $q = trim((string) ($get['q'] ?? ''));
    $retour = 'espace-pro.html?' . izr_h(http_build_query(array_filter(['vue' => 'comptes', 'enseigne' => $vue, 'q' => $q], 'strlen')));

    $n = ['actif' => 0, 'sans' => 0, 'suspendu' => 0];
    foreach ($annuaire as $id => $a) {
        $c = $comptes[$id] ?? [];
        $n[empty($c['empreinte']) ? 'sans' : (!empty($c['actif']) ? 'actif' : 'suspendu')]++;
    }

    echo '<div class="ps pc"><div class="ps-tete"><div><span class="kicker">Administration IzenRide</span><h1>Comptes</h1>'
        . '<p class="lede">' . count($annuaire) . ' comptes : ' . count($enseignes) . ' maisons mères et ' . (count($annuaire) - count($enseignes)) . ' magasins</p></div></div>';

    if (!is_writable(is_file(izr_fichier_comptes()) ? izr_fichier_comptes() : dirname(izr_fichier_comptes()))) {
        echo '<p class="pro-alerte" role="alert">L\'hébergement refuse l\'écriture du fichier des comptes : aucun mot de passe ne pourra être enregistré.</p>';
    }
    if ($resultat['erreur'] !== '') {
        echo '<p class="pro-alerte" role="alert">' . izr_h($resultat['erreur']) . '</p>';
    }
    if ($resultat['message'] !== '') {
        echo '<p class="ps-note" role="status">' . izr_h($resultat['message']) . '</p>';
    }
    if ($resultat['generes']) {
        $lignes = '';
        $texte = '';
        foreach ($resultat['generes'] as $id => $clair) {
            $lignes .= '<li><div class="pc-qui"><b>' . izr_h($annuaire[$id]['nom']) . '</b><code>' . izr_h($id) . '</code></div><code class="pc-clair">' . izr_h($clair) . '</code></li>';
            $texte .= $annuaire[$id]['nom'] . ' ; ' . $id . ' ; ' . $clair . "\n";
        }
        echo '<section class="ps-bloc pc-generes" role="status"><div class="ps-titre"><h2>' . (count($resultat['generes']) > 1 ? count($resultat['generes']) . ' mots de passe générés' : 'Mot de passe généré') . '</h2></div>'
            . '<p class="ps-note"><strong>Notez-les maintenant.</strong> Ils ne seront plus jamais affichés : seule leur empreinte est conservée. En cas de perte, il faudra en générer un nouveau.</p>'
            . '<ul class="pc-liste-clair">' . $lignes . '</ul>'
            . '<label class="pc-copie">À copier (magasin ; identifiant ; mot de passe)<textarea readonly rows="' . min(12, count($resultat['generes']) + 1) . '">' . izr_h($texte) . '</textarea></label></section>';
    }

    echo '<div class="ps-tuiles">'
        . '<div class="ps-tuile"><span class="ps-etq">Comptes actifs</span><b>' . $n['actif'] . '</b><small>peuvent se connecter</small></div>'
        . '<div class="ps-tuile"><span class="ps-etq">Sans mot de passe</span><b>' . $n['sans'] . '</b><small>pas encore ouverts</small></div>'
        . '<div class="ps-tuile"><span class="ps-etq">Suspendus</span><b>' . $n['suspendu'] . '</b><small>connexion refusée</small></div></div>';

    echo '<section class="ps-bloc"><div class="ps-titre"><h2>Maisons mères</h2></div><ul class="pc-table">';
    foreach ($annuaire as $id => $a) {
        if ($a['type'] === 'enseigne') {
            echo izr_console_ligne($id, $a, $comptes[$id] ?? [], $jeton, $retour);
        }
    }
    echo '</ul></section>';

    echo '<section class="ps-bloc"><div class="ps-titre"><h2>Magasins</h2>'
        . '<form class="pc-recherche" method="get" action="espace-pro.html" role="search"><input type="hidden" name="vue" value="comptes">'
        . ($vue !== '' ? '<input type="hidden" name="enseigne" value="' . izr_h($vue) . '">' : '')
        . '<label for="pc-q">Rechercher un magasin</label><input id="pc-q" name="q" type="search" value="' . izr_h($q) . '" placeholder="Ville ou département"><button class="pc-btn">Rechercher</button></form></div>';
    echo '<nav class="ps-groupe" aria-label="Enseigne">';
    foreach (array_merge([''], $enseignes) as $e) {
        echo '<a class="ps-choix"' . ($e === $vue ? ' aria-current="page"' : '') . ' href="espace-pro.html?' . izr_h(http_build_query(array_filter(['vue' => 'comptes', 'enseigne' => $e], 'strlen'))) . '">' . ($e === '' ? 'Toutes les enseignes' : izr_h($e)) . '</a>';
    }
    echo '</nav><div class="pc-lots">';
    foreach ($enseignes as $e) {
        if ($vue !== '' && $vue !== $e) {
            continue;
        }
        $manquants = 0;
        foreach ($annuaire as $id => $a) {
            if ($a['enseigne'] === $e && $a['type'] === 'magasin' && empty($comptes[$id]['empreinte'])) {
                $manquants++;
            }
        }
        if ($manquants > 0) {
            echo '<form method="post" action="' . $retour . '"><input type="hidden" name="jeton" value="' . $jeton . '"><input type="hidden" name="enseigne" value="' . izr_h($e) . '">'
                . '<button class="pc-btn" name="action" value="generer_manquants">Générer les ' . $manquants . ' mots de passe manquants — ' . izr_h($e) . '</button></form>';
        }
    }
    echo '</div><ul class="pc-table">';
    $motif = mb_strtolower($q);
    $affiches = 0;
    foreach ($annuaire as $id => $a) {
        if ($a['type'] !== 'magasin' || ($vue !== '' && $a['enseigne'] !== $vue)) {
            continue;
        }
        if ($motif !== '' && !str_contains(mb_strtolower($a['dept'] . ' ' . $a['nom'] . ' ' . $id), $motif)) {
            continue;
        }
        echo izr_console_ligne($id, $a, $comptes[$id] ?? [], $jeton, $retour);
        $affiches++;
    }
    echo '</ul>' . ($affiches === 0 ? '<p class="ps-note">Aucun magasin ne correspond à cette recherche.</p>' : '') . '</section></div>';
}
