#!/usr/bin/env node
// Contrôle dans un vrai navigateur (facultatif, demande Playwright) :
// requêtes vers d'autres domaines, erreurs de console (dont la CSP), décalages de mise
// en page, débordements horizontaux, zones cliquables trop petites, captures d'écran.
// Usage : npm run apercu   (dans un autre terminal)   puis   node outils/controle-navigateur.mjs [dossier-captures]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.USL_APERCU ?? 'http://localhost:8080';
const CAPTURES = process.argv[2] ?? null;
const LARGEURS = [360, 768, 1280];
const PAGES = (process.env.USL_PAGES ?? '/,/manifestations/,/manifestations/fete-nationale/,/societes/,/comite/,/contact/,/mentions-legales/,/protection-des-donnees/').split(',');

const navigateur = await chromium.launch();
const problemes = [];
let externes = 0;
if (CAPTURES) mkdirSync(CAPTURES, { recursive: true });

for (const largeur of LARGEURS) {
  const contexte = await navigateur.newContext({ viewport: { width: largeur, height: 800 }, deviceScaleFactor: 1 });
  for (const chemin of PAGES) {
    const page = await contexte.newPage();
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.origin !== new URL(BASE).origin && u.protocol !== 'data:') {
        externes += 1;
        problemes.push(`${chemin} : requête vers un autre domaine : ${r.url()}`);
      }
    });
    page.on('console', (m) => { if (m.type() === 'error') problemes.push(`${chemin} @${largeur} : console : ${m.text()}`); });
    page.on('pageerror', (e) => problemes.push(`${chemin} @${largeur} : erreur JavaScript : ${e.message}`));
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(BASE + chemin, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const mesures = await page.evaluate(() => {
      const visibles = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
      const petits = [...document.querySelectorAll('a, button, input, textarea')]
        .filter((el) => visibles(el) && !el.closest('[inert]') && !el.closest('.piege') && !el.classList.contains('evitement'))
        .filter((el) => {
          // Un lien dans une phrase n'est pas soumis à la taille minimale ; les autres le sont.
          const dansTexte = el.tagName === 'A' && el.parentElement.closest('p, li, dd') && getComputedStyle(el).display === 'inline';
          if (dansTexte) return false;
          const r = el.getBoundingClientRect();
          const apres = el.tagName === 'A' ? getComputedStyle(el, '::after') : null;
          if (apres && apres.position === 'absolute' && apres.content !== 'none') return false; // lien étendu à tout le bloc
          return r.width < 43.5 || r.height < 43.5;
        })
        .map((el) => `${el.tagName.toLowerCase()} « ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)} » ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
      return {
        cls: window.__cls,
        deborde: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        petits,
        police: document.fonts.check('17px Archivo'),
        base: parseFloat(getComputedStyle(document.body).fontSize),
        h1: document.querySelectorAll('h1').length,
      };
    });
    if (mesures.cls > 0.01) problemes.push(`${chemin} @${largeur} : décalage de mise en page (CLS ${mesures.cls.toFixed(3)})`);
    if (mesures.deborde) problemes.push(`${chemin} @${largeur} : débordement horizontal`);
    if (mesures.base < 17) problemes.push(`${chemin} @${largeur} : texte de base sous 17 px`);
    if (mesures.h1 !== 1) problemes.push(`${chemin} @${largeur} : ${mesures.h1} titres h1`);
    for (const p of mesures.petits) problemes.push(`${chemin} @${largeur} : zone cliquable sous 44 px : ${p}`);
    if (CAPTURES) {
      const nom = (chemin === '/' ? 'accueil' : chemin.replace(/^\/|\/$/g, '').replaceAll('/', '_')) + `-${largeur}.png`;
      await page.screenshot({ path: path.join(CAPTURES, nom), fullPage: true });
    }
    await page.close();
  }
  await contexte.close();
}
await navigateur.close();

console.log(`${PAGES.length} pages × ${LARGEURS.length} largeurs contrôlées. Requêtes vers d'autres domaines : ${externes}.`);
if (problemes.length) {
  console.log(`${problemes.length} problème(s) :\n- ` + [...new Set(problemes)].join('\n- '));
  process.exit(1);
}
console.log('Aucun problème détecté.');
