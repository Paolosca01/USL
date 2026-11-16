// En-têtes de sécurité (règle 5.8). Une seule définition, utilisée pour
// .htaccess (Apache), _headers (Netlify, Cloudflare Pages) et l'aperçu local.

export const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "manifest-src 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
];

export function entetes({ https = true } = {}) {
  const e = {
    'Content-Security-Policy': [...CSP, ...(https ? ['upgrade-insecure-requests'] : [])].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
  if (https) e['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return e;
}

export function htaccess() {
  const lignes = Object.entries(entetes())
    .map(([nom, valeur]) => `  Header always set ${nom} "${valeur}"`)
    .join('\n');
  return `# Généré par outils/construire.mjs. Ne pas modifier ici.
Options -Indexes
AddDefaultCharset utf-8
ErrorDocument 404 /404.html

# HTTPS partout
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# En-têtes de sécurité
<IfModule mod_headers.c>
${lignes}
  Header always unset X-Powered-By
  <FilesMatch "\\.(woff2|avif|webp|jpg|png|svg|css|js)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|xml|ics)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>

<IfModule mod_mime.c>
  AddType font/woff2 .woff2
  AddType image/avif .avif
  AddType image/webp .webp
  AddType text/calendar .ics
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml application/xml text/calendar
</IfModule>
`;
}

export function fichierHeaders() {
  const lignes = Object.entries(entetes())
    .map(([nom, valeur]) => `  ${nom}: ${valeur}`)
    .join('\n');
  return `# Généré par outils/construire.mjs. Ne pas modifier ici.
/*
${lignes}

/polices/*
  Cache-Control: public, max-age=31536000, immutable
/images/gen/*
  Cache-Control: public, max-age=31536000, immutable
`;
}
