// Préparation des photos : recadrage selon le point focal, tailles adaptées,
// formats AVIF + WebP + JPEG. Seules les photos autorisées sont traitées (règle 5.6).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { esc, manque, typo } from './util.mjs';

// Un ratio fixe par usage.
export const USAGES = {
  carrousel: { ratio: [16, 9], largeurs: [480, 800, 1200, 1600], defaut: 800 },
  carte: { ratio: [4, 3], largeurs: [320, 640, 960], defaut: 640 },
  portrait: { ratio: [1, 1], largeurs: [160, 320, 480], defaut: 320 },
};
// L'usage dépend du dossier où la photo est déposée.
const USAGE_PAR_DOSSIER = { evenements: 'carrousel', galerie: 'carte', comite: 'portrait' };
const FORMATS = [
  { ext: 'avif', type: 'image/avif', options: { quality: 50 } },
  { ext: 'webp', type: 'image/webp', options: { quality: 72 } },
  { ext: 'jpg', type: 'image/jpeg', options: { quality: 78, mozjpeg: true } },
];

/**
 * @returns {Promise<{photos: Map<string, object>, avertissements: string[]}>}
 */
export async function preparerPhotos({ dossierImages, dossierSortie, liste }) {
  const photos = new Map();
  const avertissements = [];
  let sharp = null;

  for (const p of liste) {
    if (p.autorisation !== true) continue; // jamais publiée sans autorisation
    const source = path.join(dossierImages, p.fichier);
    if (!existsSync(source)) {
      avertissements.push(`Photo autorisée mais fichier absent : images/${p.fichier}`);
      continue;
    }
    if (manque(p.alt) || manque(p.credit)) {
      avertissements.push(`Photo non publiée : texte alternatif ou crédit manquant pour images/${p.fichier}`);
      continue;
    }
    const usage = USAGE_PAR_DOSSIER[p.fichier.split('/')[0]];
    if (!usage) {
      avertissements.push(`Photo ignorée (dossier inconnu) : images/${p.fichier}`);
      continue;
    }
    if (!sharp) {
      try {
        sharp = (await import('sharp')).default;
      } catch {
        throw new Error('Le module « sharp » est requis pour préparer les photos. Lancez « npm install ».');
      }
    }

    const { ratio, largeurs, defaut } = USAGES[usage];
    const fx = Math.min(100, Math.max(0, Number(p.point_focal?.x ?? 50))) / 100;
    const fy = Math.min(100, Math.max(0, Number(p.point_focal?.y ?? 50))) / 100;
    const info = statSync(source);
    const empreinte = createHash('sha1')
      .update(`${p.fichier}|${info.size}|${info.mtimeMs}|${fx}|${fy}`)
      .digest('hex')
      .slice(0, 8);

    // Dimensions réelles, orientation EXIF prise en compte.
    const meta = await sharp(source).metadata();
    const tourne = (meta.orientation ?? 1) >= 5;
    const L = tourne ? meta.height : meta.width;
    const H = tourne ? meta.width : meta.height;

    // Plus grand cadre au bon ratio, centré au mieux sur le point focal.
    const cible = ratio[0] / ratio[1];
    let cw = L;
    let ch = Math.round(L / cible);
    if (ch > H) {
      ch = H;
      cw = Math.round(H * cible);
    }
    const left = Math.round(Math.min(Math.max(fx * L - cw / 2, 0), L - cw));
    const top = Math.round(Math.min(Math.max(fy * H - ch / 2, 0), H - ch));

    const retenues = largeurs.filter((w) => w <= cw);
    if (retenues.length === 0) retenues.push(Math.min(largeurs[0], cw));

    const base = path.basename(p.fichier).replace(/\.[^.]+$/, '');
    const dossier = path.join(dossierSortie, 'images', 'gen');
    mkdirSync(dossier, { recursive: true });
    const variantes = {};
    for (const f of FORMATS) {
      variantes[f.ext] = [];
      for (const w of retenues) {
        const h = Math.round((w * ratio[1]) / ratio[0]);
        const nom = `${base}-${usage}-${w}-${empreinte}.${f.ext}`;
        const cibleFichier = path.join(dossier, nom);
        if (!existsSync(cibleFichier)) {
          await sharp(source)
            .rotate()
            .extract({ left, top, width: cw, height: ch })
            .resize(w, h)
            .toFormat(f.ext === 'jpg' ? 'jpeg' : f.ext, f.options)
            .toFile(cibleFichier);
        }
        variantes[f.ext].push({ url: `/images/gen/${nom}`, w, h });
      }
    }
    const jpg = variantes.jpg;
    const parDefaut = jpg.find((v) => v.w === defaut) ?? jpg[jpg.length - 1];
    photos.set(p.fichier, {
      fichier: p.fichier,
      usage,
      alt: p.alt,
      credit: p.credit,
      variantes,
      defaut: parDefaut,
      plusGrande: jpg[jpg.length - 1],
    });
  }
  return { photos, avertissements };
}

/** Balise <picture> : AVIF, puis WebP, puis JPEG. Largeur et hauteur déclarées. */
export function baliseImage(photo, { sizes, prioritaire = false, classe = '' } = {}) {
  const srcset = (liste) => liste.map((v) => `${v.url} ${v.w}w`).join(', ');
  const sources = FORMATS.filter((f) => f.ext !== 'jpg')
    .map((f) => `<source type="${f.type}" srcset="${srcset(photo.variantes[f.ext])}" sizes="${esc(sizes)}">`)
    .join('');
  const chargement = prioritaire ? 'fetchpriority="high"' : 'loading="lazy"';
  return (
    `<picture>${sources}` +
    `<img${classe ? ` class="${classe}"` : ''} src="${photo.defaut.url}" srcset="${srcset(photo.variantes.jpg)}" sizes="${esc(sizes)}" ` +
    `width="${photo.defaut.w}" height="${photo.defaut.h}" alt="${esc(typo(photo.alt))}" ${chargement} decoding="async">` +
    `</picture>`
  );
}
