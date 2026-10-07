const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : '/usr/bin/google-chrome';

/**
 * Render kartu berita 1080x1080 berstandar grafis media nasional
 * Menggunakan Chromium Headless lokal (100% konsisten dengan Plus Jakarta Sans 900)
 */
async function renderNewsCard({ bgImagePath, categoryLabel, categoryColor, headlineHtml, summaryText, outputPath, brandName = 'Informasi Resmi' }) {
  if (!fs.existsSync(bgImagePath)) {
    throw new Error(`Background image tidak ditemukan: ${bgImagePath}`);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

    // Load background image as base64
    const imgBuf = fs.readFileSync(bgImagePath);
    const base64Img = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;

    // Tentukan warna badge
    let badgeColorHex = '#dc2626'; // Default Merah
    if (categoryColor === 'blue') badgeColorHex = '#2563eb';
    if (categoryColor === 'green') badgeColorHex = '#059669';
    if (categoryColor === 'orange') badgeColorHex = '#d97706';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      background-color: #0b0f19;
    }
    .background-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.3) 0%,
        rgba(0, 0, 0, 0.05) 35%,
        rgba(0, 0, 0, 0.75) 65%,
        rgba(0, 0, 0, 0.96) 100%
      );
    }
    
    /* Top Bar */
    .top-bar {
      position: absolute;
      top: 48px;
      left: 56px;
      right: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .badge-category {
      background: ${badgeColorHex};
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    .source-tag {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      padding: 10px 22px;
      border-radius: 999px;
      font-size: 17px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .source-dot {
      width: 11px;
      height: 11px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 10px #22c55e;
    }

    /* Bottom Headline Content */
    .content-box {
      position: absolute;
      bottom: 56px;
      left: 56px;
      right: 56px;
      z-index: 10;
    }
    .headline-hook {
      color: #ffffff;
      font-size: 46px;
      line-height: 1.25;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-bottom: 20px;
      text-shadow: 0 3px 14px rgba(0, 0, 0, 0.9);
    }
    .headline-highlight {
      color: #facc15; /* Kuning terang cerah */
    }
    .summary-text {
      color: #e2e8f0;
      font-size: 24px;
      font-weight: 600;
      line-height: 1.4;
      border-left: 5px solid #22c55e;
      padding-left: 18px;
      background: rgba(0, 0, 0, 0.45);
      padding-top: 8px;
      padding-bottom: 8px;
      border-radius: 0 8px 8px 0;
    }
  </style>
</head>
<body>
  <img class="background-img" src="${base64Img}" alt="Sawit Background">
  <div class="overlay"></div>

  <div class="top-bar">
    <div class="badge-category">${categoryLabel}</div>
    <div class="source-tag">
      <div class="source-dot"></div>
      <span>${brandName}</span>
    </div>
  </div>

  <div class="content-box">
    <h1 class="headline-hook">${headlineHtml}</h1>
    <div class="summary-text">${summaryText}</div>
  </div>
</body>
</html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
    return outputPath;
  } finally {
    await browser.close();
  }
}

/**
 * Render kartu promo resmi 1080x1080 menggunakan foto produk fisik asli (100% tanpa distorsi AI)
 */
async function renderPromoCard({
  headlineHtml,
  summaryText,
  outputPath,
  productImgPath,
  bgImgPath,
  badgePromo = 'PAKET KOMBO RESMI',
  badgeCod = '🚚 100% BISA COD',
  strikePrice = 'Rp 550.000',
  mainPrice = 'Rp 395.000,-',
  priceSub = 'Cukup untuk Perawatan Kebun',
  pill1 = '🛒 SOP Drum 200L + Botol 1.5L',
  pill2 = '📦 Bayar Aman di Tempat ke Kurir'
}) {
  const finalProductImg = productImgPath && fs.existsSync(productImgPath)
    ? productImgPath
    : path.join(__dirname, '..', 'public', 'images', 'promo', 'produk_transparan.webp');
  const finalBgImg = bgImgPath && fs.existsSync(bgImgPath)
    ? bgImgPath
    : path.join(__dirname, '..', 'public', 'images', 'backgrounds', 'sawit_subur_emas.jpg');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

    const bgBase64 = fs.existsSync(finalBgImg)
      ? `data:image/jpeg;base64,${fs.readFileSync(finalBgImg).toString('base64')}`
      : '';
    
    let prodBase64 = '';
    if (fs.existsSync(finalProductImg)) {
      const ext = path.extname(finalProductImg).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
      prodBase64 = `data:${mime};base64,${fs.readFileSync(finalProductImg).toString('base64')}`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      position: relative;
      background: #064e3b;
    }
    .background-img {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover;
      filter: brightness(0.35) saturate(1.2);
    }
    .top-bar {
      position: absolute;
      top: 40px; left: 48px; right: 48px;
      display: flex; justify-content: space-between; align-items: center;
      z-index: 10;
    }
    .badge-promo {
      background: #059669;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 999px;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(5, 150, 105, 0.4);
    }
    .badge-cod {
      background: #f59e0b;
      color: #0f172a;
      padding: 10px 24px;
      border-radius: 999px;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .hero-title {
      position: absolute;
      top: 110px; left: 48px; right: 48px;
      text-align: center;
      z-index: 10;
    }
    .hero-title h1 {
      color: #ffffff;
      font-size: 42px;
      font-weight: 900;
      line-height: 1.25;
      text-shadow: 0 4px 16px rgba(0,0,0,0.8);
    }
    .hero-title .highlight {
      color: #facc15;
    }
    .product-stage {
      position: absolute;
      top: 250px; left: 0; right: 0;
      height: 480px;
      display: flex; justify-content: center; align-items: center;
      z-index: 5;
    }
    .product-img {
      max-height: 460px;
      object-fit: contain;
      filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8));
    }
    .bottom-box {
      position: absolute;
      bottom: 40px; left: 48px; right: 48px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 22px 28px;
      z-index: 10;
      display: flex; justify-content: space-between; align-items: center;
    }
    .price-block {
      display: flex; flex-direction: column;
    }
    .strike-price {
      font-size: 16px; color: #94a3b8; text-decoration: line-through; font-weight: 700;
    }
    .main-price {
      font-size: 34px; color: #34d399; font-weight: 900; line-height: 1.1;
    }
    .price-sub {
      font-size: 13px; color: #cbd5e1; font-weight: 600;
    }
    .cta-pills {
      display: flex; flex-direction: column; gap: 8px; text-align: right;
    }
    .pill {
      font-size: 15px; font-weight: 800; color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
      padding: 6px 16px; border-radius: 8px;
    }
  </style>
</head>
<body>
  ${bgBase64 ? `<img class="background-img" src="${bgBase64}" alt="Background">` : ''}
  
  <div class="top-bar">
    <div class="badge-promo">${badgePromo}</div>
    <div class="badge-cod">${badgeCod}</div>
  </div>

  <div class="hero-title">
    <h1>${headlineHtml}</h1>
  </div>

  <div class="product-stage">
    ${prodBase64 ? `<img class="product-img" src="${prodBase64}" alt="Produk Fisik">` : ''}
  </div>

  <div class="bottom-box">
    <div class="price-block">
      <span class="strike-price">${strikePrice}</span>
      <span class="main-price">${mainPrice}</span>
      <span class="price-sub">${priceSub}</span>
    </div>
    <div class="cta-pills">
      <div class="pill">${pill1}</div>
      <div class="pill" style="background: #059669;">${pill2}</div>
    </div>
  </div>
</body>
</html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
    return outputPath;
  } finally {
    await browser.close();
  }
}

module.exports = { renderNewsCard, renderPromoCard };

