const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPPORTED_LANGS = ['en', 'ru', 'th', 'zh', 'de', 'fr', 'ar', 'ko', 'ja', 'hi'];
const DEFAULT_LANG = 'en';

// Language display config for switcher
const LANG_CONFIG = {
  en: { flag: '🇬🇧', label: 'EN' },
  ru: { flag: '🇷🇺', label: 'RU' },
  th: { flag: '🇹🇭', label: 'TH' },
  zh: { flag: '🇨🇳', label: '中文' },
  de: { flag: '🇩🇪', label: 'DE' },
  fr: { flag: '🇫🇷', label: 'FR' },
  ar: { flag: '🇸🇦', label: 'عربي' },
  ko: { flag: '🇰🇷', label: '한국어' },
  ja: { flag: '🇯🇵', label: '日本語' },
  hi: { flag: '🇮🇳', label: 'हिंदी' }
};

// Map browser language codes to our supported languages
const BROWSER_LANG_MAP = {
  'en': 'en', 'ru': 'ru', 'th': 'th', 'zh': 'zh',
  'de': 'de', 'fr': 'fr', 'ar': 'ar', 'ko': 'ko',
  'ja': 'ja', 'hi': 'hi'
};

app.use(cookieParser());

// ======== LANGUAGE SWITCHER UI ========
function getLanguageSwitcherHTML(currentLang) {
  const currentCfg = LANG_CONFIG[currentLang];

  // Build dropdown options
  const options = SUPPORTED_LANGS.map(lang => {
    const cfg = LANG_CONFIG[lang];
    const isActive = lang === currentLang;
    return `<a href="/${lang === 'en' ? '' : lang + '/'}" class="ls-opt${isActive ? ' ls-active' : ''}" data-lang="${lang}">${cfg.flag} ${cfg.label}</a>`;
  }).join('');

  return `
<style>
  .ls-wrap {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .ls-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    transition: all 0.2s;
  }
  .ls-btn:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  .ls-btn .ls-arrow { font-size: 10px; transition: transform 0.2s; }
  .ls-wrap.open .ls-arrow { transform: rotate(180deg); }
  .ls-dropdown {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: rgba(255,255,255,0.98);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    min-width: 120px;
    padding: 6px;
    max-height: 340px;
    overflow-y: auto;
  }
  .ls-wrap.open .ls-dropdown { display: block; }
  .ls-opt {
    display: block;
    padding: 8px 12px;
    text-decoration: none;
    color: #333;
    font-size: 13px;
    border-radius: 8px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .ls-opt:hover { background: #f0f0f0; }
  .ls-active { background: #0088CC; color: white !important; }
  .ls-active:hover { background: #006da3; }
  @media (max-width: 480px) {
    .ls-wrap { top: 10px; right: 10px; }
    .ls-btn { padding: 6px 10px; font-size: 12px; }
    .ls-opt { padding: 6px 10px; font-size: 12px; }
  }
</style>
<div class="ls-wrap" id="langSwitcher">
  <button class="ls-btn" onclick="document.getElementById('langSwitcher').classList.toggle('open')">
    ${currentCfg.flag} ${currentCfg.label} <span class="ls-arrow">▼</span>
  </button>
  <div class="ls-dropdown">${options}</div>
</div>
<script>
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('langSwitcher');
    if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
  });
  // Set cookie on language selection
  document.querySelectorAll('.ls-opt').forEach(function(el) {
    el.addEventListener('click', function() {
      document.cookie = 'lang=' + this.dataset.lang + ';path=/;max-age=31536000';
    });
  });
</script>`;
}

// ======== DETECT PREFERRED LANGUAGE ========
function detectLanguage(req) {
  // 1. URL path
  const pathLang = req.path.split('/')[1];
  if (SUPPORTED_LANGS.includes(pathLang)) return pathLang;

  // 2. Cookie
  if (req.cookies.lang && SUPPORTED_LANGS.includes(req.cookies.lang)) return req.cookies.lang;

  // 3. Accept-Language header
  const acceptLang = req.headers['accept-language'] || '';
  const browserLangs = acceptLang.split(',').map(l => l.split(';')[0].trim().substring(0, 2).toLowerCase());
  for (const bl of browserLangs) {
    if (BROWSER_LANG_MAP[bl]) return BROWSER_LANG_MAP[bl];
  }

  return DEFAULT_LANG;
}

// ======== SERVE HTML WITH SWITCHER ========
function serveLanguagePage(lang, res) {
  const filePath = path.join(__dirname, 'public', lang, 'index.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`Language "${lang}" not available`);
  }

  let html = fs.readFileSync(filePath, 'utf-8');

  // Inject language switcher before </body>
  const switcher = getLanguageSwitcherHTML(lang);
  html = html.replace('</body>', `${switcher}\n</body>`);

  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ======== ROOT: EN or auto-redirect ========
app.get('/', (req, res) => {
  const lang = detectLanguage(req);
  if (lang === 'en') {
    // EN is served at root (like original)
    return serveLanguagePage('en', res);
  }
  res.redirect(302, `/${lang}/`);
});

// ======== LANGUAGE ROUTES ========
SUPPORTED_LANGS.forEach(lang => {
  if (lang === 'en') return; // EN served at root

  app.get(`/${lang}/`, (req, res) => {
    serveLanguagePage(lang, res);
  });

  // Sub-paths for assets
  app.get(`/${lang}/*`, (req, res, next) => {
    const subPath = req.path.replace(`/${lang}`, '');
    const filePath = path.join(__dirname, 'public', subPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    next();
  });
});

// Also serve EN explicitly at /en/ for consistency
app.get('/en/', (req, res) => {
  serveLanguagePage('en', res);
});

// ======== PRIVACY POLICY ========
app.get('/privacy-policy', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy — SO Origin Bang Tao</title></head>
<body style="max-width:800px;margin:40px auto;padding:20px;font-family:sans-serif;">
<h1>Privacy Policy</h1><p>This clone site does not collect personal data. All form submissions are handled by the original site sooriginbangtao.com.</p>
<p><a href="/">← Back to site</a></p></body></html>`);
});

// ======== FALLBACK ========
app.use((req, res) => {
  if (path.extname(req.path)) {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  res.redirect(302, '/');
});

app.listen(PORT, () => {
  console.log(`SO Origin Bang Tao (multilingual) running on port ${PORT}`);
  console.log(`Languages: ${SUPPORTED_LANGS.join(', ')}`);
});
