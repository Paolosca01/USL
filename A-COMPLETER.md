# À compléter avant publication

Liste générée par `npm run a-completer`. Ne la modifiez pas à la main : complétez les fichiers de `donnees/` (ou `outils/a-completer-manuel.md` pour la première partie), puis relancez la commande.

## Décisions et validations en attente

- [ ] **Logo et DESIGN.md non reçus.** La palette, l'échelle typographique, les espacements et les rayons actuels sont provisoires (début de `src/css/site.css`). La police Archivo a été choisie sans connaître celle du DESIGN.md. À refaire dès réception, puis relancer `node outils/image-partage.mjs`.
- [ ] **Hébergeur à choisir.** Il détermine : le fichier d'en-têtes utilisé (`.htaccess` ou `_headers`), le certificat HTTPS, et la possibilité d'activer le formulaire de contact (hébergement en Suisse ou dans l'UE avec PHP). D'ici là, la page Contact affiche l'adresse e-mail seule.
- [ ] **Formulaire de contact** (si activé) : adresse d'expédition du domaine à indiquer dans `donnees/site.json` (`formulaire.expediteur`), et essai d'envoi réel chez l'hébergeur.
- [ ] **Pages « Mentions légales » et « Protection des données »** : projets à faire valider par le comité. Ils n'ont pas été relus par un juriste.
- [ ] **Liste des sociétés (2024)** à valider par le comité. Le cahier des charges annonce 23 sociétés, la liste fournie en compte 24.
- [ ] **Catégories des sociétés** (sport, culture, jeunesse, autre) : attribuées d'après le nom de chaque société, à vérifier.
- [ ] **Capoeira Siva** : la personne de contact n'a qu'un nom de famille (« De Oliveira »).
- [ ] **Membres d'honneur** : `accord_publication` est à `true`, comme pour le comité. À confirmer qu'ils figurent bien sur le site actuel.
- [ ] **Fête Nationale** : l'année n'était pas indiquée ; le 1er août 2027 a été retenu.
- [ ] **Dépôt GitHub** : `donnees/societes.json` contient les noms des personnes de contact dont l'accord n'est pas encore confirmé. Le site ne les affiche pas, mais le dépôt doit rester privé tant que ces accords manquent.
- [ ] **Lien « Voir sur la carte »** : il pointe vers map.geo.admin.ch avec l'adresse du lieu. Il n'a pas pu être essayé (aucun lieu n'a encore d'adresse) ; à vérifier sur la première manifestation complétée. Un autre lien peut être imposé par manifestation avec `lieu.lien_carte`.
- [ ] **Statistiques de fréquentation** : aucune. Si elles sont souhaitées plus tard, uniquement un outil sans cookies hébergé en Suisse ou dans l'UE, à mentionner dans « Protection des données ».

## Dans les données (99 éléments)

### Informations générales (donnees/site.json)

- [ ] adresse_postale
- [ ] hebergeur
- [ ] realisation
- [ ] protection_des_donnees.google_pays_et_garanties
- [ ] protection_des_donnees.duree_conservation_messages
- [ ] protection_des_donnees.duree_conservation_journaux
- [ ] credits_photo_generaux

### Fichiers à fournir

- [ ] Logo de l’USL : images/logo.svg (ou .png)
- [ ] Statuts : documents/statuts.pdf

### Manifestation « Apéro de la Nouvelle Année » (donnees/manifestations.json)

- [ ] date
- [ ] heure_debut
- [ ] lieu.nom
- [ ] lieu.adresse
- [ ] description[1]
- [ ] organisateur
- [ ] prix
- [ ] inscription
- [ ] parking
- [ ] contact

### Manifestation « Petit Marché de Cugy » (donnees/manifestations.json)

- [ ] date
- [ ] heure_debut
- [ ] lieu.nom
- [ ] lieu.adresse
- [ ] description[1]
- [ ] organisateur
- [ ] prix
- [ ] inscription
- [ ] parking
- [ ] contact

### Manifestation « Fête des Aînés » (donnees/manifestations.json)

- [ ] date
- [ ] heure_debut
- [ ] lieu.nom
- [ ] lieu.adresse
- [ ] description[1]
- [ ] organisateur
- [ ] prix
- [ ] inscription
- [ ] parking
- [ ] contact

### Manifestation « Fête Nationale » (donnees/manifestations.json)

- [ ] heure_debut
- [ ] lieu.nom
- [ ] lieu.adresse
- [ ] description[1]
- [ ] organisateur
- [ ] prix
- [ ] inscription
- [ ] parking
- [ ] contact
- [ ] à confirmer : Année à confirmer : le cahier des charges indique « 1er août » sans année ; la prochaine occurrence (2027) a été retenue.

### Manifestation « Soupe à la courge » (donnees/manifestations.json)

- [ ] date
- [ ] heure_debut
- [ ] lieu.nom
- [ ] lieu.adresse
- [ ] description[1]
- [ ] organisateur
- [ ] prix
- [ ] inscription
- [ ] parking
- [ ] contact

### Manifestation « Marché de Noël » (donnees/manifestations.json)

- [ ] date
- [ ] heure_debut
- [ ] lieu.nom
- [ ] lieu.adresse
- [ ] description[1]
- [ ] organisateur
- [ ] prix
- [ ] inscription
- [ ] parking
- [ ] contact

### Photos (donnees/photos.json)

- [ ] images/evenements/apero-de-la-nouvelle-annee.jpg : fichier à déposer, texte alternatif, crédit, autorisation à enregistrer
- [ ] images/evenements/petit-marche-de-cugy.jpg : fichier à déposer, texte alternatif, crédit, autorisation à enregistrer
- [ ] images/evenements/fete-des-aines.jpg : fichier à déposer, texte alternatif, crédit, autorisation à enregistrer
- [ ] images/evenements/fete-nationale.jpg : fichier à déposer, texte alternatif, crédit, autorisation à enregistrer
- [ ] images/evenements/soupe-a-la-courge.jpg : fichier à déposer, texte alternatif, crédit, autorisation à enregistrer
- [ ] images/evenements/marche-de-noel.jpg : fichier à déposer, texte alternatif, crédit, autorisation à enregistrer

### Accords de publication des contacts (donnees/societes.json)

- [ ] APE Haut-Talent : accord de la personne de contact à confirmer
- [ ] Atout Chœur, chœur mixte : accord de la personne de contact à confirmer
- [ ] Capoeira Siva : accord de la personne de contact à confirmer
- [ ] Concerts malgré tout : accord de la personne de contact à confirmer
- [ ] Fondation Echaud : accord de la personne de contact à confirmer
- [ ] Football Club de Cugy : accord de la personne de contact à confirmer
- [ ] Groupe Scout de la Croisée : accord de la personne de contact à confirmer
- [ ] Gym Dames : accord de la personne de contact à confirmer
- [ ] Gym Jeunesse : accord de la personne de contact à confirmer
- [ ] Gym-Volley Cugy : accord de la personne de contact à confirmer
- [ ] Jazzercise : accord de la personne de contact à confirmer
- [ ] Jeunesse de Cugy : accord de la personne de contact à confirmer
- [ ] La Boule du Billard : accord de la personne de contact à confirmer
- [ ] La Gym des Dames d’Onze heures : accord de la personne de contact à confirmer
- [ ] Lausanne-Ville – Cugy Handball : accord de la personne de contact à confirmer
- [ ] Mouvement du Centre : accord de la personne de contact à confirmer
- [ ] Paysannes vaudoises : accord de la personne de contact à confirmer
- [ ] Petit Conservatoire du Haut-Talent : accord de la personne de contact à confirmer
- [ ] Power Kick Boxing Cugy : accord de la personne de contact à confirmer
- [ ] Rancho Folclórico dos Amigos na Suíça : accord de la personne de contact à confirmer
- [ ] Sport pour Tous : accord de la personne de contact à confirmer
- [ ] Talent Solidaire : accord de la personne de contact à confirmer
- [ ] Tennis Club : accord de la personne de contact à confirmer
- [ ] VBC Sugnens-Cugy : accord de la personne de contact à confirmer
