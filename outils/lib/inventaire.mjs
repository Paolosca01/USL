// Inventaire de tout ce qui reste à compléter : champs [À COMPLÉTER],
// fichiers attendus, accords et autorisations en attente.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { MARQUE } from './util.mjs';

function parcourir(valeur, chemin, sortie) {
  if (typeof valeur === 'string') {
    if (valeur.includes(MARQUE)) sortie.push(chemin);
  } else if (Array.isArray(valeur)) {
    valeur.forEach((v, i) => parcourir(v, `${chemin}[${i + 1}]`, sortie));
  } else if (valeur && typeof valeur === 'object') {
    for (const [k, v] of Object.entries(valeur)) parcourir(v, chemin ? `${chemin}.${k}` : k, sortie);
  }
}

export function inventaire({ racine, donnees }) {
  const { site, manifestations, societes, photos } = donnees;
  const sections = [];

  const champsSite = [];
  parcourir(site, '', champsSite);
  sections.push({ titre: 'Informations générales (donnees/site.json)', lignes: champsSite });

  const fichiers = [];
  if (!['svg', 'png', 'webp'].some((e) => existsSync(path.join(racine, 'images', `logo.${e}`))))
    fichiers.push('Logo de l’USL : images/logo.svg (ou .png)');
  if (!existsSync(path.join(racine, site.statuts))) fichiers.push(`Statuts : ${site.statuts}`);
  sections.push({ titre: 'Fichiers à fournir', lignes: fichiers });

  for (const m of manifestations) {
    const lignes = [];
    if (!m.date) lignes.push('date');
    if (!m.heure_debut) lignes.push('heure_debut');
    const champs = [];
    parcourir({ ...m, a_confirmer: undefined }, '', champs);
    lignes.push(...champs);
    if (m.a_confirmer) lignes.push(`à confirmer : ${m.a_confirmer}`);
    sections.push({ titre: `Manifestation « ${m.nom} » (donnees/manifestations.json)`, lignes });
  }

  const lignesPhotos = [];
  for (const p of photos) {
    const manques = [];
    if (!existsSync(path.join(racine, 'images', p.fichier))) manques.push('fichier à déposer');
    if (String(p.alt).includes(MARQUE)) manques.push('texte alternatif');
    if (String(p.credit).includes(MARQUE)) manques.push('crédit');
    if (p.autorisation !== true) manques.push('autorisation à enregistrer');
    if (manques.length) lignesPhotos.push(`images/${p.fichier} : ${manques.join(', ')}`);
  }
  sections.push({ titre: 'Photos (donnees/photos.json)', lignes: lignesPhotos });

  const accords = societes
    .filter((s) => s.contact && s.contact.accord_publication !== true)
    .map((s) => `${s.nom} : accord de la personne de contact à confirmer`);
  sections.push({ titre: 'Accords de publication des contacts (donnees/societes.json)', lignes: accords });

  const total = sections.reduce((n, s) => n + s.lignes.length, 0);
  return { sections: sections.filter((s) => s.lignes.length), total };
}
