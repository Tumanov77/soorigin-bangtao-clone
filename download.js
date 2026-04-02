const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sooriginbangtao.com';

// Language config: code → { path on original site, SEO config }
const LANGUAGES = {
  en: {
    srcPath: '/',
    title: 'SO Origin Bang Tao Phuket — Condos For Sale from $127K | Near Bang Tao Beach',
    description: 'SO Origin Bang Tao — premium beachfront condos in Phuket near Bang Tao Beach. Prices from $127,000. Up to 7% annual ROI. Developer payment plans available.',
    keywords: 'SO Origin Bang Tao, buy condo Phuket, Bang Tao apartments, Phuket real estate, Phuket investment, beachfront condo Phuket',
    locale: 'en_US',
    schemaName: 'SO Origin Bang Tao — Condos in Phuket'
  },
  ru: {
    srcPath: '/ru/',
    title: 'SO Origin Bang Tao Пхукет — Купить квартиру от $127K | Пляж Банг Тао',
    description: 'SO Origin Bang Tao — премиальные апартаменты на Пхукете у пляжа Банг Тао. Цены от $127 000. Доходность до 7% годовых. Рассрочка от застройщика.',
    keywords: 'SO Origin Bang Tao, купить квартиру Пхукет, апартаменты Банг Тао, недвижимость Пхукет, инвестиции Пхукет',
    locale: 'ru_RU',
    schemaName: 'SO Origin Bang Tao — Квартиры на Пхукете'
  },
  th: {
    srcPath: '/th/',
    title: 'SO Origin Bang Tao ภูเก็ต — คอนโดขาย เริ่มต้น $127K | หาดบางเทา',
    description: 'SO Origin Bang Tao — คอนโดหรูริมหาดในภูเก็ตใกล้หาดบางเทา ราคาเริ่มต้น $127,000',
    keywords: 'SO Origin Bang Tao, คอนโดภูเก็ต, หาดบางเทา, อสังหาริมทรัพย์ภูเก็ต',
    locale: 'th_TH',
    schemaName: 'SO Origin Bang Tao — คอนโดในภูเก็ต'
  },
  zh: {
    srcPath: '/zh/',
    title: 'SO Origin Bang Tao 普吉岛 — 公寓出售 起价$127K | 邦涛海滩',
    description: 'SO Origin Bang Tao — 普吉岛邦涛海滩附近的高端海滨公寓。价格从$127,000起。',
    keywords: 'SO Origin Bang Tao, 普吉岛公寓, 邦涛海滩, 普吉岛房地产, 普吉岛投资',
    locale: 'zh_CN',
    schemaName: 'SO Origin Bang Tao — 普吉岛公寓'
  },
  de: {
    srcPath: '/de/',
    title: 'SO Origin Bang Tao Phuket — Eigentumswohnungen ab $127K | Bang Tao Beach',
    description: 'SO Origin Bang Tao — Premium-Eigentumswohnungen in Phuket am Bang Tao Beach. Preise ab $127.000. Bis zu 7% Rendite.',
    keywords: 'SO Origin Bang Tao, Wohnung kaufen Phuket, Bang Tao Apartments, Phuket Immobilien',
    locale: 'de_DE',
    schemaName: 'SO Origin Bang Tao — Wohnungen in Phuket'
  },
  fr: {
    srcPath: '/fr/',
    title: 'SO Origin Bang Tao Phuket — Appartements à vendre dès $127K | Plage Bang Tao',
    description: 'SO Origin Bang Tao — appartements premium à Phuket près de la plage Bang Tao. Prix à partir de $127 000. Rendement jusqu\'à 7% par an.',
    keywords: 'SO Origin Bang Tao, acheter appartement Phuket, Bang Tao, immobilier Phuket',
    locale: 'fr_FR',
    schemaName: 'SO Origin Bang Tao — Appartements à Phuket'
  },
  ar: {
    srcPath: '/ar/',
    title: 'SO Origin Bang Tao بوكيت — شقق للبيع من $127K | شاطئ بانغ تاو',
    description: 'SO Origin Bang Tao — شقق فاخرة في بوكيت بالقرب من شاطئ بانغ تاو. الأسعار من $127,000.',
    keywords: 'SO Origin Bang Tao, شقق بوكيت, شاطئ بانغ تاو, عقارات بوكيت',
    locale: 'ar_SA',
    schemaName: 'SO Origin Bang Tao — شقق في بوكيت'
  },
  ko: {
    srcPath: '/ko/',
    title: 'SO Origin Bang Tao 푸켓 — 콘도 분양 $127K부터 | 방타오 비치',
    description: 'SO Origin Bang Tao — 푸켓 방타오 비치 인근 프리미엄 콘도. 가격 $127,000부터.',
    keywords: 'SO Origin Bang Tao, 푸켓 콘도, 방타오 비치, 푸켓 부동산',
    locale: 'ko_KR',
    schemaName: 'SO Origin Bang Tao — 푸켓 콘도'
  },
  ja: {
    srcPath: '/ja/',
    title: 'SO Origin Bang Tao プーケット — コンドミニアム $127Kから | バンタオビーチ',
    description: 'SO Origin Bang Tao — プーケットのバンタオビーチ近くのプレミアムコンドミニアム。価格$127,000から。',
    keywords: 'SO Origin Bang Tao, プーケット コンドミニアム, バンタオビーチ, プーケット不動産',
    locale: 'ja_JP',
    schemaName: 'SO Origin Bang Tao — プーケットのコンドミニアム'
  },
  hi: {
    srcPath: '/hi/',
    title: 'SO Origin Bang Tao फुकेत — कॉन्डो बिक्री $127K से | बैंग ताओ बीच',
    description: 'SO Origin Bang Tao — फुकेत में बैंग ताओ बीच के पास प्रीमियम कॉन्डो। कीमत $127,000 से।',
    keywords: 'SO Origin Bang Tao, फुकेत कॉन्डो, बैंग ताओ बीच, फुकेत रियल एस्टेट',
    locale: 'hi_IN',
    schemaName: 'SO Origin Bang Tao — फुकेत में कॉन्डो'
  }
};

