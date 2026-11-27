<?php
/**
 * Rapport hebdomadaire des scans — lancé par la tâche planifiée (cron) de l'hébergement, jamais par le web
 * (.htaccess répond 404 à cette adresse).
 *
 * Chaque lundi entre 9 h et midi (heure de Paris) :
 *   - chaque magasin au compte validé reçoit le rapport de son magasin ;
 *   - chaque maison mère au compte validé reçoit le rapport de tous les magasins de son enseigne.
 * La tâche peut tourner toutes les heures : le script décide seul s'il est l'heure, et n'envoie qu'une
 * fois par semaine et par destinataire (état dans espace-pro-rapports.json, au-dessus du dossier du site).
 *
 * Essais en ligne de commande :  --simuler=2026-11-30T09:05  (fausse date)   --essai  (n'envoie rien)
 */
declare(strict_types=1);

const IZR_PRO = true;
require __DIR__ . '/espace-pro-lib.php';

const IZR_RAPPORT_HEURE = 9; // heure de Paris à partir de laquelle le rapport du lundi part

$options = getopt('', ['simuler:', 'essai']);
$fuseau = new DateTimeZone(IZR_FUSEAU_DAFFICHAGE);
$maintenant = new DateTimeImmutable(is_string($options['simuler'] ?? null) ? $options['simuler'] : 'now', $fuseau);
$essai = isset($options['essai']);

// Le lundi de la semaine en cours : le rapport couvre les sept jours qui le précèdent.
$lundi = $maintenant->modify('monday this week')->setTime(0, 0);
// Uniquement le lundi matin, de 9 h à midi : un passage manqué n'est pas rattrapé plus tard dans la
// semaine, et un compte validé le jeudi ne reçoit pas un rapport hors calendrier.
if ($maintenant->format('N') !== '1' || (int) $maintenant->format('G') < IZR_RAPPORT_HEURE || (int) $maintenant->format('G') >= 12) {
    echo "Rien à envoyer maintenant : le rapport part le lundi à " . IZR_RAPPORT_HEURE . " h (heure de Paris).\n";
    exit(0);
}
$cle = $lundi->format('Y-m-d');
$fichierEtat = dirname(__DIR__) . '/espace-pro-rapports.json';
$brut = @file_get_contents($fichierEtat);
$etat = is_string($brut) ? json_decode($brut, true) : null;
if (!is_array($etat) || ($etat['semaine'] ?? '') !== $cle) {
    $etat = ['semaine' => $cle, 'envoyes' => []];
}

$brut = @file_get_contents(izr_fichier_scans());
$scans = is_string($brut) ? json_decode($brut, true) : null;
$scans = is_array($scans) ? $scans : [];

$JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
$semaine = [];   // les 7 dates du rapport
$avant = [];     // les 7 dates de la semaine d'avant
for ($i = 0; $i < 7; $i++) {
    $semaine[] = $lundi->modify('-' . (7 - $i) . ' days');
    $avant[] = $lundi->modify('-' . (14 - $i) . ' days');
}
$periode = 'du ' . $semaine[0]->format('d/m/Y') . ' au ' . $semaine[6]->format('d/m/Y');

/** Les chiffres d'un magasin : par jour, semaine, semaine précédente, depuis le début. */
$chiffres = function (string $id) use ($scans, $semaine, $avant, $lundi): array {
    $jours = [];
    foreach ($semaine as $d) {
        $jours[] = (int) ($scans[$d->format('Y-m-d')][$id] ?? 0);
    }
    $prec = 0;
    foreach ($avant as $d) {
        $prec += (int) ($scans[$d->format('Y-m-d')][$id] ?? 0);
    }
    $total = 0;
    foreach ($scans as $jour => $parMagasin) {
        if ($jour < $lundi->format('Y-m-d')) {
            $total += (int) ($parMagasin[$id] ?? 0);
        }
    }
    return ['jours' => $jours, 'semaine' => array_sum($jours), 'precedente' => $prec, 'total' => $total];
};
$evolution = function (int $n, int $prec): string {
    $d = $n - $prec;
    return $d === 0 ? 'stable' : ($d > 0 ? '+' . $d : (string) $d);
};

$annuaire = izr_annuaire();
$comptes = izr_comptes_lire();
$envois = 0;
$echecs = 0;

