const fs = require('fs');
const path = require('path');

const baseURL = process.env.BASE_URL || 'https://tazo.wtf';

// Paths
const linksPath = path.join(__dirname, 'links.json');
const outputDir = path.join(__dirname, 'public');

// Read links
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

// Create output dir if missing
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Build redirect folders
links.forEach(link => {
  const folderPath = path.join(outputDir, link.id);
  const filePath = path.join(folderPath, 'index.html');

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${link.url}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${link.title}</title>
    <meta name="description" content="${link.description}" />
    <meta property="og:title" content="${link.title}" />
    <meta property="og:description" content="${link.description}" />
    <meta property="og:image" content="${baseURL}/profile.jpg" />
    <meta property="og:url" content="${baseURL}/${link.id}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>window.location.href = "${link.url}";</script>
  </head>
  <body></body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Built /${link.id}/index.html`);
});

// Build robots.txt
const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
const robotsContent = `User-agent: *\nAllow: /\n${disallowed}\n`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);
console.log('Built robots.txt');

// ---- Generate 404.html ----
const notFoundHTML = `<!DOCTYPE html>
<html lang="en" class="bg-zinc-950 text-white text-center min-h-screen flex flex-col justify-center items-center font-sans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>404 – Not Found</title>
    <meta name="robots" content="noindex" />
  </head>
  <body>
    <h1 class="text-5xl font-bold mb-4">404</h1>
    <p class="text-zinc-400 mb-8">This page doesn’t exist. Go back to <a href="/" class="text-accent underline">tazo.wtf</a>.</p>
  </body>
</html>`;

fs.writeFileSync(path.join(outputDir, '404.html'), notFoundHTML);
console.log('Built 404.html');

// ---- Optional: Generate sitemap.xml ----
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseURL}/</loc><changefreq>weekly</changefreq></url>
</urlset>
`;

fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
console.log('Built sitemap.xml');

fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json to /public/');

