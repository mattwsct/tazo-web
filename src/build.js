// build.js
const fs = require("fs");
const path = require("path");

const links = require("./links.json");
const outDir = path.join(__dirname, "../dist");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

links.forEach(link => {
  const dir = path.join(outDir, link.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="3; url=${link.url}" />
  <title>${link.title}</title>
  <meta name="robots" content="noindex" />
  <meta property="og:title" content="${link.title}" />
  <meta property="og:description" content="${link.description}" />
  <meta property="og:url" content="${link.url}" />
  <meta property="og:image" content="https://tazo.wtf/profile.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
  <p>Redirecting to <a href="${link.url}">${link.url}</a>...</p>
  <script>
    window.location.replace(${JSON.stringify(link.url)});
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html);
});

console.log("✅ All redirect pages built to /dist");
