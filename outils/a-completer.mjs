#!/usr/bin/env node
// Écrit A-COMPLETER.md : la liste de tout ce qui manque encore avant publication.
// Usage : npm run a-completer
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventaire } from './lib/inventaire.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (nom) => JSON.parse(readFileSync(path.join(RACINE, 'donnees', nom), 'utf8'));
const donnees = {
  site: lire('site.json'),
  manifestations: lire('manifestations.json'),
  societes: lire('societes.json'),
  comite: lire('comite.json'),
  photos: lire('photos.json'),
};
const { sections, total } = inventaire({ racine: RACINE, donnees });

// Points qui ne se lisent pas dans les données : ils sont tenus à la main dans ce fichier.
const manuels = readFileSync(path.join(RACINE, 'outils/a-completer-manuel.md'), 'utf8').trim();

const md = [
  '# À compléter avant publication',
  '',
  'Liste générée par `npm run a-completer`. Ne la modifiez pas à la main : complétez les fichiers de `donnees/` (ou `outils/a-completer-manuel.md` pour la première partie), puis relancez la commande.',
  '',
  manuels,
  '',
  `## Dans les données (${total} éléments)`,
  '',
  ...sections.flatMap((s) => [`### ${s.titre}`, '', ...s.lignes.map((l) => `- [ ] ${l}`), '']),
].join('\n');
writeFileSync(path.join(RACINE, 'A-COMPLETER.md'), md);
console.log(`A-COMPLETER.md mis à jour : ${total} éléments dans les données.`);
