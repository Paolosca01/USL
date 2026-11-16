#!/usr/bin/env node
// Génère le site statique dans public/ à partir des fichiers JSON de donnees/.
// Usage : npm run construire
import { createHash } from 'node:crypto';
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { page } from '../gabarits/base.mjs';
import {
  accueil, listeManifestations, ficheManifestation, societes, comite, contact,
  messageEnvoye, messageRefuse, introuvable,
} from '../gabarits/pages.mjs';
import { mentionsLegales, protectionDonnees } from '../gabarits/legales.mjs';
import { preparerPhotos } from './lib/images.mjs';
import { genererIcs } from './lib/ics.mjs';
import { htaccess, fichierHeaders } from './lib/entetes.mjs';
import { inventaire } from './lib/inventaire.mjs';
import { aujourdHui, dateValide, heureValide } from './lib/util.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DONNEES = path.resolve(RACINE, process.env.USL_DONNEES ?? 'donnees');
const IMAGES = path.resolve(RACINE, process.env.USL_IMAGES ?? 'images');
const SORTIE = path.join(RACINE, 'public');

const lire = (nom) => {
  const fichier = path.join(DONNEES, nom);
  try {
    return JSON.parse(readFileSync(fichier, 'utf8'));
  } catch (e) {
    throw new Error(`Fichier illisible : ${path.relative(RACINE, fichier)}\n  ${e.message}\n  Vérifiez les virgules, les guillemets et les accolades.`);
  }
};

function valider(donnees) {
  const erreurs = [];
  const slugs = new Set();
  for (const m of donnees.manifestations) {
    const ou = `Manifestation « ${m.nom ?? m.slug ?? '?'} »`;
    if (!m.nom) erreurs.push(`${ou} : « nom » manquant.`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.slug ?? ''))
      erreurs.push(`${ou} : « slug » invalide (minuscules, chiffres et tirets uniquement, sans accents).`);
    if (slugs.has(m.slug)) erreurs.push(`${ou} : le « slug » ${m.slug} est utilisé deux fois.`);
    slugs.add(m.slug);
    if (m.date != null && !dateValide(m.date)) erreurs.push(`${ou} : « date » doit être au format AAAA-MM-JJ ou null.`);
    if (m.date_fin != null && (!dateValide(m.date_fin) || !m.date || m.date_fin < m.date))
      erreurs.push(`${ou} : « date_fin » doit être une date AAAA-MM-JJ postérieure à « date ».`);
    for (const c of ['heure_debut', 'heure_fin'])
      if (m[c] != null && !heureValide(m[c])) erreurs.push(`${ou} : « ${c} » doit être au format HH:MM ou null.`);
  }
  for (const s of donnees.societes) {
    if (!s.nom) erreurs.push('Société sans « nom ».');
    if (!['sport', 'culture', 'jeunesse', 'autre'].includes(s.categorie))
      erreurs.push(`Société « ${s.nom} » : « categorie » doit valoir sport, culture, jeunesse ou autre.`);
    if (s.contact && typeof s.contact.accord_publication !== 'boolean')
      erreurs.push(`Société « ${s.nom} » : « accord_publication » doit valoir true ou false.`);
    if (s.site_web && !/^https:\/\//.test(s.site_web))
      erreurs.push(`Société « ${s.nom} » : « site_web » doit commencer par https://.`);
  }
  for (const p of [...donnees.comite.comite, ...donnees.comite.membres_honneur])
    if (typeof p.accord_publication !== 'boolean')
      erreurs.push(`Comité, « ${p.nom} » : « accord_publication » doit valoir true ou false.`);
  for (const p of donnees.photos) {
    if (typeof p.autorisation !== 'boolean') erreurs.push(`Photo ${p.fichier} : « autorisation » doit valoir true ou false.`);
    if (!/^(evenements|galerie|comite)\/[a-z0-9-]+\.(jpe?g|png)$/.test(p.fichier ?? ''))
      erreurs.push(`Photo ${p.fichier} : le fichier doit être dans evenements/, galerie/ ou comite/, en minuscules sans accents (.jpg ou .png).`);
  }
  if (erreurs.length) throw new Error('Données à corriger :\n- ' + erreurs.join('\n- '));
}

function ecrire(chemin, contenu) {
  const cible = path.join(SORTIE, chemin);
  mkdirSync(path.dirname(cible), { recursive: true });
  writeFileSync(cible, contenu);
}
const empreinte = (fichier) => createHash('sha1').update(readFileSync(fichier)).digest('hex').slice(0, 8);

async function trouverLogo() {
  for (const ext of ['svg', 'png', 'webp']) {
    const source = path.join(IMAGES, `logo.${ext}`);
    if (!existsSync(source)) continue;
    let w = 0;
    let h = 0;
    if (ext === 'svg') {
      const svg = readFileSync(source, 'utf8');
      const vb = svg.match(/viewBox="[\d.\s-]*?([\d.]+)[\s,]+([\d.]+)"/);
      if (vb) [w, h] = [Number(vb[1]), Number(vb[2])];
    } else {
      const sharp = (await import('sharp')).default;
      ({ width: w, height: h } = await sharp(source).metadata());
    }
    if (!w || !h) throw new Error(`Logo : dimensions introuvables dans images/logo.${ext}.`);
    const hauteur = 48; // hauteur d'affichage dans l'en-tête
    cpSync(source, path.join(SORTIE, 'images', `logo.${ext}`));
    return { url: `/images/logo.${ext}?v=${empreinte(source)}`, w: Math.round((w / h) * hauteur), h: hauteur };
  }
  return null;
}

