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

function izr_fichier_admin(): string
{
    return dirname(__DIR__) . '/espace-pro-admin.json';
}

function izr_admin_enregistrer(string $empreinte): bool
{
    $tmp = izr_fichier_admin() . '.tmp';
    if (@file_put_contents($tmp, json_encode(['empreinte' => $empreinte, 'change' => time()]), LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0600);
    return @rename($tmp, izr_fichier_admin());
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
function izr_scans_30_jours(?array $ids = null, ?array $portee = null): array
{
    $permis = $ids === null ? null : array_flip($ids);
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
            if ($permis !== null && !isset($permis[$id])) {
                continue; // un compte partenaire ne reçoit que ses propres magasins
            }
            if (!isset($parMagasin[$id])) {
                $parMagasin[$id] = array_fill(0, 30, 0);
            }
            $parMagasin[$id][$i] = (int) $n;
        }
    }
    return ['jours' => $jours, 'scans' => $parMagasin, 'portee' => $portee];
}

/** Les magasins dont ce compte peut voir les chiffres : le sien, ou ceux de son enseigne pour une maison mère. */
function izr_magasins_du_compte(string $id): array
{
    $a = izr_annuaire()[$id] ?? null;
    if ($a === null) {
        return [];
    }
    if ($a['type'] === 'magasin') {
        return [$id];
    }
    $ids = [];
    foreach (izr_annuaire() as $i => $m) {
        if ($m['type'] === 'magasin' && $m['enseigne'] === $a['enseigne']) {
            $ids[] = $i;
        }
    }
    return $ids;
}

/** Total des scans enregistrés pour ces magasins, toutes dates confondues. */
function izr_scans_total(array $ids): int
{
    $brut = @file_get_contents(izr_fichier_scans());
    $scans = is_string($brut) ? json_decode($brut, true) : null;
    $n = 0;
    foreach (is_array($scans) ? $scans : [] as $jour) {
        foreach ($ids as $id) {
            $n += (int) ($jour[$id] ?? 0);
        }
    }
    return $n;
}

function izr_ligne(string $s, int $max): string
{
    return mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s) ?? ''), 0, $max);
}

/** Le magasin (ou la maison mère) confirme ses coordonnées et valide son compte. Rend un message d'erreur, ou ''. */
function izr_valider_compte(string $id, array $post): string
{
    $email = strtolower(izr_ligne((string) ($post['contact_email'] ?? ''), 160));
    $nom = izr_ligne((string) ($post['contact_nom'] ?? ''), 80);
    $tel = izr_ligne((string) ($post['contact_telephone'] ?? ''), 30);
    if ($nom === '') {
        return 'Indiquez le nom de la personne à contacter.';
    }
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        return 'Cette adresse e-mail n\'est pas valide.';
    }
    if ($tel !== '' && !preg_match('/^[0-9 +().-]{6,30}$/', $tel)) {
        return 'Ce numéro de téléphone n\'est pas valide.';
    }
    if (($post['confirmation'] ?? '') !== 'oui') {
        return 'Cochez la case de confirmation pour valider votre compte.';
    }
    $ok = izr_comptes_modifier(function (array &$tous) use ($id, $email, $nom, $tel): void {
        if (isset($tous[$id])) {
            $tous[$id]['contact'] = ['email' => $email, 'nom' => $nom, 'telephone' => $tel];
            $tous[$id]['valide'] = time();
        }
    });
    return $ok ? '' : 'L\'enregistrement a échoué. Réessayez dans un instant.';
}

/** Envoie un e-mail en texte, avec d'éventuelles pièces jointes [['nom' => …, 'type' => …, 'contenu' => …]]. */
function izr_courriel(string $a, string $objet, string $texte, array $pieces = []): bool
{
    $limite = 'izr-' . bin2hex(random_bytes(12));
    $corps = '--' . $limite . "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($texte));
    foreach ($pieces as $p) {
        $corps .= '--' . $limite . "\r\nContent-Type: " . $p['type'] . '; name="' . $p['nom'] . "\"\r\nContent-Transfer-Encoding: base64\r\n"
            . 'Content-Disposition: attachment; filename="' . $p['nom'] . "\"\r\n\r\n" . chunk_split(base64_encode($p['contenu']));
    }
    $corps .= '--' . $limite . "--\r\n";
    $entetes = "From: IzenRide <support@izenride.com>\r\nReply-To: support@izenride.com\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"" . $limite . '"';
    return @mail($a, mb_encode_mimeheader($objet, 'UTF-8', 'B', "\r\n"), $corps, $entetes);
}

