const fs = require('fs');
const path = require('path');

const linksPath = path.join(__dirname, 'src', 'links.json');
const outputDir = path.join(__dirname, 'public');

// Load link data
const links = JSON.parse(fs.readFileSync(linksPath, 'utf-8'));

// Ensure output folders exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Generate redirect pages
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
    <meta property="og:url" content="https://tazo.wtf/${link.id}" />
    <meta property="og:image" content="https://tazo.wtf/profile.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>
      window.location.href = "${link.url}";
    </script>
  </head>
  <body></body>
</html>`;

  fs.writeFileSync(filePath, html);
  console.log(`Built /${link.id}/index.html`);
});