async function construire() {
  const donnees = {
    site: lire('site.json'),
    manifestations: lire('manifestations.json'),
    societes: lire('societes.json'),
    comite: lire('comite.json'),
    photos: lire('photos.json'),
  };
  valider(donnees);

  // On repart d'un dossier propre, en gardant les images déjà préparées (longues à recalculer).
  if (existsSync(SORTIE)) {
    for (const nom of readdirSync(SORTIE)) {
      if (nom === 'images') {
        for (const sous of readdirSync(path.join(SORTIE, 'images')))
          if (sous !== 'gen') rmSync(path.join(SORTIE, 'images', sous), { recursive: true, force: true });
      } else rmSync(path.join(SORTIE, nom), { recursive: true, force: true });
    }
  }
  mkdirSync(path.join(SORTIE, 'images'), { recursive: true });

  // Fichiers servis tels quels.
  cpSync(path.join(RACINE, 'src/css'), path.join(SORTIE, 'css'), { recursive: true });
  cpSync(path.join(RACINE, 'src/js'), path.join(SORTIE, 'js'), { recursive: true });
  cpSync(path.join(RACINE, 'src/polices'), path.join(SORTIE, 'polices'), { recursive: true });
  cpSync(path.join(RACINE, 'src/images'), path.join(SORTIE, 'images'), { recursive: true });
  cpSync(path.join(RACINE, 'src/favicon.svg'), path.join(SORTIE, 'favicon.svg'));
  const statutsExiste = existsSync(path.join(RACINE, donnees.site.statuts));
  if (statutsExiste) {
    mkdirSync(path.join(SORTIE, path.dirname(donnees.site.statuts)), { recursive: true });
    cpSync(path.join(RACINE, donnees.site.statuts), path.join(SORTIE, donnees.site.statuts));
  }
  const f = donnees.site.formulaire;
  if (f?.actif) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.expediteur ?? ''))
      throw new Error('Formulaire activé : indiquez « formulaire.expediteur » dans donnees/site.json (une adresse du domaine du site, par exemple site@uslcugy.ch).');
    const php = readFileSync(path.join(RACINE, 'src/envoyer.php'), 'utf8')
      .replace('__DESTINATAIRE__', `${donnees.site.courriel.utilisateur}@${donnees.site.courriel.domaine}`)
      .replace('__EXPEDITEUR__', f.expediteur)
      .replace('__DELAI__', String(Number(f.delai_minimum_secondes) || 5));
    writeFileSync(path.join(SORTIE, 'envoyer.php'), php);
  }

  // Photos : uniquement celles dont l'autorisation est enregistrée.
  const { photos, avertissements } = await preparerPhotos({
    dossierImages: IMAGES,
    dossierSortie: SORTIE,
    liste: donnees.photos,
  });
  const utiles = new Set([...photos.values()].flatMap((p) => Object.values(p.variantes).flat().map((v) => path.basename(v.url))));
  const dossierGen = path.join(SORTIE, 'images', 'gen');
  if (existsSync(dossierGen))
    for (const f of readdirSync(dossierGen)) if (!utiles.has(f)) rmSync(path.join(dossierGen, f));

  const ctx = {
    ...donnees,
    photos,
    aujourdhui: process.env.USL_DATE ?? aujourdHui(),
    logo: await trouverLogo(),
    statutsExiste,
    actifs: {
      css: empreinte(path.join(RACINE, 'src/css/site.css')),
      js: empreinte(path.join(RACINE, 'src/js/site.js')),
      amorce: empreinte(path.join(RACINE, 'src/js/amorce.js')),
    },
  };

  const pages = [
    accueil(ctx),
    listeManifestations(ctx),
    ...ctx.manifestations.map((m) => ficheManifestation(m, ctx)),
    societes(ctx),
    comite(ctx),
    contact(ctx),
    mentionsLegales(ctx),
    protectionDonnees(ctx),
    introuvable(),
    ...(ctx.site.formulaire?.actif ? [messageEnvoye(), messageRefuse()] : []),
  ];
  for (const p of pages) {
    const fichier = p.chemin.endsWith('/') ? p.chemin + 'index.html' : p.chemin;
    ecrire(fichier, page(ctx, p));
  }

  // Fichiers d'agenda (.ics) pour les manifestations datées.
  for (const m of ctx.manifestations)
    if (m.date)
      ecrire(`manifestations/${m.slug}/${m.slug}.ics`, genererIcs(m, ctx.site, `${ctx.site.url}/manifestations/${m.slug}/`));

  // sitemap.xml, robots.txt, en-têtes de sécurité.
  const urls = pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${ctx.site.url}${p.chemin}</loc></url>`);
  ecrire('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  ecrire('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ctx.site.url}/sitemap.xml\n`);
  ecrire('.htaccess', htaccess());
  ecrire('_headers', fichierHeaders());

  const reste = inventaire({ racine: RACINE, donnees });
  console.log(`Site généré dans public/ : ${pages.length} pages, ${photos.size} photo(s) publiée(s).`);
  for (const a of avertissements) console.warn(`Attention : ${a}`);
  if (reste.total) console.log(`Il reste ${reste.total} élément(s) à compléter : voir « npm run a-completer ».`);
}

construire().catch((e) => {
  console.error(`\nLe site n'a pas été généré.\n${e.message}\n`);
  process.exit(1);
});
