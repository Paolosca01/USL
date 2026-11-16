# Site de l'USL Cugy

Site statique de l'Union des sociétés locales de Cugy (VD). Les contenus sont dans des fichiers JSON ; un script fabrique les pages HTML. Aucun cookie, aucun traceur, aucune requête vers un autre site.

> **État : projet non publiable tel quel.** Les couleurs, l'échelle typographique et les espacements sont provisoires (le logo et le DESIGN.md n'ont pas encore été fournis), et de nombreuses informations manquent. Voir [A-COMPLETER.md](A-COMPLETER.md).

## Modifier le contenu

Tout se passe dans le dossier `donnees/`. On ne touche jamais à la mise en page.

| Fichier | Contenu |
|---|---|
| `manifestations.json` | les manifestations |
| `societes.json` | les sociétés membres |
| `comite.json` | le comité et les membres d'honneur |
| `photos.json` | les photos, leur crédit et leur autorisation |
| `site.json` | adresse, hébergeur, textes généraux, formulaire |

Une information inconnue s'écrit `"[À COMPLÉTER]"` : elle apparaît surlignée sur le site et dans la liste `A-COMPLETER.md`.

### Ajouter une manifestation

Dans `donnees/manifestations.json`, copiez un bloc existant (de `{` à `}`), collez-le à la suite, séparé par une virgule, puis remplissez :

```json
{
  "slug": "marche-de-noel",
  "nom": "Marché de Noël",
  "date": "2026-12-05",
  "heure_debut": "17:00",
  "heure_fin": "21:00",
  "lieu": { "nom": "Nom du lieu", "adresse": "Rue et numéro, 1053 Cugy", "lien_carte": null },
  "description": ["Premier paragraphe.", "Deuxième paragraphe."],
  "organisateur": "Nom de la société",
  "prix": "Entrée libre",
  "inscription": "Sans inscription",
  "parking": "Où se garer",
  "contact": "Nom de la société ou du comité",
  "galerie": []
}
```

- `slug` : le nom de la page, en minuscules, sans accents, avec des tirets. Il ne doit plus changer ensuite.
- `date` : année-mois-jour. Mettez `null` si elle n'est pas connue : la manifestation apparaît alors sous « Date à confirmer » et n'entre pas dans le carrousel.
- `date_fin` (facultatif) : pour une manifestation sur plusieurs jours.
- Heures au format `"17:00"`, ou `null`.
- `contact` : un nom de société ou de fonction. Pas de téléphone ni d'adresse privée.

Le carrousel de l'accueil montre les six prochaines manifestations datées ; la liste « Prochaines manifestations », les cinq prochaines.

### Ajouter une photo

1. Déposez le fichier dans `images/evenements/`, nommé comme le `slug` de la manifestation : `images/evenements/marche-de-noel.jpg`.
2. Dans `donnees/photos.json`, remplissez l'entrée correspondante :

```json
{
  "fichier": "evenements/marche-de-noel.jpg",
  "alt": "Les stands du marché de Noël devant la grande salle",
  "credit": "Prénom Nom",
  "autorisation": true,
  "point_focal": { "x": 50, "y": 40 }
}
```

Une photo n'est publiée que si `autorisation` vaut `true` et que le texte alternatif et le crédit sont remplis. `point_focal` indique, en pour-cent depuis le coin supérieur gauche, la partie de l'image à garder au recadrage.

- Photos des éditions passées : déposez-les dans `images/galerie/`, déclarez-les dans `photos.json`, puis ajoutez leur nom dans la liste `galerie` de la manifestation, par exemple `"galerie": ["galerie/noel-2025-1.jpg"]`.
- Portraits du comité : dans `images/comite/`, déclarés dans `photos.json`, puis `"photo": "comite/prenom-nom.jpg"` sur la personne dans `comite.json`.
- Logo : `images/logo.svg` (ou `.png`). Statuts : `documents/statuts.pdf`.

### Personnes

Chaque personne a un champ `accord_publication`. Le site n'affiche que celles à `true`. Les contacts des sociétés sont à `false` tant que leur accord n'est pas confirmé.

## Générer le site

Il faut [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
npm install
```

```bash
npm run construire
```

```bash
npm run verifier
```

```bash
npm run apercu
```

- `construire` fabrique le site dans `public/`. C'est ce dossier, et lui seul, qu'on dépose chez l'hébergeur. En cas d'erreur dans un fichier JSON, le message dit laquelle.
- `verifier` contrôle les règles de conformité, les liens, les contrastes et le poids de la page d'accueil. Avec `npm run verifier -- --strict`, il échoue aussi tant qu'il reste des `[À COMPLÉTER]` : à utiliser avant la mise en ligne.
- `apercu` affiche le site sur http://localhost:8080.
- `npm run a-completer` met à jour `A-COMPLETER.md`.

Le site est figé au moment où on le génère. Une manifestation passée disparaît d'elle-même du carrousel et de la liste « à venir » dans le navigateur du visiteur, mais il vaut mieux régénérer le site après chaque changement.

## Mise en ligne

- `public/.htaccess` (Apache) et `public/_headers` (Netlify, Cloudflare Pages) contiennent la redirection HTTPS et les en-têtes de sécurité. Selon l'hébergeur, un seul des deux sert.
- Le formulaire de contact est désactivé : la page Contact affiche l'adresse e-mail. Pour l'activer chez un hébergeur suisse ou européen qui propose PHP, mettez dans `donnees/site.json` `"actif": true` et `"expediteur"` (une adresse du domaine du site), puis mettez à jour la page « Protection des données » si nécessaire.

## Organisation du code

| Dossier | Rôle |
|---|---|
| `donnees/` | les contenus |
| `images/`, `documents/` | photos, logo, statuts |
| `gabarits/` | la structure des pages |
| `src/` | feuille de style, script, police, image de partage |
| `outils/` | génération, vérification, aperçu |
| `tests/` | données fictives et essais du carrousel |
| `licences/` | licences des éléments tiers (voir [CREDITS.md](CREDITS.md)) |

Les couleurs, tailles et espacements sont regroupés au début de `src/css/site.css`. Si on change les couleurs, relancer `node outils/image-partage.mjs` pour refaire l'image de partage.

### Essais dans un navigateur

Ils demandent Playwright, qui n'est pas installé par `npm install`. On génère d'abord le site avec les données fictives de `tests/` :

```bash
node tests/preparer-images.mjs
```

```bash
USL_DONNEES=tests/donnees USL_IMAGES=tests/images npm run construire
```

Puis, pendant que `npm run apercu` tourne dans un autre terminal :

```bash
node outils/controle-navigateur.mjs
```

```bash
node tests/carrousel.mjs
```

Le premier contrôle les requêtes vers d'autres domaines, les erreurs de console, les décalages de mise en page et la taille des zones cliquables à 360, 768 et 1280 px. Le second essaie le carrousel.

Voir aussi [CONFORMITE.md](CONFORMITE.md) : le tableau des règles de droit suisse et la façon dont chacune est respectée.
