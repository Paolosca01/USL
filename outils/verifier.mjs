#!/usr/bin/env node
// Contrôles automatiques du site généré (public/) : règles de la section 5 du cahier
// des charges, accessibilité de base, poids de la page d'accueil, contrastes.
// Usage : npm run verifier            (après npm run construire)
//         npm run verifier -- --strict   échoue aussi s'il reste des [À COMPLÉTER]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARQUE } from './lib/util.mjs';
import { CSP } from './lib/entetes.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(RACINE, 'public');
const DONNEES = path.resolve(RACINE, process.env.USL_DONNEES ?? 'donnees');
const STRICT = process.argv.includes('--strict');
const json = (nom) => JSON.parse(readFileSync(path.join(DONNEES, nom), 'utf8'));

if (!existsSync(path.join(PUBLIC, 'index.html'))) {
  console.error('Le dossier public/ est vide : lancez d’abord « npm run construire ».');
  process.exit(1);
}

const site = json('site.json');
const erreurs = [];
const resultats = [];
function controle(nom, problemes) {
  resultats.push({ nom, ok: problemes.length === 0 });
  for (const p of problemes) erreurs.push(`${nom} : ${p}`);
}

function fichiers(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fichiers(path.join(dossier, e.name)) : [path.join(dossier, e.name)]
  );
}
const tous = fichiers(PUBLIC);
const rel = (f) => '/' + path.relative(PUBLIC, f).split(path.sep).join('/');
const pages = tous.filter((f) => f.endsWith('.html')).map((f) => ({ chemin: rel(f), html: readFileSync(f, 'utf8') }));
const attributs = (balise) => Object.fromEntries([...balise.matchAll(/([a-z:-]+)(?:="([^"]*)")?/gi)].map((m) => [m[1].toLowerCase(), m[2] ?? '']));
const balises = (html, nom) => [...html.matchAll(new RegExp(`<${nom}\\b[^>]*>`, 'gi'))].map((m) => attributs(m[0].replace(new RegExp(`^<${nom}`, 'i'), '')));
const domaine = new URL(site.url).origin;
const externe = (u) => /^(https?:)?\/\//i.test(u) && !u.startsWith(domaine);

// ---- 5.1 Aucune ressource tierce, aucun cookie, aucun stockage
{
  const p = [];
  for (const { chemin, html } of pages) {
    for (const [nom, attr] of [['script', 'src'], ['img', 'src'], ['source', 'srcset'], ['img', 'srcset'], ['iframe', 'src'], ['video', 'src'], ['audio', 'src'], ['embed', 'src'], ['object', 'data']])
      for (const b of balises(html, nom))
        for (const u of (b[attr] ?? '').split(',').map((x) => x.trim().split(/\s+/)[0]).filter(Boolean))
          if (externe(u)) p.push(`${chemin} charge ${u}`);
    for (const b of balises(html, 'link'))
      if (b.href && externe(b.href) && b.rel !== 'canonical') p.push(`${chemin} charge ${b.href}`);
    if (/<iframe|<video|<audio|<embed|<object/i.test(html)) p.push(`${chemin} contient un contenu intégré`);
  }
  for (const f of tous.filter((x) => x.endsWith('.css'))) {
    const css = readFileSync(f, 'utf8');
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)/g)) if (externe(m[1])) p.push(`${rel(f)} charge ${m[1]}`);
    if (/@import/.test(css)) p.push(`${rel(f)} utilise @import`);
  }
  for (const f of tous.filter((x) => x.endsWith('.js'))) {
    const js = readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '');
    for (const interdit of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource', 'import(', 'document.cookie', 'localStorage', 'sessionStorage', 'indexedDB', 'https://', 'http://'])
      if (js.includes(interdit)) p.push(`${rel(f)} contient « ${interdit} »`);
  }
  controle('5.1 Aucune requête vers un tiers, ni cookie, ni stockage', p);
}

