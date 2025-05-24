const fs = require('fs');
const path = require('path');

// Paths
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

// 1. Clean and recreate output dir
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

// 2. Copy everything from src into public
copyDir(srcDir, outputDir);
console.log('Copied src/ into public/');

// 3. Read links
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

// 4. Build redirect folders
links.forEach(link => {
  const folderPath = path.join(outputDir, link.id);
  const filePath = path.join(folderPath, 'index.html');

  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

  const html = `<!DOCTYPE html>
<html lang="en" class="min-h-full text-white font-sans" style="background-image: linear-gradient(to bottom right, #00ffe0, #7e5bef, #00ffe0); background-size: 200% 200%; animation: gradientShift 6s ease infinite;">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${link.url}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${link.title}</title>
    <meta name="description" content="${link.description}" />
    <meta name="robots" content="noindex" />
    <meta property="og:title" content="${link.title}" />
    <meta property="og:description" content="${link.description}" />
    <meta property="og:image" content="${baseURL}/assets/images/profile.jpg" />
    <meta property="og:url" content="${baseURL}/${link.id}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>window.location.href = "${link.url}";</script>
  </head>
  <body>
    <noscript><meta http-equiv="refresh" content="0; url=${link.url}" /></noscript>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: white; font-family: sans-serif;">
      Redirecting to <a href="${link.url}" style="margin-left: 0.5rem; color: #00ffe0; text-decoration: underline;">${link.title}</a>...
    </div>
  </body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Built /${link.id}/index.html`);
});

// 5. Build robots.txt
const disallowed = links.map(link => `Disallow: /${link.id}/`).join('\n');
const robotsContent = `User-agent: *\nAllow: /\n${disallowed}\n`;
fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);
console.log('Built robots.txt');

// 6. Copy links.json to public
fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
console.log('Copied links.json to /public/');
