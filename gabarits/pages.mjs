// Contenu des pages (hors pages légales, voir legales.mjs).
import {
  esc, typo, texte, manque, dateLongue, decalageZurich, heureValide, initiales, normaliser,
} from '../outils/lib/util.mjs';
import { baliseImage } from '../outils/lib/images.mjs';
import { courriel, lienStatuts } from './base.mjs';
import { pastille, horaire, visuel, ligne, estPassee, creditPhoto } from './composants.mjs';

const TAILLES_AFFICHE = '(min-width: 1168px) 739px, (min-width: 900px) 66vw, 100vw';
const CATEGORIES = { sport: 'Sport', culture: 'Culture', jeunesse: 'Jeunesse', autre: 'Autre' };

const parDate = (a, b) => a.date.localeCompare(b.date) || a.nom.localeCompare(b.nom, 'fr');

// ---------------------------------------------------------------- Accueil

export function accueil(ctx) {
  const { site } = ctx;
  const aVenir = ctx.manifestations.filter((m) => m.date && !estPassee(m, ctx.aujourdhui)).sort(parDate);
  const diapos = aVenir.slice(0, 6);
  const prochaines = aVenir.slice(0, 5);

  const diapositives = diapos
    .map(
      (m, i) => `
      <li class="diapo affiche" data-date="${m.date_fin || m.date}" role="group" aria-roledescription="diapositive" aria-label="${i + 1} sur ${diapos.length}">
        ${visuel(m, ctx, { sizes: TAILLES_AFFICHE, prioritaire: i === 0 })}
        <div class="panneau">
          ${pastille(m.date)}
          <h2 class="panneau__nom"><a class="diapo__lien-etendu" href="/manifestations/${m.slug}/">${esc(typo(m.nom))}</a></h2>
          <p class="panneau__lieu">${texte(m.lieu?.nom)}</p>
          <p class="panneau__action" aria-hidden="true"><span class="faux-lien">Voir la manifestation</span></p>
          ${creditPhoto(m, ctx)}
        </div>
      </li>`
    )
    .join('');

  const commandes =
    diapos.length > 1
      ? `
    <div class="carrousel__commandes">
      <button class="bouton-commande" type="button" data-action="precedent">Précédente<span class="sr"> manifestation</span></button>
      <div class="carrousel__points">
        ${diapos
          .map(
            (m, i) =>
              `<button class="point" type="button" data-index="${i}" aria-label="Diapositive ${i + 1} : ${esc(typo(m.nom))}"${i === 0 ? ' aria-current="true"' : ''}></button>`
          )
          .join('')}
      </div>
      <button class="bouton-commande" type="button" data-action="suivant">Suivante<span class="sr"> manifestation</span></button>
      <button class="bouton-commande bouton-commande--pause" type="button" data-action="pause">Pause</button>
    </div>`
      : '';

  const vide = `
    <div class="affiche affiche--vide" data-vide${diapos.length ? ' hidden' : ''}>
      <div class="visuel visuel--reserve" aria-hidden="true"><span class="visuel__nom">${esc(site.nom)}</span></div>
      <div class="panneau">
        <h2 class="panneau__nom">Aucune manifestation n’est annoncée pour l’instant.</h2>
        <p class="panneau__action"><a href="/manifestations/?filtre=passees">Voir les manifestations passées</a></p>
      </div>
    </div>`;

  const carrousel = `
  <section class="carrousel conteneur conteneur--bord" aria-roledescription="carrousel" aria-label="Manifestations à venir" data-carrousel>
    ${
      diapos.length
        ? `<div class="carrousel__fenetre"><ul class="carrousel__piste" role="list">${diapositives}</ul></div>${commandes}`
        : ''
    }
    ${vide}
  </section>`;

  const liste = `
    <section class="bloc-prochaines" aria-labelledby="titre-prochaines" data-prochaines>
      <h2 id="titre-prochaines" class="titre-section">Prochaines manifestations</h2>
      ${prochaines.length ? `<ol class="liste" role="list">${prochaines.map((m) => ligne(m)).join('')}</ol>` : ''}
      <p class="etat-vide" data-vide${prochaines.length ? ' hidden' : ''}>Aucune date n’est annoncée pour l’instant. <a href="/manifestations/?filtre=passees">Voir les manifestations passées</a></p>
      <p class="suite"><a class="bouton bouton--principal" href="/manifestations/">Tout le calendrier</a></p>
    </section>`;

  const presentation = `
    <section class="bloc-usl" aria-labelledby="titre-usl">
      <h2 id="titre-usl" class="titre-section">L’USL</h2>
      <p>${site.presentation.map((p) => esc(typo(p))).join(' ')}</p>
      <p class="liens-suite"><a href="/societes/">Les sociétés membres</a><a href="/comite/">Le comité</a></p>
    </section>`;

  return {
    chemin: '/',
    section: 'accueil',
    titre: `${site.nom} – ${site.nom_complet}`,
    description:
      'Le calendrier des manifestations de Cugy (VD), les sociétés locales et le comité de l’Union des sociétés locales.',
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site.nom_complet,
        alternateName: site.nom,
        url: site.url + '/',
        foundingDate: '1976',
      },
    ],
    contenu: `
  <h1 class="sr">${esc(site.nom)} – ${esc(site.nom_complet)}</h1>
  ${carrousel}
  <div class="conteneur section grille accueil__suite">
    ${liste}
    ${presentation}
  </div>`,
  };
}

