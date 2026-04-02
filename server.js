const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = 'https://sooriginbangtao.com';
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

function injectSEO(html) {
  // Improve title
  html = html.replace(/<title>[^<]*<\/title>/i,
    '<title>SO Origin Bang Tao Phuket \u2014 Condos For Sale from $127K | Near Bang Tao Beach</title>');
  // Improve meta description if weak
  if (!html.includes('resort-style living')) {
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"/i,
      '<meta name="description" content="SO Origin Bang Tao Phuket \u2014 545 resort-style condos near Bang Tao Beach. Studios from $127K. 7-15% rental yield. Completion June 2026. By Origin Property."');
  }
  // Add keywords if missing
  if (!html.includes('name="keywords"')) {
    html = html.replace('</head>',
      '<meta name="keywords" content="SO Origin Bangtao, Bang Tao Phuket condo, buy condo Phuket, Phuket investment, Origin Property, off-plan Phuket">\n</head>');
  }
  // Add JSON-LD structured data
  if (!html.includes('application/ld+json')) {
    const jsonLd = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"RealEstateListing","name":"SO Origin Bang Tao Phuket","description":"Resort-style condominiums near Bang Tao Beach. 545 units. From $127,000.","url":"https://sooriginbangtao.com","offers":{"@type":"Offer","priceCurrency":"USD","price":"127000"},"address":{"@type":"PostalAddress","addressLocality":"Choeng Thale","addressRegion":"Phuket","addressCountry":"TH"}}</script>';
    const faqLd = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is the architectural style of So Origin in Phuket?","acceptedAnswer":{"@type":"Answer","text":"SO Origin Bang Tao features innovative low-rise architecture with three 8-floor buildings incorporating sustainable design and modern amenities."}},{"@type":"Question","name":"What sustainable features are incorporated?","acceptedAnswer":{"@type":"Answer","text":"Energy-efficient lighting, rainwater harvesting systems, and solar panels are integrated into the development."}},{"@type":"Question","name":"What recreational facilities are available?","acceptedAnswer":{"@type":"Answer","text":"State-of-the-art fitness center, yoga pavilion, infinity pool, sky lounge, co-working spaces, and landscaped gardens."}},{"@type":"Question","name":"How does So Origin cater to remote workers?","acceptedAnswer":{"@type":"Answer","text":"Dedicated co-working spaces, high-speed internet, and proximity to lifestyle hubs make it ideal for digital nomads."}}]}</script>';
    html = html.replace('</head>', jsonLd + '\n' + faqLd + '\n</head>');
  }
  // Add OG image if missing
  if (!html.includes('og:image') || html.includes('og:image" content=""')) {
    html = html.replace('</head>', '<meta property="og:image" content="https://sooriginbangtao.com/wp-content/uploads/2024/so-origin-bangtao-hero.jpg">\n</head>');
  }
  // Add Organization schema
  const orgLd = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Tumanov Group","url":"https://tumanov.group","description":"Investment consulting for Phuket real estate"}</script>';
  html = html.replace('</head>', orgLd + '\n</head>');
  return html;
}

async function ensureContent() {
  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('No cached content, downloading...');
    try {
      const resp = await fetch(SITE_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' }
      });
      if (resp.ok) {
        let html = await resp.text();
        html = html.replace(/href="\/\//g, 'href="' + SITE_URL + '/');
        html = injectSEO(html);
        fs.writeFileSync(indexPath, html);
        console.log('Cached with SEO (' + html.length + ' bytes)');
      }
    } catch (err) { console.error('Failed:', err.message); }
  } else { console.log('Using cached content'); }
}
app.use(express.static(publicDir));
app.get('/privacy-policy', async (req, res) => {
  const privPath = path.join(publicDir, 'privacy-policy.html');
  if (fs.existsSync(privPath)) return res.sendFile(privPath);
  try { const resp = await fetch(SITE_URL + '/privacy-policy/', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' } }); const html = await resp.text(); fs.writeFileSync(privPath, html); res.send(html); } catch (err) { res.status(502).send('Page not available'); }
});
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(503).send('Content not yet cached.');
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));
ensureContent().then(() => { app.listen(PORT, '0.0.0.0', () => { console.log('Server on port ' + PORT); }); });