function injectSEO(html, lang) {
  const cfg = LANGUAGES[lang];
  let h = html;
  const baseUrl = process.env.BASE_URL || 'https://soorigin-bangtao-clone-production.up.railway.app';

  // Title
  h = h.replace(/<title>[^<]*<\/title>/i, `<title>${cfg.title}</title>`);

  // Lang attribute
  h = h.replace(/<html([^>]*)lang="[^"]*"/i, `<html$1lang="${lang}"`);
  if (!h.includes('lang=')) {
    h = h.replace(/<html/i, `<html lang="${lang}"`);
  }

  // Meta description
  if (h.match(/name=["']description["']/i)) {
    h = h.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']/i,
      `<meta name="description" content="${cfg.description}"`);
  } else {
    h = h.replace('</head>', `<meta name="description" content="${cfg.description}">\n</head>`);
  }

  // Meta keywords
  if (h.match(/name=["']keywords["']/i)) {
    h = h.replace(/<meta\s+name=["']keywords["']\s+content=["'][^"']*["']/i,
      `<meta name="keywords" content="${cfg.keywords}"`);
  } else {
    h = h.replace('</head>', `<meta name="keywords" content="${cfg.keywords}">\n</head>`);
  }

  // Remove existing hreflang links (original site has them pointing to sooriginbangtao.com)
  h = h.replace(/<link\s+rel=["']alternate["']\s+hreflang=["'][^"']*["'][^>]*>/gi, '');

  // Add new hreflang tags pointing to our clone
  let hreflangTags = '';
  for (const [code] of Object.entries(LANGUAGES)) {
    const langPath = code === 'en' ? '/' : `/${code}/`;
    hreflangTags += `<link rel="alternate" hreflang="${code}" href="${baseUrl}${langPath}" />\n`;
  }
  hreflangTags += `<link rel="alternate" hreflang="x-default" href="${baseUrl}/" />\n`;
  h = h.replace('</head>', `${hreflangTags}</head>`);

  // OG tags
  const ogReplacements = [
    ['og:title', cfg.title],
    ['og:description', cfg.description],
    ['og:locale', cfg.locale],
    ['og:type', 'website'],
    ['og:url', `${baseUrl}/${lang === 'en' ? '' : lang + '/'}`]
  ];
  for (const [prop, val] of ogReplacements) {
    const regex = new RegExp(`<meta\\s+property=["']${prop}["']\\s+content=["'][^"']*["']`, 'i');
    if (h.match(regex)) {
      h = h.replace(regex, `<meta property="${prop}" content="${val}"`);
    } else {
      h = h.replace('</head>', `<meta property="${prop}" content="${val}">\n</head>`);
    }
  }

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": cfg.schemaName,
    "description": cfg.description,
    "url": `${baseUrl}/${lang === 'en' ? '' : lang + '/'}`,
    "offers": {
      "@type": "Offer",
      "price": "127000",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bang Tao Beach",
      "addressRegion": "Phuket",
      "addressCountry": "TH"
    }
  };
  // Remove existing JSON-LD if any
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  h = h.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`);

  return h;
}

async function downloadAll() {
  console.log('Downloading all language versions of SO Origin Bang Tao...');

  for (const [lang, cfg] of Object.entries(LANGUAGES)) {
    const url = `${BASE_URL}${cfg.srcPath}`;
    console.log(`  Downloading ${lang}: ${url}`);

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        redirect: 'follow'
      });

      if (!res.ok) {
        console.error(`  Failed ${lang}: HTTP ${res.status}`);
        continue;
      }

      let html = await res.text();
      console.log(`  Downloaded ${lang}: ${html.length} bytes`);

      // Apply SEO improvements
      html = injectSEO(html, lang);

      // Save to public/<lang>/index.html
      const dir = path.join(__dirname, 'public', lang);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
      console.log(`  Saved ${lang}`);
    } catch (err) {
      console.error(`  Error downloading ${lang}:`, err.message);
    }

    // Small delay between requests to be polite
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('All language versions downloaded!');
}

downloadAll().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});