// ---------------------------------------------------------------- Manifestations (liste)

export function listeManifestations(ctx) {
  const datees = ctx.manifestations.filter((m) => m.date).sort(parDate);
  const sansDate = ctx.manifestations.filter((m) => !m.date);
  const etat = (m) => (estPassee(m, ctx.aujourdhui) ? 'passe' : 'avenir');

  const annees = [...new Set(datees.map((m) => m.date.slice(0, 4)))];
  const groupes = annees
    .map((a) => {
      const items = datees.filter((m) => m.date.startsWith(a));
      const etats = new Set(items.map(etat));
      const etatGroupe = etats.size > 1 ? 'mixte' : [...etats][0];
      return `
      <section class="annee" data-groupe data-etat="${etatGroupe}" aria-labelledby="annee-${a}">
        <h2 id="annee-${a}" class="annee__titre chiffres">${a}</h2>
        <ol class="liste" role="list">${items.map((m) => ligne(m, { etat: etat(m) })).join('')}</ol>
      </section>`;
    })
    .join('');

  const aConfirmer = sansDate.length
    ? `
      <section class="annee" data-groupe data-etat="avenir" data-sans-date aria-labelledby="titre-sans-date">
        <h2 id="titre-sans-date" class="annee__titre">Date à confirmer</h2>
        <ul class="liste" role="list">${sansDate.map((m) => ligne(m, { etat: 'avenir' })).join('')}</ul>
      </section>`
    : '';

  const nbAVenir = datees.filter((m) => etat(m) === 'avenir').length + sansDate.length;
  const nbPassees = datees.length - datees.filter((m) => etat(m) === 'avenir').length;

  return {
    chemin: '/manifestations/',
    section: 'manifestations',
    titre: 'Manifestations',
    description: 'Le calendrier des manifestations de Cugy (VD) : dates, heures et lieux, à venir et passées.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Manifestations</h1>
    <div class="filtre" role="group" aria-label="Afficher les manifestations">
      <button type="button" class="filtre__bouton" data-filtre="avenir" aria-pressed="true">À venir</button>
      <button type="button" class="filtre__bouton" data-filtre="passees" aria-pressed="false">Passées</button>
    </div>
    <div class="calendrier" data-calendrier>
      ${groupes}
      ${aConfirmer}
      <div class="etat-vide" data-vide="avenir"${nbAVenir ? ' hidden' : ''}>
        <p>Aucune manifestation à venir n’est annoncée pour l’instant.</p>
        <p><a href="/manifestations/?filtre=passees" data-filtre-lien="passees">Voir les manifestations passées</a></p>
      </div>
      <div class="etat-vide" data-vide="passees"${nbPassees ? ' hidden' : ''}>
        <p>Aucune manifestation passée n’est encore enregistrée.</p>
        <p><a href="/manifestations/" data-filtre-lien="avenir">Voir les manifestations à venir</a></p>
      </div>
    </div>
  </div>`,
  };
}

// ---------------------------------------------------------------- Manifestation (détail)

function lienCarte(m) {
  if (m.lieu?.lien_carte) return m.lieu.lien_carte;
  if (manque(m.lieu?.adresse)) return null;
  // Carte officielle de la Confédération, ouverte dans son propre site (jamais intégrée).
  return 'https://map.geo.admin.ch/?swisssearch=' + encodeURIComponent(m.lieu.adresse);
}

function donneesStructurees(m, ctx, url, photo) {
  if (!m.date) return [];
  const avecHeure = (iso, h) => `${iso}T${h}:00${decalageZurich(iso, h)}`;
  const d = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: m.nom,
    url,
    startDate: heureValide(m.heure_debut) ? avecHeure(m.date, m.heure_debut) : m.date,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
  };
  if (m.date_fin || heureValide(m.heure_fin)) {
    const fin = m.date_fin || m.date;
    d.endDate = heureValide(m.heure_fin) ? avecHeure(fin, m.heure_fin) : fin;
  }
  if (!manque(m.lieu?.nom)) {
    d.location = { '@type': 'Place', name: m.lieu.nom };
    if (!manque(m.lieu.adresse)) d.location.address = m.lieu.adresse;
  }
  const description = (m.description ?? []).filter((p) => !manque(p)).join(' ');
  if (description) d.description = description;
  d.organizer = {
    '@type': 'Organization',
    name: manque(m.organisateur) ? ctx.site.nom_complet : m.organisateur,
    ...(manque(m.organisateur) ? { url: ctx.site.url + '/' } : {}),
  };
  if (photo) d.image = [ctx.site.url + photo.plusGrande.url];
  return [d];
}

export function ficheManifestation(m, ctx) {
  const chemin = `/manifestations/${m.slug}/`;
  const url = ctx.site.url + chemin;
  const photo = ctx.photos.get(`evenements/${m.slug}.jpg`);
  const h = horaire(m);
  const carte = lienCarte(m);
  const passee = estPassee(m, ctx.aujourdhui);

  const dateTexte = m.date
    ? dateLongue(m.date, { html: true }) + (m.date_fin ? ` au ${dateLongue(m.date_fin, { html: true })}` : '')
    : texte(null);
  const heureTexte = h ? `<span class="chiffres">${esc(h)}</span>` : texte(null);

  const galerie = (m.galerie ?? []).map((f) => ctx.photos.get(f)).filter(Boolean);
  const tuiles = galerie.length
    ? galerie
        .map(
          (g) =>
            `<li><figure class="tuile">${baliseImage(g, { sizes: '(min-width: 900px) 360px, (min-width: 560px) 50vw, 100vw' })}` +
            `<figcaption class="credit">Photo : ${esc(typo(g.credit))}</figcaption></figure></li>`
        )
        .join('')
    : [1, 2, 3].map(() => `<li><div class="tuile tuile--reserve"><span>Photo à venir</span></div></li>`).join('');

  const description = (m.description?.length ? m.description : [null]).map((p) => `<p>${texte(p)}</p>`).join('');
  const resume = (m.description ?? []).filter((p) => !manque(p)).join(' ');
  const metaDescription =
    [m.date ? dateLongue(m.date) : null, manque(m.lieu?.nom) ? null : m.lieu.nom].filter(Boolean).join(', ') +
    (resume ? `. ${resume.slice(0, 120)}` : '');

  return {
    chemin,
    section: 'manifestations',
    titre: m.nom,
    ogType: 'article',
    description: metaDescription || `${m.nom}, une manifestation à Cugy (VD).`,
    imagePartage: photo ? photo.plusGrande.url : undefined,
    jsonld: donneesStructurees(m, ctx, url, photo),
    contenu: `
  <article class="fiche">
    <div class="conteneur conteneur--bord">
      <p class="retour conteneur__marge"><a href="/manifestations/">Toutes les manifestations</a></p>
      <div class="affiche${photo ? '' : ' affiche--sans-photo'}">
        ${photo ? visuel(m, ctx, { sizes: TAILLES_AFFICHE, prioritaire: true }) : ''}
        <header class="panneau">
          ${pastille(m.date)}
          <h1 class="panneau__nom">${esc(typo(m.nom))}</h1>
          <p class="panneau__lieu">${m.date ? `${dateTexte}${h ? `, ${heureTexte}` : ''}<br>` : ''}${texte(m.lieu?.nom)}</p>
          ${creditPhoto(m, ctx)}
        </header>
      </div>
    </div>
    <div class="conteneur section grille fiche__corps">
      <div class="fiche__texte">
        ${passee ? '<p class="note">Cette manifestation a déjà eu lieu.</p>' : ''}
        <div class="prose">${description}</div>
        <h2 class="titre-bloc">Société organisatrice</h2>
        <p>${texte(m.organisateur)}</p>
      </div>
      <aside class="fiche__infos" aria-labelledby="titre-infos">
        <h2 id="titre-infos" class="titre-bloc">Infos pratiques</h2>
        <dl class="infos">
          <div><dt>Date</dt><dd>${dateTexte}</dd></div>
          <div><dt>Heure</dt><dd>${heureTexte}</dd></div>
          <div><dt>Lieu</dt><dd>${texte(m.lieu?.nom)}<br>${texte(m.lieu?.adresse)}${
            carte ? `<br><a class="non-imprime" href="${esc(carte)}" rel="noopener external">Voir sur la carte</a>` : ''
          }</dd></div>
          <div><dt>Prix</dt><dd>${texte(m.prix)}</dd></div>
          <div><dt>Inscription</dt><dd>${texte(m.inscription)}</dd></div>
          <div><dt>Parking</dt><dd>${texte(m.parking)}</dd></div>
          <div><dt>Contact</dt><dd>${texte(m.contact)}</dd></div>
        </dl>
        ${
          m.date && !passee
            ? `<p class="non-imprime"><a class="bouton bouton--principal" href="${chemin}${m.slug}.ics" download>Ajouter à mon agenda</a></p>`
            : ''
        }
        <p class="imprime-seulement">${esc(ctx.site.nom_complet)} · ${esc(url.replace('https://', ''))}</p>
      </aside>
    </div>
    <section class="conteneur section non-imprime" aria-labelledby="titre-galerie">
      <h2 id="titre-galerie" class="titre-section">Éditions passées</h2>
      <ul class="galerie" role="list">${tuiles}</ul>
    </section>
  </article>`,
  };
}

// ---------------------------------------------------------------- Sociétés

export function societes(ctx) {
  const liste = [...ctx.societes].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const cartes = liste
    .map((s) => {
      const categorie = CATEGORIES[s.categorie] ?? CATEGORIES.autre;
      // Règle 5.5 : la personne de contact n'apparaît que si son accord est enregistré.
      const contact =
        s.contact?.accord_publication === true && !manque(s.contact.nom)
          ? `<p class="carte__contact">Contact : ${esc(typo(s.contact.nom))}</p>`
          : '';
      const site = s.site_web
        ? `<p class="carte__lien"><a href="${esc(s.site_web)}" rel="noopener external">Site de la société</a></p>`
        : '';
      return (
        `<li class="carte" data-cle="${esc(normaliser(`${s.nom} ${categorie}`))}">` +
        `<p class="etiquette">${categorie}</p>` +
        `<h2 class="carte__nom">${esc(typo(s.nom))}</h2>${contact}${site}</li>`
      );
    })
    .join('');

  return {
    chemin: '/societes/',
    section: 'societes',
    titre: 'Sociétés',
    description: 'Les sociétés locales de Cugy (VD) membres de l’USL : sport, culture, jeunesse et loisirs.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Sociétés</h1>
    <p class="chapeau">Les sociétés sportives, culturelles et de loisirs de Cugy membres de l’USL.</p>
    <div class="recherche">
      <label class="champ__label" for="recherche-societes">Rechercher une société</label>
      <input class="champ" type="search" id="recherche-societes" autocomplete="off" spellcheck="false" data-recherche>
      <p class="recherche__compte" role="status" data-compte></p>
    </div>
    <ul class="cartes" role="list" data-cartes>${cartes}</ul>
    <p class="etat-vide" data-vide hidden>Aucune société ne correspond à cette recherche. <button type="button" class="lien-bouton" data-effacer>Afficher toutes les sociétés</button></p>
  </div>`,
  };
}

