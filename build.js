const fs = require('fs');
const path = require('path');

const baseURL = 'https://tazo.wtf';
const linksPath = path.join(__dirname, 'links.json');
const srcDir = path.join(__dirname, 'src');
const outputDir = path.join(__dirname, 'public');

// Helper to copy folders recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and recreate output dir
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

// Copy everything from src into public
copyDir(srcDir, outputDir);
console.log('Copied src/ into public/');

// Read links
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

// Build redirect folders
links.forEach(link => {
  const folderPath = path.join(outputDir, link.id);
  const filePath = path.join(folderPath, 'index.html');

  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

  const html = `<!DOCTYPE html>
<html lang="en" class="min-h-full text-white font-sans bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
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
  <body class="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
    <section class="relative w-full h-64 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-[#00ffe0] via-purple-500 to-[#00ffe0] bg-[length:200%_200%] animate-[gradientShift_6s_ease_infinite]"></div>
      <div class="absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 flex flex-col items-center justify-center h-full">
        <img src="${baseURL}/assets/images/profile.jpg" alt="Tazo avatar" class="w-24 h-24 rounded-full shadow-md object-cover" />
        <h1 class="text-4xl uppercase mt-3 drop-shadow-md" style="font-family: 'Bebas Neue', sans-serif;">Tazo</h1>
        <p class="text-zinc-300 text-sm">Livestreamer from Australia</p>
      </div>
    </section>
    <div class="mt-12 px-4">
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

  fs.writeFileSync(filePath, html);
  console.log(`Built /${link.id}/index.html`);
});

// Build robots.txt
const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
const robotsContent = `User-agent: *\nAllow: /\n${disallowed}\n`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);
console.log('Built robots.txt');

// Copy links.json
fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json to /public/');