foreach ($annuaire as $id => $a) {
    $c = $comptes[$id] ?? [];
    $email = (string) ($c['contact']['email'] ?? '');
    if (empty($c['valide']) || empty($c['actif']) || filter_var($email, FILTER_VALIDATE_EMAIL) === false || in_array($id, $etat['envoyes'], true)) {
        continue;
    }
    $pieces = [];
    $t = 'Bonjour ' . ($c['contact']['nom'] ?? '') . ",\n\n";
    if ($a['type'] === 'magasin') {
        $k = $chiffres($id);
        $t .= 'Voici le rapport de ' . $a['nom'] . ' pour la semaine ' . $periode . ".\n\n"
            . "SCANS DE VOTRE QR CODE\n"
            . 'Cette semaine : ' . $k['semaine'] . "\n"
            . 'Semaine précédente : ' . $k['precedente'] . ' (évolution : ' . $evolution($k['semaine'], $k['precedente']) . ")\n"
            . 'Depuis le début : ' . $k['total'] . "\n\n"
            . "JOUR PAR JOUR\n";
        foreach ($semaine as $i => $d) {
            $t .= ucfirst($JOURS[$i]) . ' ' . $d->format('d/m') . ' : ' . $k['jours'][$i] . "\n";
        }
        $objet = 'IzenRide : votre rapport de la semaine (' . $a['nom'] . ')';
    } else {
        $ids = izr_magasins_du_compte($id);
        $lignes = [];
        $tot = ['semaine' => 0, 'precedente' => 0, 'total' => 0];
        $valides = 0;
        foreach ($ids as $i) {
            $k = $chiffres($i);
            $estValide = !empty($comptes[$i]['valide']);
            $valides += $estValide ? 1 : 0;
            foreach ($tot as $champ => $v) {
                $tot[$champ] += $k[$champ];
            }
            $lignes[] = ['id' => $i, 'nom' => $annuaire[$i]['nom'], 'dept' => $annuaire[$i]['dept'], 'valide' => $estValide] + $k;
        }
        $csv = "\u{FEFF}" . 'Département;Magasin;Identifiant;' . implode(';', array_map(fn ($d, $j) => ucfirst($j) . ' ' . $d->format('d/m'), $semaine, $JOURS))
            . ";Scans de la semaine;Semaine précédente;Depuis le début;Compte validé\r\n";
        foreach ($lignes as $l) {
            $csv .= $l['dept'] . ';' . $l['nom'] . ';' . $l['id'] . ';' . implode(';', $l['jours']) . ';' . $l['semaine'] . ';' . $l['precedente'] . ';' . $l['total'] . ';' . ($l['valide'] ? 'oui' : 'non') . "\r\n";
        }
        $pieces[] = ['nom' => 'rapport-' . $id . '-' . $semaine[0]->format('Y-m-d') . '.csv', 'type' => 'text/csv; charset=UTF-8', 'contenu' => $csv];
        usort($lignes, fn ($x, $y) => $y['semaine'] <=> $x['semaine'] ?: strcmp($x['nom'], $y['nom']));
        $t .= 'Voici le rapport de vos ' . count($ids) . ' magasins ' . $a['enseigne'] . ' pour la semaine ' . $periode . ".\n"
            . "Le détail de chaque magasin, jour par jour, est dans le fichier joint (il s'ouvre dans Excel).\n\n"
            . "SCANS DES QR CODES\n"
            . 'Cette semaine : ' . $tot['semaine'] . "\n"
            . 'Semaine précédente : ' . $tot['precedente'] . ' (évolution : ' . $evolution($tot['semaine'], $tot['precedente']) . ")\n"
            . 'Depuis le début : ' . $tot['total'] . "\n\n"
            . "COMPTES DES MAGASINS\n"
            . 'Comptes validés : ' . $valides . ' sur ' . count($ids) . "\n\n"
            . "LES DIX MAGASINS LES PLUS ACTIFS CETTE SEMAINE\n";
        foreach (array_slice($lignes, 0, 10) as $n => $l) {
            $t .= ($n + 1) . '. ' . $l['nom'] . ' : ' . $l['semaine'] . ' scans (semaine précédente : ' . $l['precedente'] . ")\n";
        }
        $objet = 'IzenRide : rapport de la semaine de vos magasins (' . $a['enseigne'] . ')';
    }
    $t .= "\nINSCRIPTIONS ET FORFAITS\nCes chiffres ne sont pas encore disponibles dans le rapport.\n\n"
        . "Vos chiffres en direct : https://izenride.fr/espace-pro.html\n\n"
        . "Une question ? Écrivez-nous à support@izenride.com.\n\nL'équipe IzenRide\n";

    if ($essai) {
        echo "--- $id -> $email\n$objet\n$t\n";
        continue;
    }
    if (izr_courriel($email, $objet, $t, $pieces)) {
        $envois++;
        $etat['envoyes'][] = $id;
        @file_put_contents($fichierEtat, json_encode($etat), LOCK_EX);
        @chmod($fichierEtat, 0600);
    } else {
        $echecs++;
    }
}
if (!$essai) {
    @file_put_contents($fichierEtat, json_encode($etat), LOCK_EX);
}
echo 'Rapport de la semaine ' . $periode . ' : ' . $envois . ' envoyé(s), ' . $echecs . ' échec(s), ' . count($etat['envoyes']) . " destinataire(s) servis au total.\n";
