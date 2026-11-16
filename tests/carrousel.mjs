// Essai du carrousel dans un navigateur : défilement automatique, pause, clavier,
// glissement, lien de la diapositive, « réduire les animations ».
// Usage : construire avec les données d'essai, lancer « npm run apercu », puis « node tests/carrousel.mjs ».
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.USL_APERCU ?? 'http://localhost:8080';
const echecs = [];
const verifier = (ok, nom) => { console.log(`${ok ? 'ok   ' : 'ÉCHEC'} ${nom}`); if (!ok) echecs.push(nom); };

const navigateur = await chromium.launch();
const actif = (page) => page.evaluate(() => [...document.querySelectorAll('.diapo')].findIndex((d) => !d.inert));

{
  const page = await (await navigateur.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.clock.install();
  await page.goto(BASE + '/');
  verifier((await actif(page)) === 0, 'la première diapositive est affichée');
  await page.clock.runFor(6100);
  verifier((await actif(page)) === 1, 'défilement automatique après 6 secondes');
  const duree = await page.evaluate(() => getComputedStyle(document.querySelector('.carrousel__piste')).transitionDuration);
  verifier(duree === '0.3s', `transition de 300 ms (${duree})`);

  await page.click('[data-action="pause"]');
  verifier((await page.textContent('[data-action="pause"]')) === 'Lecture', 'le bouton pause devient « Lecture »');
  await page.mouse.move(5, 790);
  await page.clock.runFor(13000);
  verifier((await actif(page)) === 1, 'en pause : plus de défilement');
  await page.click('[data-action="pause"]');
  await page.mouse.move(5, 790);
  await page.locator('body').click({ position: { x: 5, y: 790 } });
  await page.clock.runFor(6100);
  verifier((await actif(page)) === 2, 'lecture : le défilement reprend');

  await page.hover('.carrousel__fenetre');
  await page.clock.runFor(13000);
  verifier((await actif(page)) === 2, 'pause au survol');
  await page.mouse.move(5, 790);

  await page.click('[data-action="suivant"]');
  verifier((await actif(page)) === 3, 'bouton « Suivante »');
  await page.clock.runFor(13000);
  verifier((await actif(page)) === 3, 'pause tant que le focus est dans le carrousel');
  await page.click('[data-action="precedent"]');
  verifier((await actif(page)) === 2, 'bouton « Précédente »');
  await page.click('.point[data-index="4"]');
  verifier((await actif(page)) === 4, 'points de navigation');
  verifier((await page.getAttribute('.point[data-index="4"]', 'aria-current')) === 'true', 'le point courant est signalé');
  await page.keyboard.press('ArrowRight');
  verifier((await actif(page)) === 0, 'flèche droite du clavier (retour au début après la dernière)');
  await page.keyboard.press('ArrowLeft');
  verifier((await actif(page)) === 4, 'flèche gauche du clavier');

  const focusables = await page.evaluate(() => [...document.querySelectorAll('.diapo a')].filter((a) => a.tabIndex === 0 && !a.closest('[inert]')).length);
  verifier(focusables === 1, 'seul le lien de la diapositive visible est atteignable au clavier');

  // Glissement à la souris, puis vérification qu'il n'ouvre pas la page.
  const boite = await page.locator('.carrousel__fenetre').boundingBox();
  const y = boite.y + boite.height / 2;
  await page.mouse.move(boite.x + 600, y);
  await page.mouse.down();
  await page.mouse.move(boite.x + 300, y, { steps: 6 });
  await page.mouse.up();
  verifier((await actif(page)) === 0 && new URL(page.url()).pathname === '/', 'glissement vers la gauche : diapositive suivante, sans ouvrir le lien');

}
{
  // Toute la diapositive est cliquable (ici : clic au milieu de la photo), y compris après un glissement.
  const page = await (await navigateur.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto(BASE + '/');
  const boite = await page.locator('.carrousel__fenetre').boundingBox();
  const y = boite.y + boite.height / 2;
  await page.mouse.move(boite.x + 600, y);
  await page.mouse.down();
  await page.mouse.move(boite.x + 300, y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.mouse.click(boite.x + 200, boite.y + 100);
  await page.waitForURL('**/manifestations/**');
  verifier(/\/manifestations\/[a-z-]+\/$/.test(new URL(page.url()).pathname), 'un clic sur la photo ouvre la manifestation');
}
{
  // Glissement au doigt sur téléphone.
  const contexte = await navigateur.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
  const page = await contexte.newPage();
  await page.goto(BASE + '/');
  const cdp = await contexte.newCDPSession(page);
  const toucher = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await toucher('touchStart', 300, 120);
  for (const x of [270, 230, 190, 150, 110]) await toucher('touchMove', x, 122);
  await toucher('touchEnd');
  await page.waitForTimeout(400);
  verifier((await actif(page)) === 1, 'glissement au doigt');
}
{
  const page = await (await navigateur.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })).newPage();
  await page.clock.install();
  await page.goto(BASE + '/');
  await page.clock.runFor(13000);
  verifier((await actif(page)) === 0, '« réduire les animations » : pas de défilement automatique');
  const duree = await page.evaluate(() => getComputedStyle(document.querySelector('.carrousel__piste')).transitionDuration);
  verifier(duree === '0s', '« réduire les animations » : transition désactivée');
}
{
  // Sans JavaScript : tout reste lisible et atteignable.
  const page = await (await navigateur.newContext({ viewport: { width: 360, height: 740 }, javaScriptEnabled: false })).newPage();
  await page.goto(BASE + '/');
  verifier(await page.locator('.menu__liste a').first().isVisible(), 'sans JavaScript : le menu est visible');
  verifier((await page.locator('.diapo a').count()) > 1 && !(await page.locator('.carrousel__commandes').isVisible()), 'sans JavaScript : diapositives défilables, commandes masquées');
  await page.goto(BASE + '/manifestations/');
  verifier((await page.locator('.ligne').count()) === (await page.locator('.ligne:visible').count()), 'sans JavaScript : toutes les manifestations sont listées');
}
await navigateur.close();
if (echecs.length) { console.log(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log('\nCarrousel : tous les essais passent.');
