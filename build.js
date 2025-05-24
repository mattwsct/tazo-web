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

// Build index.html
const indexHTML = `<!DOCTYPE html>
<html lang="en" class="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Tazo | Livestreamer</title>
    <meta name="description" content="Tazo – live on Kick & Twitch" />
    <meta property="og:title" content="Tazo | Livestreamer" />
    <meta property="og:description" content="IRL & gaming streams on Kick and Twitch" />
    <meta property="og:image" content="${baseURL}/profile.jpg" />
    <meta property="og:url" content="${baseURL}/" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/profile.jpg" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />
    <style>body { font-family: 'Inter', sans-serif; }</style>
  </head>
  <body class="min-h-full text-white font-sans">
    ${heroHTML}
    <div id="stream" class="max-w-screen-md mx-auto mt-6 mb-6 px-4"></div>
    <div class="max-w-screen-md mx-auto px-4 animate-fade">
      <div id="links" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
    </div>
    <script>
      const linksPath = '/links.json';
      const kickUser = 'tazo';
      const twitchUser = 'tazo';
      const streamEl = document.getElementById('stream');
      const linksEl = document.getElementById('links');
      let kickLive = false, twitchLive = false;

      fetch(linksPath)
        .then(res => res.json())
        .then(links => {
          links.filter(link => link.showOnHomepage).forEach(link => {
            const a = document.createElement('a');
            a.href = `/${link.id}`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = `flex items-center gap-2 justify-center py-3 px-5 rounded-xl text-white font-semibold bg-gradient-to-r ${link.bg} transition hover:scale-105`;
            a.innerHTML = `
              ${link.icon ? `<img src="https://cdn.simpleicons.org/${link.icon}/fff" class="w-5 h-5" loading="lazy" alt="${link.icon} logo" />` : ''}
              <span${link.icon ? ` id="${link.icon}-lbl"` : ''}>${link.title}</span>
            `;
            linksEl.appendChild(a);
          });
        });

      fetch(`https://kick.com/api/v2/channels/${kickUser}`)
        .then(r => r.json())
        .then(d => {
          if (d.livestream) {
            kickLive = true;
            markLive('kick');
            embedKick();
          }
        })
        .finally(checkTwitch);

      function checkTwitch() {
        fetch(`https://api.ivr.fi/v2/twitch/user/${twitchUser}`)
          .then(r => r.json())
          .then(d => {
            if (d.stream) {
              twitchLive = true;
              markLive('twitch');
              if (!kickLive) embedTwitch();
            }
          });
      }

      function markLive(id) {
        const lbl = document.getElementById(`${id}-lbl`);
        if (lbl) lbl.innerHTML += ' <span class="text-red-500 animate-pulse">●</span>';
      }

      function setIframe(src) {
        const f = document.createElement('iframe');
        f.src = src;
        f.className = 'w-full aspect-video rounded-xl shadow-lg';
        f.loading = 'lazy';
        f.allowFullscreen = true;
        streamEl.appendChild(f);
      }

      function embedKick() {
        setIframe(`https://kick.com/embed/${kickUser}?muted=true&chatEnabled=false`);
      }

      function embedTwitch() {
        setIframe(`https://player.twitch.tv/?channel=${twitchUser}&parent=${location.hostname}&muted=true&chat=false`);
      }
    </script>
    <div class="h-12"></div>
  </body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexHTML);
console.log('Built index.html');

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
    <style>body { font-family: 'Inter', sans-serif; }</style>
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