/** Envoie au compte validé ses accès, son QR code, le mode d'emploi et ses chiffres. Rend un message d'erreur, ou ''. */
function izr_envoyer_informations(string $id): string
{
    $a = izr_annuaire()[$id] ?? null;
    $c = izr_comptes_lire()[$id] ?? null;
    $email = is_array($c) ? (string) ($c['contact']['email'] ?? '') : '';
    if ($a === null || empty($c['valide']) || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        return 'Ce compte n\'a pas encore été validé : il n\'y a pas d\'adresse à laquelle écrire.';
    }
    $estMagasin = $a['type'] === 'magasin';
    $nomCourt = $estMagasin ? $a['nom'] : $a['enseigne'];
    $ids = [$id];
    if (!$estMagasin) {
        $ids = [];
        foreach (izr_annuaire() as $i => $m) {
            if ($m['type'] === 'magasin' && $m['enseigne'] === $a['enseigne']) {
                $ids[] = $i;
            }
        }
    }
    $aujourdhui = (new DateTimeImmutable('now', new DateTimeZone(IZR_FUSEAU_DAFFICHAGE)))->format('d/m/Y');
    $t = 'Bonjour ' . ($c['contact']['nom'] ?? '') . ",\n\n"
        . 'Le compte IzenRide de ' . $nomCourt . " est validé. Voici vos informations.\n\n"
        . "VOS ACCÈS\n"
        . "Espace pro : https://izenride.fr/espace-pro.html\n"
        . 'Identifiant : ' . $id . "\n"
        . 'Mot de passe : celui qui vous a été remis' . ($estMagasin ? ' par votre enseigne' : ' par IzenRide') . ". Il ne figure pas dans cet e-mail.\n\n";
    if ($estMagasin) {
        $t .= "VOTRE QR CODE 2027\n"
            . "Il est joint à cet e-mail et disponible à cette adresse :\n"
            . 'https://izenride.fr/assets/qr/2027/' . $id . ".png\n"
            . "Il est valable du 1er janvier au 31 décembre 2027.\n\n"
            . "MODE D'EMPLOI\n"
            . "1. Imprimez le QR code (10 cm de côté au minimum) et affichez-le à l'accueil ou près de la caisse.\n"
            . "2. Votre client le scanne avec l'appareil photo de son téléphone.\n"
            . "3. Il arrive sur une page IzenRide au nom de votre magasin et télécharge l'application.\n"
            . "Chaque scan est compté pour votre magasin.\n\n"
            . "VOS CHIFFRES\n"
            . 'Scans de votre QR code au ' . $aujourdhui . ' : ' . izr_scans_total($ids) . "\n\n";
    } else {
        $t .= "MODE D'EMPLOI\n"
            . 'Chacun de vos ' . count($ids) . " magasins dispose de son propre QR code, valable du 1er janvier au 31 décembre 2027.\n"
            . "Le magasin l'affiche à l'accueil ou près de la caisse ; le client le scanne avec son téléphone,\n"
            . "arrive sur une page IzenRide au nom du magasin et télécharge l'application.\n"
            . "Chaque scan est compté pour le magasin concerné.\n\n"
            . "VOS CHIFFRES\n"
            . 'Scans des QR codes de vos magasins au ' . $aujourdhui . ' : ' . izr_scans_total($ids) . "\n\n";
    }
    $t .= "Une question ? Écrivez-nous à support@izenride.com.\n\nL'équipe IzenRide\n";

    $pieces = [];
    $image = $estMagasin ? @file_get_contents(__DIR__ . '/assets/qr/2027/' . $id . '.png') : false;
    if (is_string($image)) {
        $pieces[] = ['nom' => 'qr-code-2027-' . $id . '.png', 'type' => 'image/png', 'contenu' => $image];
    }
    if (!izr_courriel($email, 'IzenRide : vos informations partenaire (' . $nomCourt . ')', $t, $pieces)) {
        return 'L\'hébergement a refusé l\'envoi de l\'e-mail à ' . $email . '.';
    }
    izr_comptes_modifier(function (array &$tous) use ($id): void {
        if (isset($tous[$id])) {
            $tous[$id]['envoye'] = time();
        }
    });
    return '';
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

    if ($action === 'reinitialiser' && isset($annuaire[$id])) {
        $ok = izr_comptes_modifier(function (array &$tous) use ($id): void {
            unset($tous[$id]);
        });
        $r[$ok ? 'message' : 'erreur'] = $ok
            ? $annuaire[$id]['nom'] . ' : compte remis à zéro (mot de passe, validation et coordonnées effacés).'
            : 'Le fichier des comptes n\'a pas pu être écrit sur l\'hébergement.';
        return $r;
    }

    if ($action === 'envoyer' && isset($annuaire[$id])) {
        $erreur = izr_envoyer_informations($id);
        if ($erreur !== '') {
            $r['erreur'] = $erreur;
        } else {
            $r['message'] = $annuaire[$id]['nom'] . ' : informations envoyées à ' . (izr_comptes_lire()[$id]['contact']['email'] ?? '') . '.';
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
    $valide = !empty($c['valide']);
    $etat = !$aMdp ? ['Sans mot de passe', 'pc-gris'] : (!$actif ? ['Suspendu', 'pc-suspendu'] : ($valide ? ['Validé', 'pc-actif'] : ['En attente de validation', 'pc-attente']));
    $champs = '<input type="hidden" name="jeton" value="' . $jeton . '"><input type="hidden" name="compte" value="' . izr_h($id) . '">';
    $form = '<form method="post" action="' . $retour . '">' . $champs;
    if (!$aMdp) {
        $actions = $form . '<button class="pc-btn pc-btn-fort" name="action" value="generer">Générer un mot de passe</button></form>';
    } else {
        $actions = '<details class="pc-details"><summary class="pc-btn">Nouveau mot de passe</summary>' . $form
            . '<p>L\'ancien mot de passe cessera de fonctionner tout de suite.</p><button class="pc-btn pc-btn-fort" name="action" value="generer">Confirmer</button></form></details>'
            . $form . '<button class="pc-btn" name="action" value="' . ($actif ? 'suspendre' : 'reactiver') . '">' . ($actif ? 'Suspendre' : 'Réactiver') . '</button></form>'
            . '<details class="pc-details"><summary class="pc-btn">Remettre à zéro</summary>' . $form
            . '<p>Efface le mot de passe, la validation et les coordonnées de ce compte. Les scans sont conservés.</p><button class="pc-btn pc-btn-fort" name="action" value="reinitialiser">Confirmer</button></form></details>';
    }
    if ($valide && $actif) {
        $actions = $form . '<button class="pc-btn pc-btn-fort" name="action" value="envoyer">' . (empty($c['envoye']) ? 'Envoyer les informations' : 'Renvoyer les informations') . '</button></form>' . $actions;
    }
    $contact = $valide
        ? '<span class="pc-date pc-contact"><small>Validé le ' . izr_date($c['valide']) . '</small>' . izr_h(($c['contact']['nom'] ?? '') . ' · ' . ($c['contact']['email'] ?? '') . (($c['contact']['telephone'] ?? '') !== '' ? ' · ' . $c['contact']['telephone'] : ''))
            . '<small>' . (empty($c['envoye']) ? 'Informations pas encore envoyées' : 'Informations envoyées le ' . izr_date($c['envoye'])) . '</small></span>'
        : '<span class="pc-date pc-contact"><small>Validation</small>—</span>';
    if ($a['type'] === 'magasin') {
        $actions .= '<a class="pc-btn" href="/assets/qr/2027/' . izr_h($id) . '.svg" download="qr-2027-' . izr_h($id) . '.svg">QR code 2027</a>';
    }
    return '<li><div class="pc-qui"><b>' . izr_h($a['nom']) . '</b><code>' . izr_h($id) . '</code></div>'
        . '<span class="pc-etat ' . $etat[1] . '">' . $etat[0] . '</span>'
        . '<span class="pc-date"><small>Mot de passe généré</small>' . izr_date($c['genere'] ?? null) . '<small>Dernière connexion</small>' . izr_date($c['derniere_connexion'] ?? null) . '</span>'
        . $contact
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

    $n = ['valide' => 0, 'attente' => 0, 'sans' => 0, 'suspendu' => 0];
    foreach ($annuaire as $id => $a) {
        $c = $comptes[$id] ?? [];
        $n[empty($c['empreinte']) ? 'sans' : (empty($c['actif']) ? 'suspendu' : (!empty($c['valide']) ? 'valide' : 'attente'))]++;
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
        . '<div class="ps-tuile"><span class="ps-etq">Comptes validés</span><b>' . $n['valide'] . '</b><small>coordonnées confirmées</small></div>'
        . '<div class="ps-tuile"><span class="ps-etq">En attente</span><b>' . $n['attente'] . '</b><small>mot de passe remis, pas encore validé</small></div>'
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
