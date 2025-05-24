const fs = require('fs');
const path = require('path');

const baseURL = 'https://tazo.wtf';
const linksPath = path.join(__dirname, 'links.json');
const srcDir = path.join(__dirname, 'src');
const outputDir = path.join(__dirname, 'public');

// Clean and recreate output directory
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// Recursively copy all files from src to public
function copyDir(src, dest) {
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(srcDir, outputDir);
console.log('📁 Copied src/ into public/');

try {
  // Load and parse links.json
  const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));

  // Generate redirect folders and pages
  for (const link of links) {
    const folder = path.join(outputDir, link.id);
    fs.mkdirSync(folder, { recursive: true });

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${link.url}"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${link.title}</title><meta name="description" content="${link.description}"><meta name="robots" content="noindex"><meta property="og:title" content="${link.title}"><meta property="og:description" content="${link.description}"><meta property="og:image" content="${baseURL}/assets/images/profile.jpg"><meta property="og:url" content="${baseURL}/${link.id}"><meta name="twitter:card" content="summary_large_image"><script>window.location.href="${link.url}"</script></head><body><noscript><meta http-equiv="refresh" content="0; url=${link.url}"></noscript><div style="display:flex;justify-content:center;align-items:center;height:100vh;color:white;font-family:sans-serif">Redirecting to <a href="${link.url}" style="margin-left:0.5rem;color:#00ffe0;text-decoration:underline">${link.title}</a>...</div></body></html>`;

    fs.writeFileSync(path.join(folder, 'index.html'), html);
    console.log(`🔁 Built /${link.id}/index.html`);
  }

  // Build robots.txt
  const robots = `User-agent: *
Allow: /
Disallow: /links.json
Disallow: /404.html
`;
  fs.writeFileSync(path.join(outputDir, 'robots.txt'), robots);
  console.log('🤖 Built robots.txt');

  // Copy links.json
  fs.copyFileSync(linksPath, path.join(outputDir, 'links.json'));
  console.log('🔗 Copied links.json');

  // Build sitemap.xml (only homepage)
  const today = new Date().toISOString().split('T')[0];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseURL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
  console.log('🗺️  Built sitemap.xml (homepage only)');

  // Done
  console.log(`✅ Build complete at ${new Date().toLocaleString()}`);
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
