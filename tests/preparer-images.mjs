// Fabrique des images d'essai (formes géométriques, aucune photo) dans tests/images/.
// Elles servent uniquement à contrôler la mise en page ; elles ne sont jamais publiées.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dossier = path.join(path.dirname(fileURLToPath(import.meta.url)), 'images');
const images = [
  ['evenements/petit-marche-de-cugy.jpg', 2400, 1600, '#7a8f6a', '#d9c48f'],
  ['evenements/marche-de-noel.jpg', 1600, 2000, '#5b4a3f', '#c9b9a6'],
  ['evenements/soupe-a-la-courge.jpg', 2000, 1500, '#a35d2a', '#e6d2b0'],
  ['galerie/essai-1.jpg', 1800, 1200, '#52677a', '#b9c6d1'],
  ['galerie/essai-2.jpg', 1200, 1600, '#6d5a7a', '#cfc4d6'],
];
for (const [nom, w, h, fond, forme] of images) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${fond}"/>
  <circle cx="${w * 0.3}" cy="${h * 0.4}" r="${Math.min(w, h) * 0.18}" fill="${forme}"/>
  <rect x="${w * 0.55}" y="${h * 0.55}" width="${w * 0.35}" height="${h * 0.3}" fill="${forme}" opacity="0.5"/></svg>`;
  const cible = path.join(dossier, nom);
  mkdirSync(path.dirname(cible), { recursive: true });
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(cible);
}
console.log(`${images.length} images d'essai créées dans tests/images/.`);
