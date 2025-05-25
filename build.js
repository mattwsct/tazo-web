const fs = require('fs');
const path = require('path');

const baseURL = 'https://tazo.wtf';
const linksPath = path.join(__dirname, 'links.json');
const srcDir = path.join(__dirname, 'src');
const outputDir = path.join(__dirname, 'public');

// Load partials and templates
const layout = fs.readFileSync(path.join(srcDir, 'layouts/layout.html'), 'utf-8');
const head = fs.readFileSync(path.join(srcDir, 'partials/head.html'), 'utf-8');
const hero = fs.readFileSync(path.join(srcDir, 'partials/hero.html'), 'utf-8');
const indexTemplate = fs.readFileSync(path.join(srcDir, 'index.template.html'), 'utf-8');
const errorTemplate = fs.readFileSync(path.join(srcDir, '404.template.html'), 'utf-8');
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

// Rebuild /public
if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir);

// Copy static files (except partials + templates)
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!['partials', 'layouts'].includes(item)) copyDir(srcPath, destPath);
    } else if (!item.endsWith('.template.html')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(srcDir, outputDir);
console.log('Copied static assets.');

// Render full pages
function renderPage({ titleMeta, content }) {
  return layout
    .replace('{{head}}', head)
    .replace('{{hero}}', hero)
    .replace('{{titleMeta}}', titleMeta)
    .replace('{{content}}', content);
}

// Index page
const indexMeta = `
  <title>Tazo | Livestreamer from Australia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Tazo is a livestreamer based in Australia — streaming on Kick, Twitch, and more." />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="Tazo" />
  <meta property="og:title" content="Tazo | Livestreamer from Australia" />
  <meta property="og:description" content="Watch Tazo live on Kick and Twitch — livestream content, travel, and more." />
  <meta property="og:image" content="${baseURL}/assets/images/profile.jpg" />
  <meta property="og:url" content="${baseURL}/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Tazo | Livestreamer from Australia" />
  <meta name="twitter:description" content="Streaming live on Kick & Twitch — exploring Australia, Asia, and beyond." />
  <meta name="twitter:image" content="${baseURL}/assets/images/profile.jpg" />
`;
const indexFinal = renderPage({ titleMeta: indexMeta, content: indexTemplate });
fs.writeFileSync(path.join(outputDir, 'index.html'), indexFinal);
console.log('Built index.html');

// 404 page
const errorMeta = `
  <title>404 – Page Not Found</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
`;
const errorFinal = renderPage({ titleMeta: errorMeta, content: errorTemplate });
fs.writeFileSync(path.join(outputDir, '404.html'), errorFinal);
console.log('Built 404.html');

// Redirect pages
links.forEach(link => {
  const folder = path.join(outputDir, link.id);
  fs.mkdirSync(folder, { recursive: true });

  const redirectMeta = `
    <title>Redirecting to ${link.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${link.url}" />
  `;

  const redirectContent = `
    <div class="flex flex-col items-center justify-center text-center py-12 px-4">
      <p class="text-lg">Redirecting to <strong>${link.title}</strong>…</p>
      <p class="text-sm text-zinc-400 mt-2">
        If nothing happens, <a href="${link.url}" class="underline text-accent">click here</a>.
      </p>
      <p class="text-xs text-zinc-500 mt-6">
        <a href="/" class="underline text-zinc-500">← Back to homepage</a>
      </p>
    </div>

    <script>
      setTimeout(() => {
        window.location.href = "${link.url}";
      }, 3000);
    </script>
    <noscript>
      <meta http-equiv="refresh" content="3; url=${link.url}" />
    </noscript>
  `;

  const redirectFinal = renderPage({ titleMeta: redirectMeta, content: redirectContent });
  fs.writeFileSync(path.join(folder, 'index.html'), redirectFinal);
  console.log(`Built /${link.id}/index.html`);
});

// robots.txt
const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
fs.writeFileSync(
  path.join(outputDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n${disallowed}\n\nSitemap: ${baseURL}/sitemap.xml`
);
console.log('Built robots.txt');

// sitemap.xml
const sitemapPages = [''];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapPages.map(page => `
  <url>
    <loc>${baseURL}/${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`).join('\n') +
  `\n</urlset>\n`;
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap.trim());
console.log('Built sitemap.xml');

// links.json
fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json.');
