const fs = require('fs');
const path = require('path');

const baseURL = 'https://tazo.wtf';
const links = JSON.parse(fs.readFileSync('links.json', 'utf-8'));
const src = 'src', out = 'public';

const read = f => fs.readFileSync(path.join(src, f), 'utf-8');
const layout = read('layouts/layout.html');
const head = read('partials/head.html');
const hero = read('partials/hero.html');
const indexContent = read('index.template.html');
const errorContent = read('404.template.html');

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true });
fs.mkdirSync(out, { recursive: true });

const copyDir = (from, to) => {
  for (const file of fs.readdirSync(from)) {
    const srcPath = path.join(from, file);
    const destPath = path.join(to, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!['partials', 'layouts'].includes(file)) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      }
    } else if (!file.endsWith('.template.html')) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
};
copyDir(src, out);

const render = (meta, body) => layout
  .replace('{{head}}', head)
  .replace('{{hero}}', hero)
  .replace('{{titleMeta}}', meta)
  .replace('{{content}}', body);

fs.writeFileSync(path.join(out, 'index.html'), render(`
  <title>Tazo | Livestreamer from Australia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Tazo is a livestreamer based in Australia — streaming on Kick, Twitch, and more.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Tazo | Livestreamer from Australia">
  <meta property="og:description" content="Watch Tazo live on Kick and Twitch — livestream content, travel, and more.">
  <meta property="og:image" content="${baseURL}/assets/images/profile.jpg">
  <meta property="og:url" content="${baseURL}/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Tazo | Livestreamer from Australia">
  <meta name="twitter:description" content="Streaming live on Kick & Twitch — exploring Australia, Asia, and beyond.">
  <meta name="twitter:image" content="${baseURL}/assets/images/profile.jpg">
`, indexContent));

fs.writeFileSync(path.join(out, '404.html'), render(`
  <title>404 – Page Not Found</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
`, errorContent));

const redirectHTML = (title, url) => render(`
  <title>Redirecting to ${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${url}">
`, `
  <div class="flex flex-col items-center justify-center text-center min-h-[50vh] py-12 px-4">
    <p class="text-lg text-white animate-pulse">Redirecting to <strong>${title}</strong>…</p>
    <p class="text-sm text-zinc-400 mt-2">If nothing happens, <a href="${url}" class="underline text-accent">click here</a>.</p>
    <p class="text-xs text-zinc-600 mt-6"><a href="/" class="underline hover:text-accent transition">← Back to homepage</a></p>
  </div>
  <script>setTimeout(() => { location.href = "${url}" }, 2000);</script>
  <noscript><meta http-equiv="refresh" content="2; url=${url}"></noscript>
`);

for (const link of links) {
  const paths = [link.id, ...(link.aliases || [])];
  for (const slug of paths) {
    const folder = path.join(out, slug);
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'index.html'), redirectHTML(link.title, link.url));
  }
}

fs.writeFileSync(path.join(out, 'robots.txt'),
  `User-agent: *\nAllow: /\n${links.map(l => `Disallow: /${l.id}/`).join('\n')}\n\nSitemap: ${baseURL}/sitemap.xml`
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseURL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemap.trim());

fs.copyFileSync('links.json', path.join(out, 'links.json'));
