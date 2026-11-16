#!/usr/bin/env node
// Aperçu local du site généré, avec les mêmes en-têtes de sécurité qu'en production.
// Usage : npm run apercu   puis ouvrir http://localhost:8080
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { entetes } from './lib/entetes.mjs';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT ?? 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.ics': 'text/calendar; charset=utf-8', '.pdf': 'application/pdf',
};

createServer((req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let fichier = path.join(PUBLIC, path.normalize(chemin));
  if (!fichier.startsWith(PUBLIC)) fichier = PUBLIC;
  if (existsSync(fichier) && statSync(fichier).isDirectory()) fichier = path.join(fichier, 'index.html');
  let statut = 200;
  if (!existsSync(fichier)) {
    statut = 404;
    fichier = path.join(PUBLIC, '404.html');
  }
  res.writeHead(statut, {
    'Content-Type': TYPES[path.extname(fichier)] ?? 'application/octet-stream',
    ...entetes({ https: false }),
  });
  res.end(readFileSync(fichier));
}).listen(PORT, () => console.log(`Aperçu : http://localhost:${PORT}  (Ctrl+C pour arrêter)`));
