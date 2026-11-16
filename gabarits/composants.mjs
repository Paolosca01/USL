// Composants réutilisés : pastille date, visuel 16:9, ligne de liste.
import { esc, typo, texte, manque, dateLongue, partiesDate, heureSuisse, heureValide } from '../outils/lib/util.mjs';
import { baliseImage } from '../outils/lib/images.mjs';

/** La pastille date : identique dans le carrousel, les listes et les pages de détail. */
export function pastille(iso) {
  if (!iso) {
    return (
      `<span class="pastille pastille--vide">` +
      `<span class="pastille__semaine" aria-hidden="true">date</span>` +
      `<span class="pastille__jour" aria-hidden="true">–</span>` +
      `<span class="pastille__mois" aria-hidden="true">à venir</span>` +
      `<span class="sr">Date à confirmer</span></span>`
    );
  }
  const d = partiesDate(iso);
  return (
    `<time class="pastille" datetime="${iso}">` +
    `<span class="pastille__semaine" aria-hidden="true">${esc(d.semaine)}</span>` +
    `<span class="pastille__jour" aria-hidden="true">${esc(d.jour)}</span>` +
    `<span class="pastille__mois" aria-hidden="true">${esc(d.mois)}</span>` +
    `<span class="sr">${esc(dateLongue(iso))}</span></time>`
  );
}

/** « 17h00 » ou « 17h00 – 22h00 », sinon null. */
export function horaire(m) {
  if (!heureValide(m.heure_debut)) return null;
  const debut = heureSuisse(m.heure_debut);
  return heureValide(m.heure_fin) ? `${debut} – ${heureSuisse(m.heure_fin)}` : debut;
}

/**
 * Visuel 16:9 : la photo si elle est autorisée, sinon un emplacement réservé
 * (bloc de couleur principale avec le nom de la manifestation en grand).
 */
export function visuel(m, ctx, { sizes, prioritaire = false } = {}) {
  const photo = ctx.photos.get(`evenements/${m.slug}.jpg`);
  if (photo) return `<div class="visuel">${baliseImage(photo, { sizes, prioritaire })}</div>`;
  return `<div class="visuel visuel--reserve" aria-hidden="true"><span class="visuel__nom">${esc(typo(m.nom))}</span></div>`;
}

/** Une ligne de liste : pastille, nom, heure et lieu. */
export function ligne(m, { niveau = 3, etat = '' } = {}) {
  const h = horaire(m);
  const meta = [h ? `<span class="chiffres">${esc(h)}</span>` : null, texte(m.lieu?.nom)].filter(Boolean).join(' · ');
  return (
    `<li class="ligne"${m.date ? ` data-date="${m.date_fin || m.date}"` : ''}${etat ? ` data-etat="${etat}"` : ''}>` +
    pastille(m.date) +
    `<div class="ligne__texte">` +
    `<h${niveau} class="ligne__nom"><a href="/manifestations/${m.slug}/">${esc(typo(m.nom))}</a></h${niveau}>` +
    `<p class="ligne__meta">${meta}</p>` +
    `</div></li>`
  );
}

/** Crédit de la photo, affiché en petit dans le panneau (jamais sur la photo). */
export function creditPhoto(m, ctx) {
  const photo = ctx.photos.get(`evenements/${m.slug}.jpg`);
  return photo ? `<p class="credit">Photo\u202F: ${esc(typo(photo.credit))}</p>` : '';
}

export function estPassee(m, aujourdhui) {
  return Boolean(m.date) && (m.date_fin || m.date) < aujourdhui;
}

export { manque };
