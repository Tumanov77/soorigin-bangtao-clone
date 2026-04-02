const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = 'https://sooriginbangtao.com';
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) { fs.mkdirSync(publicDir, { recursive: true }); }
async function ensureContent() {
  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('No cached content, downloading...');
    try {
      const resp = await fetch(SITE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7' } });
      if (resp.ok) { let html = await resp.text(); html = html.replace(/href="\//g, 'href="' + SITE_URL + '/'); fs.writeFileSync(indexPath, html); console.log('Cached index.html'); }
    } catch (err) { console.error('Failed to download:', err.message); }
  } else { console.log('Using cached content'); }
}
app.use(express.static(publicDir));
app.get('/privacy-policy', async (req, res) => {
  const privPath = path.join(publicDir, 'privacy-policy.html');
  if (fs.existsSync(privPath)) return res.sendFile(privPath);
  try { const resp = await fetch(SITE_URL + '/privacy-policy/', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' } }); const html = await resp.text(); fs.writeFileSync(privPath, html); res.send(html); } catch (err) { res.status(502).send('Page not available'); }
});
app.get('/', (req, res) => { const indexPath = path.join(publicDir, 'index.html'); if (fs.existsSync(indexPath)) res.sendFile(indexPath); else res.status(503).send('Content not yet cached.'); });
app.get('/health', (req, res) => res.json({ status: 'ok' }));
ensureContent().then(() => { app.listen(PORT, '0.0.0.0', () => { console.log('Server running on port ' + PORT); }); });
