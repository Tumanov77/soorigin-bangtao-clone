const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const SITE_URL = 'https://sooriginbangtao.com';
async function downloadSite() {
  console.log('Downloading ' + SITE_URL);
  try {
    const resp = await fetch(SITE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7' } });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    let html = await resp.text();
    html = html.replace(/href="\//g, 'href="' + SITE_URL + '/');
    html = html.replace(/action="\//g, 'action="' + SITE_URL + '/');
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'index.html'), html);
    console.log('Saved index.html (' + html.length + ' bytes)');
    try {
      const privResp = await fetch(SITE_URL + '/privacy-policy/', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' } });
      if (privResp.ok) { let privHtml = await privResp.text(); privHtml = privHtml.replace(/href="\//g, 'href="' + SITE_URL + '/'); fs.writeFileSync(path.join(publicDir, 'privacy.html'), privHtml); console.log('Saved privacy.html'); }
    } catch(e) { console.log('Privacy page not available'); }
    console.log('Download complete!');
  } catch (err) { console.error('Download failed:', err.message); process.exit(1); }
}
downloadSite();
