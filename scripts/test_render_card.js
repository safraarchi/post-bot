const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function renderNewsCard({ bgImagePath, category, headline, summary, outputPath }) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

  // Convert local image to base64 so it loads instantly without file:// security restrictions
  const imgBuf = fs.readFileSync(bgImagePath);
  const base64Img = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;

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
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
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
      background: #dc2626;
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.45);
    }
    .badge-category.blue { background: #2563eb; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.45); }
    .badge-category.green { background: #059669; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.45); }
    .badge-category.orange { background: #d97706; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.45); }

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
      color: #facc15;
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
    <div class="badge-category ${category.colorClass || ''}">${category.label}</div>
    <div class="source-tag">
      <div class="source-dot"></div>
      <span>Solusi Sawit Nusantara</span>
    </div>
  </div>

  <div class="content-box">
    <h1 class="headline-hook">${headline}</h1>
    <div class="summary-text">${summary}</div>
  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
  await browser.close();

  console.log(`✅ Kartu Berita berhasil dirender sempurna ke: ${outputPath}`);
  return outputPath;
}

// Test Render
const testBg = path.join(__dirname, '..', 'public', 'images', 'buah_sawit_jumbo.jpg');
const testOut = path.join(__dirname, '..', 'public', 'images', 'puppeteer_test_card.jpg');

renderNewsCard({
  bgImagePath: testBg,
  category: { label: 'RISET SAWIT', colorClass: 'blue' },
  headline: '50% Pupuk Kimia Tabur <span class="headline-highlight">Sering Terbuang Percuma!</span>',
  summary: 'Fakta lapangan: pupuk menguap saat terik dan membatu di tanah masam.',
  outputPath: testOut
}).catch(console.error);
