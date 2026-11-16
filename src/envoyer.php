<?php
// Envoi du formulaire de contact (règle 5.4). Ce fichier n'est publié que si
// « formulaire.actif » vaut true dans donnees/site.json.
// Le message est transmis par e-mail à l'USL et n'est enregistré nulle part :
// ni fichier, ni base de données, ni journal.
// Les trois valeurs ci-dessous sont remplies par outils/construire.mjs.
declare(strict_types=1);

const DESTINATAIRE = '__DESTINATAIRE__';
const EXPEDITEUR = '__EXPEDITEUR__';
const DELAI_MINIMUM = __DELAI__; // secondes entre le début de la saisie et l'envoi

function terminer(bool $envoye): never
{
    header('Location: ' . ($envoye ? '/contact/merci/' : '/contact/erreur/'), true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    terminer(false);
}
// Le formulaire doit venir du site lui-même.
$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origine !== '' && parse_url($origine, PHP_URL_HOST) !== explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]) {
    terminer(false);
}

$champ = static fn (string $nom): string => is_string($_POST[$nom] ?? null) ? trim($_POST[$nom]) : '';
$nom = $champ('nom');
$courriel = $champ('courriel');
$message = $champ('message');

// Champ piège : invisible pour les visiteurs, rempli par les robots. On répond
// comme si tout allait bien, sans rien envoyer.
if ($champ('site_web') !== '') {
    terminer(true);
}
// Délai minimum : un envoi trop rapide (ou sans heure de départ) est refusé.
$depart = $champ('depart');
if (!ctype_digit($depart)) {
    terminer(false);
}
$ecoule = microtime(true) - ((float) $depart / 1000);
if ($ecoule < DELAI_MINIMUM || $ecoule > 86400) {
    terminer(false);
}

$sansRetourLigne = static fn (string $v): bool => !preg_match('/[\r\n]/', $v);
if (
    $nom === '' || mb_strlen($nom) > 100 || !$sansRetourLigne($nom)
    || mb_strlen($courriel) > 200 || !$sansRetourLigne($courriel)
    || filter_var($courriel, FILTER_VALIDATE_EMAIL) === false
    || $message === '' || mb_strlen($message) > 5000
) {
    terminer(false);
}

$sujet = '=?UTF-8?B?' . base64_encode('Message du site : ' . $nom) . '?=';
$corps = "Nom : $nom\nE-mail : $courriel\n\n$message\n";
$entetes = [
    'From' => EXPEDITEUR,
    'Reply-To' => $courriel,
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
];

terminer(mail(DESTINATAIRE, $sujet, $corps, $entetes));
