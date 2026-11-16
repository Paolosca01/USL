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
