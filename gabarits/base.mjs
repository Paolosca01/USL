// Squelette commun à toutes les pages : en-tête, menu, pied de page.
import { esc, typo, texte, manque } from '../outils/lib/util.mjs';

const MENU = [
  { href: '/', label: 'Accueil', section: 'accueil' },
  { href: '/manifestations/', label: 'Manifestations', section: 'manifestations' },
  { href: '/societes/', label: 'Sociétés', section: 'societes' },
  { href: '/comite/', label: 'Comité', section: 'comite' },
  { href: '/contact/', label: 'Contact', section: 'contact' },
];

/** Adresse e-mail protégée : assemblée par le script, jamais écrite en clair dans le HTML. */
export function courriel(site, { classe = '' } = {}) {
  const { utilisateur, domaine } = site.courriel;
  return (
    `<span class="courriel${classe ? ' ' + classe : ''}" data-u="${esc(utilisateur)}" data-d="${esc(domaine)}">` +
    `${esc(utilisateur)} (arobase) ${esc(domaine)}</span>`
  );
}

export function lienStatuts(ctx) {
  return ctx.statutsExiste
    ? `<a href="/${esc(ctx.site.statuts)}">Statuts de l’USL (PDF)</a>`
    : `Statuts de l’USL (PDF)\u202F: <mark class="a-completer">[À COMPLÉTER]</mark>`;
}

function logo(ctx) {
  const l = ctx.logo;
  if (l) {
    return `<img class="entete__logo-image" src="${esc(l.url)}" width="${l.w}" height="${l.h}" alt="${esc(ctx.site.nom)}">`;
  }
  // En attendant le fichier du logo : le nom, composé en texte.
  return (
    `<span class="entete__nom">${esc(ctx.site.nom)}</span>` +
    `<span class="entete__sousnom">Union des sociétés locales</span>`
  );
}

export function page(ctx, p) {
  const { site, actifs } = ctx;
  const url = site.url + p.chemin;
  const titre = p.chemin === '/' ? p.titre : `${p.titre} – ${site.nom}`;
  const image = site.url + (p.imagePartage ?? '/images/partage.png');
  const jsonld = (p.jsonld ?? [])
    .map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`)
    .join('\n');

  const menu = MENU.map((m) => {
    const courant = m.section === p.section ? ' aria-current="page"' : '';
    return `<li><a href="${m.href}"${courant}>${m.label}</a></li>`;
  }).join('');

  return `<!doctype html>
<html lang="fr-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(typo(titre))}</title>
<meta name="description" content="${esc(typo(p.description))}">
${p.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="${p.ogType ?? 'website'}">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:locale" content="fr_CH">
<meta property="og:title" content="${esc(typo(p.titre))}">
<meta property="og:description" content="${esc(typo(p.description))}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/polices/archivo-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css?v=${actifs.css}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script src="/js/amorce.js?v=${actifs.amorce}"></script>
<script src="/js/site.js?v=${actifs.js}" defer></script>
${jsonld}
</head>
<body class="page-${p.section ?? 'autre'}">
<a class="evitement" href="#contenu">Aller au contenu</a>
<header class="entete">
  <div class="conteneur entete__barre">
    <a class="entete__logo" href="/"${p.chemin === '/' ? ' aria-current="page"' : ''} aria-label="${esc(site.nom)}, accueil">${logo(ctx)}</a>
    <nav class="menu" aria-label="Menu principal">
      <button class="menu__bouton" type="button" aria-expanded="false" aria-controls="menu-liste">Menu</button>
      <ul class="menu__liste" id="menu-liste">${menu}</ul>
    </nav>
  </div>
</header>
<main id="contenu" tabindex="-1">
${p.contenu}
</main>
<footer class="pied">
  <div class="conteneur pied__grille">
    <div class="pied__bloc">
      <h2 class="pied__titre">${esc(site.nom_complet)}</h2>
      <p>${manque(site.adresse_postale) ? 'Adresse postale\u202F: ' : ''}${texte(site.adresse_postale)}</p>
      <p>${courriel(site)}</p>
    </div>
    <div class="pied__bloc">
      <h2 class="pied__titre">Documents</h2>
      <p>${lienStatuts(ctx)}</p>
    </div>
    <div class="pied__bloc">
      <h2 class="pied__titre">Informations</h2>
      <ul class="pied__liens">
        <li><a href="/mentions-legales/"${p.section === 'mentions' ? ' aria-current="page"' : ''}>Mentions légales</a></li>
        <li><a href="/protection-des-donnees/"${p.section === 'donnees' ? ' aria-current="page"' : ''}>Protection des données</a></li>
      </ul>
    </div>
  </div>
</footer>
</body>
</html>
`;
}
