const fs = require('fs');
const path = require('path');

const baseURL = process.env.BASE_URL || 'https://tazo.wtf';

// Paths
const linksPath = path.join(__dirname, 'links.json');
const outputDir = path.join(__dirname, 'public');
const heroPath = path.join(__dirname, 'templates', 'hero.html');

// Clean and recreate output dir
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

// Read links
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));
const heroHTML = fs.existsSync(heroPath) ? fs.readFileSync(heroPath, 'utf-8') : '';

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
    <meta name="robots" content="noindex" />
    <meta property="og:title" content="${link.title}" />
    <meta property="og:description" content="${link.description}" />
    <meta property="og:image" content="${baseURL}/profile.jpg" />
    <meta property="og:url" content="${baseURL}/${link.id}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>window.location.href = "${link.url}";</script>
  </head>
  <body>
    <noscript><meta http-equiv="refresh" content="0; url=${link.url}" /></noscript>
  </body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Built /${link.id}/index.html`);
});

// Build robots.txt
const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
const robotsContent = `User-agent: *\nAllow: /\n${disallowed}\n`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);
console.log('Built robots.txt');

// Generate 404.html
const notFoundHTML = `<!DOCTYPE html>
<html lang="en" class="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white font-sans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>404 – Not Found</title>
    <meta name="robots" content="noindex" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />
    <style>
      body { font-family: 'Inter', sans-serif; }
    </style>
  </head>
  <body class="flex flex-col items-center justify-center min-h-screen text-center">
    ${heroHTML}
    <div class="py-16">
      <h2 class="text-4xl font-bold mb-4">404 – Page Not Found</h2>
      <p class="text-zinc-400 mb-6">This page doesn’t exist. Go back to <a href="/" class="text-accent underline">tazo.wtf</a>.</p>
    </div>
  </body>
</html>`;

fs.writeFileSync(path.join(outputDir, '404.html'), notFoundHTML);
console.log('Built 404.html');

// Generate sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseURL}/</loc><changefreq>weekly</changefreq></url>
</urlset>
`;

fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
console.log('Built sitemap.xml');

// Copy links.json for homepage use
fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json to /public/');