// ---------------------------------------------------------------- Comité

export function comite(ctx) {
  // Règle 5.5 : seules les personnes dont l'accord est enregistré sont affichées.
  const visibles = (liste) => liste.filter((p) => p.accord_publication === true);
  const membres = visibles(ctx.comite.comite)
    .map((p) => {
      const photo = p.photo ? ctx.photos.get(p.photo) : null;
      const portrait = photo
        ? baliseImage(photo, { sizes: '(min-width: 900px) 250px, 50vw' })
        : `<span class="portrait__initiales" aria-hidden="true">${esc(initiales(p.nom))}</span>`;
      return (
        `<li class="membre"><div class="portrait">${portrait}</div>` +
        `<h2 class="membre__nom">${esc(typo(p.nom))}</h2>` +
        `<p class="membre__fonction">${esc(typo(p.fonction))}</p></li>`
      );
    })
    .join('');
  const honneur = visibles(ctx.comite.membres_honneur)
    .map((p) => `<li>${esc(typo(p.nom))}</li>`)
    .join('');

  return {
    chemin: '/comite/',
    section: 'comite',
    titre: 'Comité',
    description: 'Le comité bénévole de l’Union des sociétés locales de Cugy (VD) et ses membres d’honneur.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Comité</h1>
    <p class="chapeau">Le comité de l’USL est bénévole. Pour le joindre, passez par la page <a href="/contact/">Contact</a>.</p>
    <ul class="membres" role="list">${membres}</ul>
    ${
      honneur
        ? `<section class="honneur" aria-labelledby="titre-honneur">
      <h2 id="titre-honneur" class="titre-section">Membres d’honneur</h2>
      <ul class="honneur__liste" role="list">${honneur}</ul>
    </section>`
        : ''
    }
  </div>`,
  };
}

// ---------------------------------------------------------------- Contact

function formulaire(ctx) {
  const f = ctx.site.formulaire;
  // Règle 5.4 : sans solution d'envoi validée, pas de formulaire (adresse e-mail seule).
  if (!f?.actif) return '';
  return `
    <section class="contact__formulaire" aria-labelledby="titre-formulaire">
      <h2 id="titre-formulaire" class="titre-bloc">Écrire au comité</h2>
      <p class="formulaire__sans-js">Ce formulaire a besoin de JavaScript. Vous pouvez aussi nous écrire par e-mail, à l’adresse ci-dessus.</p>
      <form class="formulaire" method="post" action="${esc(f.url_envoi)}" data-formulaire data-delai="${Number(f.delai_minimum_secondes) || 5}" novalidate>
        <p class="champ-groupe">
          <label class="champ__label" for="f-nom">Nom</label>
          <input class="champ" id="f-nom" name="nom" type="text" autocomplete="name" required maxlength="100">
        </p>
        <p class="champ-groupe">
          <label class="champ__label" for="f-courriel">E-mail</label>
          <input class="champ" id="f-courriel" name="courriel" type="email" autocomplete="email" required maxlength="200" inputmode="email">
        </p>
        <p class="champ-groupe">
          <label class="champ__label" for="f-message">Message</label>
          <textarea class="champ champ--texte" id="f-message" name="message" rows="6" required maxlength="5000"></textarea>
        </p>
        <p class="piege" aria-hidden="true">
          <label for="f-site">Ne remplissez pas ce champ</label>
          <input id="f-site" name="site_web" type="text" tabindex="-1" autocomplete="off">
        </p>
        <input type="hidden" name="depart" value="">
        <p class="formulaire__erreur" role="alert" data-erreur hidden></p>
        <p><button class="bouton bouton--principal" type="submit">Envoyer le message</button></p>
        <p class="formulaire__note">Votre nom, votre adresse e-mail et votre message servent uniquement à vous répondre. Ils sont transmis par e-mail à l’USL et ne sont enregistrés nulle part ailleurs. Voir la page <a href="/protection-des-donnees/">Protection des données</a>.</p>
      </form>
    </section>`;
}

export function contact(ctx) {
  const { site } = ctx;
  return {
    chemin: '/contact/',
    section: 'contact',
    titre: 'Contact',
    description: 'Écrire au comité de l’Union des sociétés locales de Cugy (VD) : adresse e-mail, adresse postale et statuts.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Contact</h1>
    <p class="chapeau">Une question, une manifestation à annoncer, une demande pour votre société ? Écrivez au comité de l’USL.</p>
    <div class="grille contact">
      <div class="contact__coordonnees">
        <h2 class="titre-bloc">Par e-mail</h2>
        <p class="contact__courriel">${courriel(site, { classe: 'courriel--bouton' })}</p>
        <h2 class="titre-bloc">Par courrier</h2>
        <p>${esc(site.nom_complet)}<br>${texte(site.adresse_postale)}</p>
        <h2 class="titre-bloc">Statuts</h2>
        <p>${lienStatuts(ctx)}</p>
      </div>
      ${formulaire(ctx)}
    </div>
  </div>`,
  };
}

