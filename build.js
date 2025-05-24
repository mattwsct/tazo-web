const fs = require('fs');
const path = require('path');

const baseURL = 'https://tazo.wtf';
const linksPath = path.join(__dirname, 'links.json');
const srcDir = path.join(__dirname, 'src');
const outputDir = path.join(__dirname, 'public');
const heroPath = path.join(__dirname, 'src/partials/hero.html');
const indexTemplatePath = path.join(__dirname, 'src/index.template.html');

// Load hero partial
const hero = fs.readFileSync(heroPath, 'utf-8');

// Copy folders recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (item !== 'index.template.html') {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and recreate public/
if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir);

// Copy all static files from src/ (except index.template.html)
copyDir(srcDir, outputDir);
console.log('Copied src/ into public/');

// Generate homepage index.html with hero injected
const indexTemplate = fs.readFileSync(indexTemplatePath, 'utf-8');
const indexFinal = indexTemplate.replace('<!-- {{hero}} -->', hero);
fs.writeFileSync(path.join(outputDir, 'index.html'), indexFinal);
console.log('Built index.html');

// Read and parse links.json
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

// Generate redirect pages with injected hero
links.forEach(link => {
  const folder = path.join(outputDir, link.id);
  const filepath = path.join(folder, 'index.html');
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);

  const html = `<!DOCTYPE html>
<html lang="en" class="min-h-screen flex flex-col text-white font-sans bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
  <head>
    <meta charset="UTF-8" />
    <title>Redirecting to ${link.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="3; url=${link.url}" />
    <meta property="og:title" content="${link.title}" />
    <meta property="og:description" content="${link.description}" />
    <meta property="og:image" content="${baseURL}/assets/images/profile.jpg" />
    <meta property="og:url" content="${baseURL}/${link.id}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="${baseURL}/assets/images/profile.jpg" />
    <link rel="preload" as="image" href="${baseURL}/assets/images/profile.jpg" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    </style>
  </head>

  <body class="min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
    ${hero}

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
      setTimeout(() => { window.location.href = "${link.url}" }, 1000);
    </script>
  </body>
</html>`;

  fs.writeFileSync(filepath, html);
  console.log(`Built /${link.id}/index.html`);
});

// Generate robots.txt
const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
fs.writeFileSync(
  path.join(outputDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n${disallowed}\n`
);
console.log('Built robots.txt');

// Copy links.json
fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json to /public/');
