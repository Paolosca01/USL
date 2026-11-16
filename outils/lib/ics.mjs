// Fichier .ics (« Ajouter à mon agenda ») pour une manifestation datée.
import { manque, heureValide } from './util.mjs';

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Zurich',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const echapper = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Une ligne ne dépasse pas 75 octets (RFC 5545) : on la replie.
function replier(ligne) {
  const enc = new TextEncoder();
  const morceaux = [];
  let courant = '';
  let taille = 0;
  for (const car of ligne) {
    const n = enc.encode(car).length;
    if (taille + n > (morceaux.length ? 74 : 75)) {
      morceaux.push(courant);
      courant = '';
      taille = 0;
    }
    courant += car;
    taille += n;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

const compact = (iso) => iso.replaceAll('-', '');
function lendemain(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function plusHeures(iso, heure, n) {
  const d = new Date(`${iso}T${heure}:00Z`);
  d.setUTCHours(d.getUTCHours() + n);
  return { iso: d.toISOString().slice(0, 10), heure: d.toISOString().slice(11, 16) };
}

export function genererIcs(m, site, urlPage) {
  const fin = m.date_fin || m.date;
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USL Cugy//Site web//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  const horaire = heureValide(m.heure_debut);
  if (horaire) lignes.push(...VTIMEZONE);
  lignes.push(
    'BEGIN:VEVENT',
    `UID:${m.slug}-${m.date}@${new URL(site.url).hostname}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
  );
  if (horaire) {
    const h = (x) => x.replace(':', '') + '00';
    // Sans heure de fin connue : durée de deux heures par défaut dans l'agenda.
    const f = heureValide(m.heure_fin) ? { iso: fin, heure: m.heure_fin } : plusHeures(m.date, m.heure_debut, 2);
    lignes.push(
      `DTSTART;TZID=Europe/Zurich:${compact(m.date)}T${h(m.heure_debut)}`,
      `DTEND;TZID=Europe/Zurich:${compact(f.iso)}T${h(f.heure)}`
    );
  } else {
    lignes.push(`DTSTART;VALUE=DATE:${compact(m.date)}`, `DTEND;VALUE=DATE:${compact(lendemain(fin))}`);
  }
  lignes.push(`SUMMARY:${echapper(m.nom)}`);
  const lieu = [m.lieu?.nom, m.lieu?.adresse].filter((x) => !manque(x)).join(', ');
  if (lieu) lignes.push(`LOCATION:${echapper(lieu)}`);
  lignes.push(`URL:${urlPage}`, `DESCRIPTION:${echapper(urlPage)}`, 'END:VEVENT', 'END:VCALENDAR');
  return lignes.map(replier).join('\r\n') + '\r\n';
}
