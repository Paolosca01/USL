// USL Cugy – script unique, sans dépendance.
// Aucun cookie, aucun stockage local, aucune requête réseau.
(function () {
  'use strict';

  var $ = function (sel, racine) { return (racine || document).querySelector(sel); };
  var $$ = function (sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); };

  // Date du jour en Suisse, au format AAAA-MM-JJ (comparable aux dates des données).
  var aujourdhui = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());

  // ---------------------------------------------------------------- Menu (téléphone)
  var menu = $('.menu');
  var boutonMenu = $('.menu__bouton');
  if (menu && boutonMenu) {
    var basculerMenu = function (ouvert) {
      menu.classList.toggle('menu--ouvert', ouvert);
      boutonMenu.setAttribute('aria-expanded', String(ouvert));
    };
    boutonMenu.addEventListener('click', function () {
      basculerMenu(boutonMenu.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && boutonMenu.getAttribute('aria-expanded') === 'true') {
        basculerMenu(false);
        boutonMenu.focus();
      }
    });
  }

  // ---------------------------------------------------------------- Adresse e-mail
  // L'adresse n'est pas écrite en clair dans le HTML : elle est assemblée ici.
  $$('.courriel').forEach(function (el) {
    var adresse = el.dataset.u + '@' + el.dataset.d;
    var lien = document.createElement('a');
    lien.href = 'mailto:' + adresse;
    lien.textContent = adresse;
    el.textContent = '';
    el.appendChild(lien);
  });

  // ---------------------------------------------------------------- Carrousel
  function carrousel(racine) {
    var fenetre = $('.carrousel__fenetre', racine);
    var piste = $('.carrousel__piste', racine);
    var commandes = $('.carrousel__commandes', racine);
    var vide = $('[data-vide]', racine);
    if (!piste) return;

    // Une manifestation passée depuis la dernière mise à jour du site n'est plus affichée.
    $$('.diapo', piste).forEach(function (d) { if (d.dataset.date < aujourdhui) d.remove(); });
    var diapos = $$('.diapo', piste);
    var n = diapos.length;
    if (n === 0) {
      fenetre.hidden = true;
      if (commandes) commandes.hidden = true;
      if (vide) vide.hidden = false;
      return;
    }
    if (n < 2 || !commandes) {
      if (commandes) commandes.hidden = true;
      return;
    }

    var points = $$('.point', commandes);
    points.slice(n).forEach(function (p) { p.remove(); });
    points = points.slice(0, n);
    diapos.forEach(function (d, i) { d.setAttribute('aria-label', (i + 1) + ' sur ' + n); });

    var boutonPause = $('[data-action="pause"]', commandes);
    var mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
    var index = 0;
    var enPause = mouvementReduit.matches; // pas de défilement automatique si l'utilisateur réduit les animations
    var survol = false;
    var focusDedans = false;
    var minuterie = null;

    function afficher(i) {
      index = (i + n) % n;
      piste.style.transform = 'translateX(' + -index * 100 + '%)';
      diapos.forEach(function (d, k) {
        var actif = k === index;
        d.inert = !actif;
        var lien = $('a', d);
        if (lien) lien.tabIndex = actif ? 0 : -1;
      });
      points.forEach(function (p, k) {
        if (k === index) p.setAttribute('aria-current', 'true');
        else p.removeAttribute('aria-current');
      });
    }

    function relancer() {
      window.clearInterval(minuterie);
      minuterie = window.setInterval(function () {
        if (!enPause && !survol && !focusDedans && !document.hidden) afficher(index + 1);
      }, 6000);
    }

    function majPause() {
      boutonPause.textContent = enPause ? 'Lecture' : 'Pause';
      // Les lecteurs d'écran n'annoncent les changements que lorsque le défilement est arrêté.
      piste.setAttribute('aria-live', enPause ? 'polite' : 'off');
    }

    commandes.addEventListener('click', function (e) {
      var cible = e.target.closest('button');
      if (!cible) return;
      if (cible.dataset.action === 'precedent') afficher(index - 1);
      else if (cible.dataset.action === 'suivant') afficher(index + 1);
      else if (cible.dataset.action === 'pause') { enPause = !enPause; majPause(); }
      else if (cible.dataset.index) afficher(Number(cible.dataset.index));
      relancer();
    });

    racine.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') survol = true; });
    racine.addEventListener('pointerleave', function () { survol = false; });
    racine.addEventListener('focusin', function () { focusDedans = true; });
    racine.addEventListener('focusout', function (e) { focusDedans = racine.contains(e.relatedTarget); });
    racine.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { afficher(index - 1); relancer(); }
      else if (e.key === 'ArrowRight') { afficher(index + 1); relancer(); }
    });

    // Glissement au doigt (ou à la souris).
    var depart = null;
    var glisse = false;
    var annulerClic = false;
    fenetre.addEventListener('dragstart', function (e) { e.preventDefault(); });
    fenetre.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      depart = { x: e.clientX, y: e.clientY, id: e.pointerId };
      glisse = false;
      annulerClic = false;
    });
    fenetre.addEventListener('pointermove', function (e) {
      if (!depart || e.pointerId !== depart.id) return;
      var dx = e.clientX - depart.x;
      var dy = e.clientY - depart.y;
      if (!glisse) {
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
        glisse = true;
        piste.classList.add('glisse');
        try { fenetre.setPointerCapture(e.pointerId); } catch (err) { /* sans conséquence */ }
      }
      piste.style.transform = 'translateX(calc(' + -index * 100 + '% + ' + dx + 'px))';
    });
    function finGlissement(e) {
      if (!depart || e.pointerId !== depart.id) return;
      var dx = e.clientX - depart.x;
      var etaitGlisse = glisse;
      depart = null;
      glisse = false;
      if (!etaitGlisse) return;
      piste.classList.remove('glisse');
      annulerClic = true;
      var seuil = Math.min(80, fenetre.clientWidth * 0.15);
      if (e.type === 'pointerup' && dx <= -seuil) afficher(index + 1);
      else if (e.type === 'pointerup' && dx >= seuil) afficher(index - 1);
      else afficher(index);
      relancer();
    }
    fenetre.addEventListener('pointerup', finGlissement);
    fenetre.addEventListener('pointercancel', finGlissement);
    // Après un glissement, le clic ne doit pas ouvrir la manifestation.
    fenetre.addEventListener('click', function (e) {
      if (annulerClic) { annulerClic = false; e.preventDefault(); e.stopPropagation(); }
    }, true);

    afficher(0);
    majPause();
    relancer();
  }
  $$('[data-carrousel]').forEach(carrousel);

  // ---------------------------------------------------------------- Accueil : prochaines dates
  var prochaines = $('[data-prochaines]');
  if (prochaines) {
    $$('.ligne[data-date]', prochaines).forEach(function (l) { if (l.dataset.date < aujourdhui) l.remove(); });
    if ($$('.ligne', prochaines).length === 0) {
      var liste = $('.liste', prochaines);
      if (liste) liste.remove();
      $('[data-vide]', prochaines).hidden = false;
    }
  }

  // ---------------------------------------------------------------- Manifestations : filtre à venir / passées
  var calendrier = $('[data-calendrier]');
  if (calendrier) {
    var boutonsFiltre = $$('.filtre__bouton');
    $$('.ligne[data-date]', calendrier).forEach(function (l) {
      l.dataset.etat = l.dataset.date < aujourdhui ? 'passe' : 'avenir';
    });
    var compte = { avenir: 0, passe: 0 };
    $$('[data-groupe]', calendrier).forEach(function (g) {
      var etats = {};
      $$('.ligne', g).forEach(function (l) { etats[l.dataset.etat] = true; compte[l.dataset.etat] += 1; });
      g.dataset.etat = etats.avenir && etats.passe ? 'mixte' : etats.passe ? 'passe' : 'avenir';
    });
    $('[data-vide="avenir"]', calendrier).hidden = compte.avenir > 0;
    $('[data-vide="passees"]', calendrier).hidden = compte.passe > 0;

    var choisir = function (filtre, majAdresse) {
      document.documentElement.setAttribute('data-filtre', filtre);
      boutonsFiltre.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filtre === filtre)); });
      if (majAdresse) history.replaceState(null, '', filtre === 'passees' ? '?filtre=passees' : location.pathname);
    };
    boutonsFiltre.forEach(function (b) {
      b.addEventListener('click', function () { choisir(b.dataset.filtre, true); });
    });
    $$('[data-filtre-lien]', calendrier).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        choisir(a.dataset.filtreLien, true);
        boutonsFiltre.filter(function (b) { return b.dataset.filtre === a.dataset.filtreLien; })[0].focus();
      });
    });
    choisir(new URLSearchParams(location.search).get('filtre') === 'passees' ? 'passees' : 'avenir', false);
  }

  // ---------------------------------------------------------------- Sociétés : recherche
  var champRecherche = $('[data-recherche]');
  if (champRecherche) {
    var cartes = $$('.carte', $('[data-cartes]'));
    var compteur = $('[data-compte]');
    var aucun = $('.etat-vide[data-vide]');
    var normaliser = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').trim(); };
    var filtrer = function () {
      var q = normaliser(champRecherche.value);
      var visibles = 0;
      cartes.forEach(function (c) {
        var montre = c.dataset.cle.indexOf(q) !== -1;
        c.hidden = !montre;
        if (montre) visibles += 1;
      });
      aucun.hidden = visibles > 0;
      compteur.textContent = visibles === 0 ? '' : visibles === 1 ? '1 société' : visibles + ' sociétés';
    };
    champRecherche.addEventListener('input', filtrer);
    $('[data-effacer]').addEventListener('click', function () {
      champRecherche.value = '';
      filtrer();
      champRecherche.focus();
    });
    filtrer();
  }

  // ---------------------------------------------------------------- Formulaire de contact
  // Anti-spam sans service tiers : champ piège invisible et délai minimum avant l'envoi.
  var formulaire = $('[data-formulaire]');
  if (formulaire) {
    var erreur = $('[data-erreur]', formulaire);
    var champDepart = formulaire.elements.depart;
    var delai = Number(formulaire.dataset.delai) * 1000;
    formulaire.addEventListener('focusin', function () {
      if (!champDepart.value) champDepart.value = String(Date.now());
    });
    formulaire.addEventListener('submit', function (e) {
      var message = '';
      var premier = null;
      ['nom', 'courriel', 'message'].forEach(function (nom) {
        var c = formulaire.elements[nom];
        var ok = c.value.trim() !== '' && c.checkValidity();
        c.setAttribute('aria-invalid', String(!ok));
        if (!ok && !premier) premier = c;
      });
      if (premier) message = 'Merci de remplir votre nom, une adresse e-mail valable et votre message.';
      else if (formulaire.elements.site_web.value !== '') message = 'Votre message n’a pas pu être envoyé.';
      else if (!champDepart.value || Date.now() - Number(champDepart.value) < delai)
        message = 'Merci de patienter quelques secondes, puis d’envoyer à nouveau.';
      if (message) {
        e.preventDefault();
        erreur.textContent = message;
        erreur.hidden = false;
        if (premier) premier.focus();
      }
    });
  }
})();