// ---- 5.8 Sécurité : pas de style ni de script en ligne (CSP stricte), liens externes, e-mail
{
  const p = [];
  const adresse = `${site.courriel.utilisateur}@${site.courriel.domaine}`;
  for (const { chemin, html } of pages) {
    if (/<style\b/i.test(html) || /\sstyle="/i.test(html)) p.push(`${chemin} : style en ligne (bloqué par la CSP)`);
    if (/\son[a-z]+="/i.test(html)) p.push(`${chemin} : gestionnaire d'événement en ligne`);
    for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
      const a = attributs(m[1]);
      if (!a.src && a.type !== 'application/ld+json') p.push(`${chemin} : script en ligne`);
    }
    for (const a of balises(html, 'a'))
      if (a.href && externe(a.href)) {
        if (!/\bnoopener\b/.test(a.rel ?? '')) p.push(`${chemin} : lien externe sans rel="noopener" (${a.href})`);
        if (!a.href.startsWith('https://')) p.push(`${chemin} : lien externe sans HTTPS (${a.href})`);
      }
    if (html.includes(adresse) || html.includes('mailto:')) p.push(`${chemin} : adresse e-mail en clair dans le HTML`);
  }
  const htaccess = readFileSync(path.join(PUBLIC, '.htaccess'), 'utf8');
  for (const d of [...CSP, 'Strict-Transport-Security', 'X-Content-Type-Options', 'RewriteCond %{HTTPS} !=on'])
    if (!htaccess.includes(d)) p.push(`.htaccess : « ${d} » manquant`);
  controle('5.8 Sécurité (CSP, HTTPS, liens externes, adresse e-mail protégée)', p);
}

// ---- 5.4 Formulaire de contact
{
  const p = [];
  const contact = pages.find((x) => x.chemin === '/contact/index.html').html;
  const actif = /<form\b/i.test(contact);
  if (actif !== (site.formulaire?.actif === true)) p.push('présence du formulaire incohérente avec donnees/site.json');
  if (actif) {
    const noms = [...balises(contact, 'input'), ...balises(contact, 'textarea')].map((b) => b.name).sort().join(',');
    if (noms !== 'courriel,depart,message,nom,site_web') p.push(`champs inattendus : ${noms}`);
    if (/type="checkbox"|\schecked/i.test(contact)) p.push('case à cocher présente');
    if (!/formulaire__note[^]*?protection-des-donnees/.test(contact)) p.push('phrase d’information ou lien « Protection des données » manquant');
    const action = balises(contact, 'form')[0].action;
    if (externe(action)) p.push(`le formulaire envoie vers un tiers : ${action}`);
  }
  controle(`5.4 Formulaire de contact (${actif ? 'actif' : 'désactivé : adresse e-mail seule'})`, p);
}

// ---- 5.5 Personnes : seules celles dont l'accord est enregistré apparaissent
{
  const p = [];
  const societes = json('societes.json');
  const comite = json('comite.json');
  const personnes = [...societes.map((s) => s.contact).filter(Boolean), ...comite.comite, ...comite.membres_honneur];
  const autorisees = new Set(personnes.filter((x) => x.accord_publication === true).map((x) => x.nom));
  const texte = (html) => html.replace(/&amp;/g, '&').replace(/’/g, "'");
  for (const x of personnes.filter((y) => y.accord_publication !== true && y.nom))
    for (const { chemin, html } of pages) {
      // Le nom entier, pas un morceau d'un autre nom.
      const nom = x.nom.replace(/’/g, "'").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const present = new RegExp(`(?<![\\p{L}\\d])${nom}(?![\\p{L}\\d])`, 'u').test(texte(html));
      // Une même personne peut être publiée à un autre titre pour lequel son accord est enregistré.
      if (present && (!autorisees.has(x.nom) || chemin === '/societes/index.html'))
        p.push(`${x.nom} apparaît dans ${chemin} sans accord enregistré`);
    }
  if (/\b0\d{2}[ .]?\d{3}[ .]?\d{2}[ .]?\d{2}\b|\+41/.test(pages.map((x) => x.html).join(''))) p.push('un numéro de téléphone figure sur le site');
  controle('5.5 Personnes nommées : accord de publication respecté', p);
}

// ---- 5.6 Photos : uniquement les images autorisées, avec crédit
{
  const p = [];
  const photos = json('photos.json');
  const base = (f) => path.basename(f).replace(/\.[^.]+$/, '');
  const interdites = photos.filter((x) => x.autorisation !== true).map((x) => base(x.fichier));
  const permises = photos.filter((x) => x.autorisation === true).map((x) => base(x.fichier));
  const gen = path.join(PUBLIC, 'images', 'gen');
  for (const f of existsSync(gen) ? readdirSync(gen) : []) {
    if (interdites.some((b) => f.startsWith(b + '-') && !permises.includes(b))) p.push(`image non autorisée publiée : ${f}`);
    if (!permises.some((b) => f.startsWith(b + '-'))) p.push(`image sans entrée autorisée dans photos.json : ${f}`);
  }
  for (const { chemin, html } of pages) {
    const nbPhotos = (html.match(/<picture>/g) ?? []).length;
    const nbCredits = (html.match(/class="credit"/g) ?? []).length;
    if (nbPhotos > nbCredits) p.push(`${chemin} : ${nbPhotos} photo(s) pour ${nbCredits} crédit(s)`);
  }
  controle('5.6 Photos : autorisation et crédit', p);
}

// ---- 5.2 / 5.3 Pages légales
{
  const p = [];
  const ml = pages.find((x) => x.chemin === '/mentions-legales/index.html')?.html ?? '';
  const pd = pages.find((x) => x.chemin === '/protection-des-donnees/index.html')?.html ?? '';
  for (const t of ['articles 60 et suivants du Code civil suisse', 'Responsable de la publication', 'Hébergement', 'Réalisation du site', 'Droits d’auteur', 'Crédits photo', 'Liens externes', 'PROJET'])
    if (!ml.includes(t)) p.push(`Mentions légales : « ${t} » manquant`);
  for (const t of ['ni cookies ni outils de suivi', 'Qui est responsable', 'adresse IP', 'Qui reçoit ces données', 'Google', 'Combien de temps', 'Vos droits', 'effacer', 'retrait de votre nom', 'Dernière mise à jour', 'PROJET'])
    if (!pd.includes(t)) p.push(`Protection des données : « ${t} » manquant`);
  for (const { chemin, html } of pages)
    if (!html.includes('href="/mentions-legales/"') || !html.includes('href="/protection-des-donnees/"')) p.push(`${chemin} : liens légaux absents du pied de page`);
  controle('5.2 et 5.3 Mentions légales et Protection des données', p);
}

// ---- Pages : langue, titre, description, image de partage, un seul h1, images dimensionnées
{
  const p = [];
  const titres = new Map();
  for (const { chemin, html } of pages) {
    if (!html.includes('<html lang="fr-CH">')) p.push(`${chemin} : lang="fr-CH" manquant`);
    const titre = html.match(/<title>([^<]*)<\/title>/)?.[1];
    if (!titre) p.push(`${chemin} : titre manquant`);
    else if (titres.has(titre)) p.push(`${chemin} : même titre que ${titres.get(titre)}`);
    titres.set(titre, chemin);
    if (!/<meta name="description" content="[^"]{20,}"/.test(html)) p.push(`${chemin} : description manquante ou trop courte`);
    const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (!og || !existsSync(path.join(PUBLIC, og.replace(domaine, '')))) p.push(`${chemin} : image de partage introuvable (${og})`);
    if ((html.match(/<h1\b/g) ?? []).length !== 1) p.push(`${chemin} : il faut exactement un titre h1`);
    for (const img of balises(html, 'img')) {
      if (!img.width || !img.height) p.push(`${chemin} : image sans largeur ou hauteur (${img.src})`);
      if (!('alt' in img)) p.push(`${chemin} : image sans texte alternatif (${img.src})`);
    }
    for (const c of [...balises(html, 'input'), ...balises(html, 'textarea')])
      if (c.type !== 'hidden' && !html.includes(`for="${c.id}"`)) p.push(`${chemin} : champ sans étiquette (${c.name ?? c.id})`);
    for (const a of balises(html, 'a')) {
      if (!a.href || externe(a.href) || a.href.startsWith('#')) continue;
      const cible = a.href.split(/[?#]/)[0];
      const f = path.join(PUBLIC, cible.endsWith('/') ? cible + 'index.html' : cible);
      if (!existsSync(f)) p.push(`${chemin} : lien cassé vers ${a.href}`);
    }
  }
  controle('Pages : langue, titre, description, image de partage, h1, images, étiquettes, liens', p);
}

// ---- Données structurées et plan du site
{
  const p = [];
  const sitemap = readFileSync(path.join(PUBLIC, 'sitemap.xml'), 'utf8');
  for (const m of json('manifestations.json')) {
    const page = pages.find((x) => x.chemin === `/manifestations/${m.slug}/index.html`);
    if (!page) { p.push(`page manquante pour ${m.slug}`); continue; }
    if (!sitemap.includes(`/manifestations/${m.slug}/`)) p.push(`${m.slug} absent de sitemap.xml`);
    const ld = [...page.html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));
    const evenement = ld.find((d) => d['@type'] === 'Event');
    if (m.date && (!evenement || evenement.startDate.slice(0, 10) !== m.date)) p.push(`${m.slug} : données « Event » absentes ou date incorrecte`);
    if (m.date && !existsSync(path.join(PUBLIC, 'manifestations', m.slug, `${m.slug}.ics`))) p.push(`${m.slug} : fichier .ics manquant`);
  }
  controle('Données structurées « Event », fichiers .ics et sitemap.xml', p);
}

// ---- Poids de la page d'accueil (hors images) : moins de 200 Ko
{
  const accueil = pages.find((x) => x.chemin === '/index.html').html;
  const ressources = ['/index.html'];
  for (const b of [...balises(accueil, 'link'), ...balises(accueil, 'script')]) {
    const u = (b.href ?? b.src ?? '').split('?')[0];
    if (u.startsWith('/') && /\.(css|js|woff2)$/.test(u)) ressources.push(u);
  }
  const total = ressources.reduce((n, u) => n + statSync(path.join(PUBLIC, u)).size, 0);
  controle(`Page d'accueil hors images : ${(total / 1024).toFixed(1)} Ko (limite 200 Ko, avant compression)`, total > 200 * 1024 ? ['trop lourde'] : []);
}

// ---- Contrastes AA (4,5:1) calculés à partir des couleurs de la feuille de style
{
  const css = readFileSync(path.join(PUBLIC, 'css', 'site.css'), 'utf8');
  const couleur = (nom) => css.match(new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  // [texte, fond, seuil] : toutes les combinaisons utilisées par la feuille de style.
  const paires = [
    ['encre', 'fond', 4.5], ['encre', 'surface', 4.5], ['encre', 'clair', 4.5], ['encre', 'principale-claire', 4.5], ['encre', 'repere', 4.5],
    ['discret', 'fond', 4.5], ['discret', 'surface', 4.5], ['discret', 'clair', 4.5],
    ['principale', 'fond', 4.5], ['principale', 'surface', 4.5], ['principale', 'clair', 4.5], ['principale', 'principale-claire', 4.5],
    ['principale-foncee', 'fond', 4.5], ['principale-foncee', 'surface', 4.5],
    ['clair', 'principale', 4.5], ['clair', 'principale-foncee', 4.5], ['principale-claire', 'principale-foncee', 4.5],
    ['clair', 'accent', 4.5], ['clair', 'accent-fonce', 4.5], ['clair', 'encre', 4.5],
    ['bordure', 'fond', 3], ['bordure', 'clair', 3], // contour des champs : 3:1 (éléments d'interface)
  ];
  const p = [];
  for (const [a, b, seuil] of paires) {
    const [ca, cb] = [couleur(a), couleur(b)];
    if (!ca || !cb) { p.push(`couleur introuvable : ${a} ou ${b}`); continue; }
    const r = ratio(ca, cb);
    if (r < seuil) p.push(`${a} sur ${b} : ${r.toFixed(2)}:1 (minimum ${seuil}:1)`);
  }
  controle(`Contrastes AA (${paires.length} combinaisons de couleurs)`, p);
}

// ---- [À COMPLÉTER]
const restants = pages.reduce((n, x) => n + x.html.split(MARQUE).length - 1, 0);
if (STRICT) controle('Plus aucun [À COMPLÉTER] sur le site', restants ? [`${restants} mention(s) restante(s)`] : []);

for (const r of resultats) console.log(`${r.ok ? 'ok   ' : 'ÉCHEC'} ${r.nom}`);
if (!STRICT && restants) console.log(`\nÀ noter : ${restants} mention(s) [À COMPLÉTER] encore visibles sur le site (voir « npm run a-completer »).`);
if (erreurs.length) {
  console.error(`\n${erreurs.length} problème(s) :\n- ${erreurs.join('\n- ')}`);
  process.exit(1);
}
console.log('\nTous les contrôles passent.');
