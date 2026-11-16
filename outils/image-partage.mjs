#!/usr/bin/env node
// Fabrique l'image de partage par défaut (src/images/partage.png, 1200 × 630) :
// une composition purement typographique, aux couleurs du site. Demande Playwright.
// À relancer si les couleurs de src/css/site.css changent : node outils/image-partage.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(path.join(RACINE, 'src/css/site.css'), 'utf8');
const couleur = (nom) => css.match(new RegExp(`--${nom}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
const police = readFileSync(path.join(RACINE, 'src/polices/archivo-latin-wght-normal.woff2')).toString('base64');
const site = JSON.parse(readFileSync(path.join(RACINE, 'donnees/site.json'), 'utf8'));

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${police}) format("woff2");font-weight:100 900}
body{margin:0;width:1200px;height:630px;display:flex;flex-direction:column;justify-content:flex-end;box-sizing:border-box;
padding:72px;background:${couleur('principale-foncee')};color:${couleur('clair')};font-family:A}
h1{margin:0;font-size:168px;font-weight:800;letter-spacing:-0.03em;line-height:.95}
p{margin:28px 0 0;font-size:44px;font-weight:500;color:${couleur('principale-claire')}}
i{display:block;width:120px;height:16px;background:${couleur('accent')};margin-bottom:auto}
</style><i></i><h1>${site.nom}</h1><p>${site.nom_complet}</p>`;

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(RACINE, 'src/images/partage.png') });
await navigateur.close();
console.log('Image de partage écrite : src/images/partage.png');
