// Pages légales. PROJETS À FAIRE VALIDER PAR LE COMITÉ avant publication :
// ces textes n'ont pas été relus par un juriste.
import { esc, typo, texte, dateLongue } from '../outils/lib/util.mjs';
import { courriel } from './base.mjs';

const AVIS = '<!-- PROJET : texte à faire valider par le comité de l’USL avant publication. Il n’a pas été relu par un juriste. -->';

export function mentionsLegales(ctx) {
  const { site } = ctx;
  const credits = [...new Set([...ctx.photos.values()].map((p) => p.credit))].sort((a, b) => a.localeCompare(b, 'fr'));
  return {
    chemin: '/mentions-legales/',
    section: 'mentions',
    titre: 'Mentions légales',
    description: 'Éditeur, responsable de la publication, hébergeur et droits d’auteur du site de l’USL Cugy.',
    contenu: `
  ${AVIS}
  <div class="conteneur section">
    <h1 class="titre-page">Mentions légales</h1>
    <div class="prose prose--legale">
      <h2>Éditeur du site</h2>
      <p>${esc(site.nom_complet)} (${esc(site.nom)}), association au sens des articles 60 et suivants du Code civil suisse.</p>
      <p>Adresse postale : ${texte(site.adresse_postale)}<br>E-mail : ${courriel(site)}</p>

      <h2>Responsable de la publication</h2>
      <p>${esc(typo(site.responsable_publication))}.</p>

      <h2>Hébergement</h2>
      <p>Nom et adresse de l’hébergeur : ${texte(site.hebergeur)}</p>

      <h2>Réalisation du site</h2>
      <p>${texte(site.realisation)}</p>

      <h2>Droits d’auteur</h2>
      <p>Les textes et les photos de ce site appartiennent à l’USL Cugy ou à leurs auteurs. Ils ne peuvent pas être repris sans leur accord.</p>
      <h3>Crédits photo</h3>
      ${
        credits.length
          ? `<ul>${credits.map((c) => `<li>${esc(typo(c))}</li>`).join('')}</ul>`
          : '<p>Aucune photo n’est publiée pour l’instant. Chaque photo publiée sera accompagnée du nom de son auteur.</p>'
      }
      <h3>Police de caractères</h3>
      <p>Archivo, par Omnibus-Type, sous licence SIL Open Font License 1.1.</p>

      <h2>Liens externes</h2>
      <p>Ce site contient des liens vers d’autres sites, notamment ceux des sociétés membres. L’USL Cugy ne répond pas du contenu de ces sites.</p>
    </div>
  </div>`,
  };
}

export function protectionDonnees(ctx) {
  const { site } = ctx;
  const pd = site.protection_des_donnees;
  const formulaireActif = site.formulaire?.actif === true;
  return {
    chemin: '/protection-des-donnees/',
    section: 'donnees',
    titre: 'Protection des données',
    description: 'Quelles données le site de l’USL Cugy traite, dans quel but, et comment exercer vos droits. Ni cookies ni outils de suivi.',
    contenu: `
  ${AVIS}
  <div class="conteneur section">
    <h1 class="titre-page">Protection des données</h1>
    <div class="prose prose--legale">
      <p class="chapeau">Ce site n’utilise ni cookies ni outils de suivi. Il ne charge aucun contenu depuis un autre site.</p>
      <p>Cette page explique quelles données personnelles l’USL Cugy traite, conformément à la loi fédérale sur la protection des données (LPD).</p>

      <h2>Qui est responsable</h2>
      <p>${esc(site.nom_complet)} (${esc(site.nom)}).<br>Adresse postale : ${texte(site.adresse_postale)}<br>E-mail : ${courriel(site)}</p>

      <h2>Quelles données, et dans quel but</h2>
      <h3>Lorsque vous nous écrivez</h3>
      <p>Si vous nous écrivez par e-mail${formulaireActif ? ' ou par le formulaire de contact' : ''}, nous recevons votre nom, votre adresse e-mail et votre message. Nous les utilisons uniquement pour vous répondre.${
        formulaireActif
          ? ' Le formulaire transmet votre message par e-mail à l’USL ; il n’est enregistré nulle part ailleurs.'
          : ''
      }</p>
      <h3>Lorsque vous consultez le site</h3>
      <p>L’hébergeur enregistre des journaux techniques : adresse IP, date et heure, page consultée. Ils servent à faire fonctionner le site et à le protéger. L’USL ne s’en sert pas pour vous identifier.</p>
      <h3>Noms et photos publiés</h3>
      <p>Le site publie le nom et la fonction des membres du comité, et le nom des personnes de contact des sociétés qui ont donné leur accord. Les photos ne sont publiées qu’avec une autorisation.</p>

      <h2>Qui reçoit ces données</h2>
      <ul>
        <li>L’hébergeur du site : ${texte(site.hebergeur)}</li>
        <li>Notre messagerie : l’USL utilise une adresse Gmail. Les messages que vous nous envoyez sont donc traités par Google, y compris hors de Suisse. Pays concernés et garanties : ${texte(pd.google_pays_et_garanties)}</li>
      </ul>
      <p>Nous ne transmettons vos données à personne d’autre et nous ne les vendons pas.</p>

      <h2>Combien de temps</h2>
      <ul>
        <li>Messages reçus : ${texte(pd.duree_conservation_messages)}</li>
        <li>Journaux techniques de l’hébergeur : ${texte(pd.duree_conservation_journaux)}</li>
      </ul>

      <h2>Vos droits</h2>
      <p>Vous pouvez demander à savoir quelles données nous avons sur vous, à les faire corriger ou à les faire effacer. Vous pouvez aussi demander le retrait de votre nom ou d’une photo sur laquelle vous apparaissez.</p>
      <p>Écrivez-nous à ${courriel(site)} ou à notre adresse postale. Si notre réponse ne vous convient pas, vous pouvez vous adresser au Préposé fédéral à la protection des données et à la transparence (PFPDT).</p>

      <h2>Liens vers d’autres sites</h2>
      <p>Lorsque vous suivez un lien vers un autre site, par exemple une carte ou le site d’une société, ce sont les règles de ce site qui s’appliquent.</p>

      <p class="mise-a-jour">Dernière mise à jour : ${dateLongue(pd.derniere_mise_a_jour, { html: true }).replace(/^\S+ /, '')}.</p>
    </div>
  </div>`,
  };
}
