const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function crop(srcPath, imgStyle, outPath) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });

  const fileData = fs.readFileSync(srcPath);
  const dataUri = `data:image/jpeg;base64,${fileData.toString('base64')}`;

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;width:1080px;height:1080px;overflow:hidden;background:#000;position:relative;">
  <img src="${dataUri}" style="${imgStyle}" />
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 95 });
  await browser.close();
  console.log('Saved:', path.basename(outPath));
}

async function run() {
  const emasPath = path.join(__dirname, '..', 'public', 'images', 'sawit_subur_emas.jpg');
  
  // 1. Daun & Pelepah (Fokus tajuk hijau pelepah kelapa sawit atas)
  await crop(emasPath, 'position:absolute; width:1900px; height:auto; top:0; left:-410px;', path.join(__dirname, '..', 'public', 'images', 'daun_sawit_pelepah.jpg'));
  
  // 2. Tanah Piringan (Fokus detail piringan tanah melingkar perakaran bawah)
  await crop(emasPath, 'position:absolute; width:2200px; height:auto; bottom:-50px; left:-560px;', path.join(__dirname, '..', 'public', 'images', 'tanah_piringan_kebun.jpg'));

  console.log('Done cropping specialized distinct palm assets!');
}

run().catch(console.error);
