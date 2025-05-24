const fs = require('fs');
const path = require('path');

const baseURL = process.env.BASE_URL || 'https://tazo.wtf';
const linksPath = path.join(__dirname, 'links.json');
const outputDir = path.join(__dirname, 'public');

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

links.forEach(link => {
  const folderPath = path.join(outputDir, link.id);
  const filePath = path.join(folderPath, 'index.html');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const html = `<!DOCTYPE html>
<html lang="en" class="min-h-full text-white font-sans" style="background-image: linear-gradient(to bottom right, #00ffe0, #7e5bef, #00ffe0); background-size: 200% 200%; animation: gradientShift 6s ease infinite;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to ${link.title}…</title>
    <meta name="description" content="${link.description}" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="2; url=${link.url}" />

    <meta property="og:title" content="Tazo | ${link.title}" />
    <meta property="og:description" content="${link.description}" />
    <meta property="og:image" content="${baseURL}/profile.jpg" />
    <meta property="og:url" content="${baseURL}/${link.id}" />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="icon" href="/profile.jpg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet" />
    <script>
      setTimeout(() => {
        window.location.href = "${link.url}";
      }, 2000);
    </script>
    <style>
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      body {
        font-family: 'Inter', sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100dvh;
        text-align: center;
        background-image: linear-gradient(to bottom right, #00ffe0, #7e5bef, #00ffe0);
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
      }
      h1 {
        font-family: 'Bebas Neue', sans-serif;
      }
          html {
        background-image: linear-gradient(to bottom right, #00ffe0, #7e5bef, #00ffe0);
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
      }
    </style>
  </head>
  <body>
    <a href="/">
      <img src="/profile.jpg" alt="Tazo" class="w-24 h-24 rounded-full mb-4" />
    </a>
    <h1 class="text-3xl uppercase mb-2">Tazo</h1>
    <p class="text-zinc-400 mb-6">Redirecting to ${link.title}…</p>
    <p><a href="${link.url}" class="text-accent underline">Click here if it doesn’t happen automatically</a></p>
  </body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Built /${link.id}/index.html`);
});

const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
const robotsContent = `User-agent: *\nAllow: /\n${disallowed}\n`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);
console.log('Built robots.txt');

fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json to /public/');
