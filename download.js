const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const SITE_URL = 'https://sooriginbangtao.com';

function injectSEO(html) {
  html = html.replace(/<title>[^<]*<\/title>/i, '<title>SO Origin Bang Tao Phuket \u2014 Condos For Sale from $127K | Near Bang Tao Beach</title>');
  if (!html.includes('name="keywords"')) {
    html = html.replace('</head>', '<meta name="keywords" content="SO Origin Bangtao, Bang Tao Phuket condo, buy condo Phuket, Phuket investment, Origin Property">\n</head>');
  }
  if (!html.includes('application/ld+json')) {
    html = html.replace('</head>', '<script type="application/ld+json">{"@context":"https://schema.org","@type":"RealEstateListing","name":"SO Origin Bang Tao Phuket","description":"545 resort condos near Bang Tao Beach. From $127K.","url":"https://sooriginbangtao.com","offers":{"@type":"Offer","priceCurrency":"USD","price":"127000"},"address":{"@type":"PostalAddress","addressLocality":"Choeng Thale","addressRegion":"Phuket","addressCountry":"TH"}}</script>\n</head>');
  }
  return html;
}

async function downloadSite() {
  console.log('Downloading ' + SITE_URL);
  try {
    const resp = await fetch(SITE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' } });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    let html = await resp.text();
    html = html.replace(/href="\/\//g, 'href="' + SITE_URL + '/');
    html = injectSEO(html);
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'index.html'), html);
    console.log('Saved with SEO (' + html.length + ' bytes)');
  } catch (err) { console.error('Failed:', err.message); process.exit(1); }
}
downloadSite();
