const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function cropAndSave(sourceRelativePath, cropConfig, outputFilename) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

  const yusufDir = path.resolve(__dirname, '..', '..');
  const absSource = path.isAbsolute(sourceRelativePath) 
    ? sourceRelativePath 
    : path.resolve(yusufDir, sourceRelativePath);
  const fileData = fs.readFileSync(absSource);
  const base64Data = fileData.toString('base64');
  const mime = absSource.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUri = `data:${mime};base64,${base64Data}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      background: #000;
      position: relative;
    }
    .bg {
      position: absolute;
      width: ${cropConfig.width || '100%'};
      height: ${cropConfig.height || '100%'};
      left: ${cropConfig.left || '0px'};
      top: ${cropConfig.top || '0px'};
      object-fit: ${cropConfig.objectFit || 'cover'};
      object-position: ${cropConfig.objectPosition || 'center'};
      transform: scale(${cropConfig.scale || 1});
      transform-origin: ${cropConfig.transformOrigin || 'center'};
    }
  </style>
</head>
<body>
  <img class="bg" src="${dataUri}" />
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'load' });
  const outPath = path.resolve(__dirname, '..', 'public', 'images', outputFilename);
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 95 });
  await browser.close();
  console.log(`✅ Berhasil membuat background: ${outputFilename}`);
}

async function main() {
  // 1. Daun & Pelepah Sawit (Fokus ke tajuk hijau pelepah kelapa sawit dari sampul)
  await cropAndSave('pupuk baru/desain/sampul.jpg', {
    width: '180%',
    height: '180%',
    left: '-20%',
    top: '-15%',
    objectFit: 'cover',
    objectPosition: 'top center'
  }, 'daun_sawit_pelepah.jpg');

  // 2. Tanah Piringan & Perakaran (Fokus ke piringan sawit dan tanah bersih melingkar)
  await cropAndSave('public/images/sawit_subur_emas.jpg', {
    width: '160%',
    height: '160%',
    left: '-30%',
    top: '-35%',
    objectFit: 'cover',
    objectPosition: 'bottom center'
  }, 'tanah_piringan_kebun.jpg');

  console.log('🎉 Semua background kelapa sawit autentik selesai dipersiapkan!');
}

main().catch(console.error);
