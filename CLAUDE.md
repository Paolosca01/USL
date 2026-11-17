# USL Cugy : site web

Site de l'Union des sociétés locales de Cugy (VD), fondée en 1976, 23 sociétés membres. Il remplace [www.uslcugy.ch](https://www.uslcugy.ch). Public : habitants de tous âges, souvent sur téléphone. Le comité veut un site sobre, rapide, beau, qui n'ait pas l'air fait par une IA. Ce fichier reste court. Les détails sont dans docs/ et data/ : lis-les seulement quand la tâche en a besoin.

## Priorités, dans l'ordre

1. Conforme au droit suisse (section Droit).
2. Lisible et accessible pour tous les âges, téléphone d'abord.
3. Beau et sobre : une affiche de village rouge et blanc, pas une page de startup.
4. Facile à mettre à jour par un bénévole.

## Façon de travailler (économie de tokens)

* Une tâche à la fois. N'élargis pas la tâche sans qu'on te le demande.
* Modifie par petites éditions ciblées. Ne réécris jamais un fichier entier pour changer quelques lignes.
* Ne lis que les fichiers utiles à la tâche, une seule fois.
* Réponse finale : 3 lignes au plus (ce qui a changé, ce qui reste). Pas de récapitulatif, pas de code recopié dans la réponse.
* Pas de npm, pas de build, pas de dépendances, pas de commentaires superflus dans le code.
* Information manquante : ne l'invente pas. Laisse null dans data/ et continue.
* Avant la toute première page : montre la police choisie et décris l'accueil en 10 lignes, puis attends mon accord.

## Arborescence

* Pages : index.html, manifestations.html, manifestation.html?slug=…, societes.html, comite.html, contact.html, mentions-legales.html, protection-des-donnees.html
* css/style.css (un seul fichier, variables en tête) ; js/app.js (JS natif, moins de 15 Ko)
* data/evenements.json, data/societes.json, data/comite.json : tout le contenu vient d'ici
* images/evenements/<slug>.jpg ; fonts/ (WOFF2 + licence) ; CREDITS.md
* docs/design-refero.md : typo et espacements, à lire seulement pour le CSS
* docs/juridique.md : contenu des pages légales, à lire seulement pour ces deux pages
* Aperçu local : python3 -m http.server 8000 (les JSON ne se chargent pas en double-cliquant sur un fichier)

## Design

Typographie, espacements, rayons et composants : ceux de docs/design-refero.md. Ses couleurs et ses images : jamais. Police sous licence libre (OFL), fichiers WOFF2 dans fonts/. Si la police Refero n'est pas libre, prends la plus proche et dis laquelle.

Couleurs, uniquement ces variables : `:root{--rouge:#C8102E;--rouge-fonce:#9E0B22;--rouge-pale:#FBEAEC;--blanc:#FFFFFF;--texte:#1F1A1A;--texte-2:#5C5454;--bordure:#E8E2E2}`

Règles du rouge :

* Fond blanc ; sections alternées blanc et --rouge-pale. Environ 80 % de blanc, 20 % de rouge.
* Rouge plein réservé à : panneau du carrousel, pastille date, bouton principal, bloc photo manquante. Pied de page en --rouge-fonce.
* Sur fond rouge : texte blanc uniquement. Jamais de paragraphe en rouge. Liens en rouge, soulignés.
* Focus clavier : contour 3px --texte avec décalage blanc, visible sur rouge comme sur blanc.
* Erreurs de formulaire : icône et message écrit, jamais le rouge seul (le rouge est déjà la couleur du site).
* Pas d'armoiries (Confédération, canton, commune de Cugy) : leur emploi est réservé à la collectivité (LPAP). Pas de croix suisse décorative non plus : le site aurait l'air officiel.

Composition :

* Élément signature : la pastille date rouge (jour en petites capitales, grand chiffre, mois), identique partout.
* Grille 12 colonnes, largeur max 1120 px, lignes de 70 caractères max, texte de base 17 px, zones cliquables 44 px.
* Jamais de texte sur une photo : panneau rouge à côté (dessous sur téléphone). Ratios : 16:9 carrousel, 4:3 cartes, 1:1 portraits ; point focal lu dans les données.
* Photo absente ou autorisation false : bloc rouge avec le titre en blanc, comme une affiche.
* Typographie française : espaces fines insécables avant ; : ! ? et dans « », apostrophes courbes, chiffres tabulaires, titres en text-wrap: balance.
* Interdits : dégradés, ombres lourdes, verre dépoli, emojis, images IA ou de banque d'images, animations au défilement, slogans, compteurs, témoignages.
* Seule animation : transition du carrousel en 300 ms, coupée si prefers-reduced-motion.

## Pages

* Accueil : carrousel (6 s, bouton pause, flèches, points, glissement au doigt, clavier ; chaque diapositive mène à sa manifestation), 3 à 5 prochaines dates, présentation de l'USL en 3 phrases.
* Manifestation : photo, date, heures, lieu avec simple lien vers une carte (pas de carte intégrée), description, organisateur, prix, inscription, contact, bouton « Ajouter à mon agenda » (.ics), impression A4 propre.
* Manifestations : liste chronologique, filtre à venir / passées. Aucune à venir : message et lien vers les passées.
* Sociétés : cartes, recherche, filtre par catégorie (catégories proposées, à faire valider par le comité).
* Comité : cartes séparées comité / membres d'honneur, initiales à la place des photos.
* Contact : usl.cugy@gmail.com et formulaire (nom, e-mail, message).
* Pied de page : contact, statuts (PDF), Mentions légales, Protection des données.

## Données

* Valeur null : le site affiche « À confirmer » ou masque la ligne, jamais un champ vide ni « null ».
* Dates en ISO dans les données (2026-12-05, 17:00), affichées « samedi 5 décembre 2026, 17h00 ».
* Textes : français de Suisse romande, vouvoiement, phrases courtes. Prix en CHF. lang="fr-CH".

## Droit suisse (non négociable)

* Aucun cookie, aucun traceur, aucune requête vers un autre domaine : ni Google Fonts, Maps, Analytics, reCAPTCHA, CDN, vidéo ou bouton de réseau social intégré. Donc pas de bannière de cookies.
* Personnes : nom et fonction seulement, affichées seulement si accord_publication vaut true.
* Photos : affichées seulement si autorisation vaut true, avec leur crédit.
* Formulaire : aucune case précochée, une phrase d'information avec lien vers Protection des données, anti-spam par champ piège. Aucun service d'envoi tiers sans mon accord ; à défaut, lien mailto.
* Polices et code sous licence libre, listés dans CREDITS.md. HTTPS et Content-Security-Policy limitée au site.

## Une tâche est finie quand

* elle s'affiche bien à 360, 768 et 1280 px ;
* tout s'utilise au clavier ;
* aucune requête ne part vers un autre domaine. À la livraison finale seulement : la liste des valeurs null restantes dans data/.
