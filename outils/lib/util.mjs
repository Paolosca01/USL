// Fonctions communes : échappement HTML, typographie française, dates.

export const MARQUE = '[À COMPLÉTER]';
const FINE = ' '; // espace fine insécable

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Vrai si la valeur est absente ou encore marquée [À COMPLÉTER]. */
export function manque(v) {
  return v == null || String(v).trim() === '' || String(v).includes(MARQUE);
}

/** Typographie française : apostrophes courbes, espaces fines insécables. */
export function typo(v) {
  return String(v ?? '')
    .replace(/(\p{L})'(?=\p{L})/gu, '$1’')
    .replace(/«\s*/g, '«' + FINE)
    .replace(/\s*»/g, FINE + '»')
    .replace(/[  ]+([;!?:])/g, FINE + '$1')
    .replace(/([\p{L}\d)’»])([;!?])(?=\s|$)/gu, '$1' + FINE + '$2')
    .replace(/(\p{L})(:)(?=\s|$)/gu, '$1' + FINE + '$2')
    .replace(/(\d)\s+(CHF|h|km|m)\b/g, '$1 $2')
    .replace(/\bCHF\s+(\d)/g, 'CHF $1');
}

/** Texte prêt pour le HTML : échappé, typographié, [À COMPLÉTER] mis en évidence. */
export function texte(v) {
  if (v == null || String(v).trim() === '') v = MARQUE;
  return esc(typo(v)).replaceAll(
    esc(MARQUE),
    `<mark class="a-completer">${esc(MARQUE)}</mark>`
  );
}

// ---------- Dates (format suisse romand) ----------

function enUTC(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}
const fmt = (options) => new Intl.DateTimeFormat('fr-CH', { timeZone: 'UTC', ...options });

export function dateValide(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = enUTC(iso);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/** « samedi 5 décembre 2026 », « dimanche 1er août 2027 » */
export function dateLongue(iso, { html = false } = {}) {
  const d = enUTC(iso);
  const jour = d.getUTCDate();
  const er = jour === 1 ? (html ? '1<sup>er</sup>' : '1er') : String(jour);
  return `${fmt({ weekday: 'long' }).format(d)} ${er} ${fmt({ month: 'long' }).format(d)} ${d.getUTCFullYear()}`;
}

/** Les trois lignes de la pastille date. */
export function partiesDate(iso) {
  const d = enUTC(iso);
  return {
    semaine: fmt({ weekday: 'short' }).format(d),
    jour: String(d.getUTCDate()),
    mois: fmt({ month: 'short' }).format(d),
    annee: String(d.getUTCFullYear()),
  };
}

export function heureValide(h) {
  return typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
}

/** « 17:00 » → « 17h00 », « 09:30 » → « 9h30 » */
export function heureSuisse(h) {
  return h.replace(':', 'h').replace(/^0/, '');
}

/** Décalage de l'heure suisse pour une date donnée : « +01:00 » ou « +02:00 ». */
export function decalageZurich(iso, heure = '12:00') {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Zurich',
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(`${iso}T${heure}:00Z`));
  const nom = parts.find((p) => p.type === 'timeZoneName').value; // « GMT+02:00 »
  return nom.replace('GMT', '') || '+00:00';
}

export function aujourdHui() {
  // Date du jour en Suisse, au format AAAA-MM-JJ.
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());
}

export function initiales(nom) {
  const mots = nom.trim().split(/\s+/);
  const premier = mots[0][0];
  const dernier = mots.length > 1 ? mots[mots.length - 1][0] : '';
  return (premier + dernier).toUpperCase();
}

/** Clé de recherche sans accents ni majuscules. */
export function normaliser(s) {
  // « Chœur » doit se trouver en tapant « choeur ».
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae');
}
