# Crédits et licences

## Ce qui est servi aux visiteurs

| Élément | Auteur | Licence | Fichier de licence |
|---|---|---|---|
| Police Archivo (fichier variable, sous-ensemble latin, WOFF2) | Omnibus-Type, The Archivo Project Authors | SIL Open Font License 1.1 | `licences/Archivo-OFL.txt` |

Le fichier `src/polices/archivo-latin-wght-normal.woff2` provient du paquet npm `@fontsource-variable/archivo` 5.x, qui redistribue la police sans la modifier. Il est hébergé sur le site ; rien n'est chargé depuis un serveur tiers.

Le reste (HTML, feuille de style, script) a été écrit pour ce site. Le site n'utilise aucune bibliothèque JavaScript, aucun jeu d'icônes, aucune image de banque d'images et aucune image générée par IA.

L'image de partage par défaut (`src/images/partage.png`) est une composition typographique fabriquée par `outils/image-partage.mjs` : le nom de l'USL en Archivo sur un aplat de couleur.

## Outils de fabrication (jamais servis aux visiteurs)

| Outil | Rôle | Licence | Fichier de licence |
|---|---|---|---|
| sharp | recadrage et conversion des photos (AVIF, WebP, JPEG) | Apache 2.0 | `licences/sharp-Apache-2.0.txt` |
| Playwright (facultatif, non installé par `npm install`) | essais dans un navigateur, image de partage | Apache 2.0 | — |

À noter : les binaires précompilés de sharp embarquent la bibliothèque libvips, sous licence LGPL 3.0 ou ultérieure. Elle ne sert qu'à préparer les images sur l'ordinateur qui génère le site ; aucun de ses fichiers n'est publié.

## Photos

Aucune photo n'est publiée pour l'instant. Chaque photo publiée porte le nom de son auteur (champ `credit` de `donnees/photos.json`) ; la liste complète est reprise automatiquement sur la page « Mentions légales ».