export function messageEnvoye() {
  return {
    chemin: '/contact/merci/',
    section: 'contact',
    noindex: true,
    titre: 'Message envoyé',
    description: 'Votre message a été transmis au comité de l’USL.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Message envoyé</h1>
    <p class="chapeau">Merci. Votre message a été transmis au comité de l’USL, qui vous répondra par e-mail.</p>
    <p><a class="bouton" href="/">Retour à l’accueil</a></p>
  </div>`,
  };
}

export function messageRefuse() {
  return {
    chemin: '/contact/erreur/',
    section: 'contact',
    noindex: true,
    titre: 'Message non envoyé',
    description: 'Votre message n’a pas pu être envoyé.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Message non envoyé</h1>
    <p class="chapeau">Votre message n’a pas pu être envoyé. Vous pouvez réessayer ou nous écrire directement par e-mail.</p>
    <p><a class="bouton" href="/contact/">Retour à la page Contact</a></p>
  </div>`,
  };
}

// ---------------------------------------------------------------- Page introuvable

export function introuvable() {
  return {
    chemin: '/404.html',
    section: 'autre',
    noindex: true,
    titre: 'Page introuvable',
    description: 'Cette page n’existe pas ou a été déplacée.',
    contenu: `
  <div class="conteneur section">
    <h1 class="titre-page">Page introuvable</h1>
    <p class="chapeau">Cette page n’existe pas ou a été déplacée.</p>
    <p class="liens-suite"><a href="/">Accueil</a><a href="/manifestations/">Manifestations</a><a href="/contact/">Contact</a></p>
  </div>`,
  };
}
