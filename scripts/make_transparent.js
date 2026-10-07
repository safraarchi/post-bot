const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const inputPath = path.join(__dirname, '..', 'public', 'images', 'promo', 'paket_fertipro.png');
const outputPath = path.join(__dirname, '..', 'public', 'images', 'promo', 'paket_fertipro_transparan.png');

async function removeBackground() {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const b64 = fs.readFileSync(inputPath).toString('base64');
    
    const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        const img = new Image();
        img.onload = () => {
          const canvas = document.getElementById('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Flood-fill or edge-aware threshold to remove outer white background
          // First pass: replace near-white pixels (R>242, G>242, B>242) with alpha
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Transparan
            }
          }

          ctx.putImageData(imgData, 0, 0);
          window.resultDataUrl = canvas.toDataURL('image/png');
        };
        img.src = 'data:image/png;base64,${b64}';
      </script>
    </body>
    </html>
    `;

    await page.setContent(html);
    await page.waitForFunction('window.resultDataUrl');
    const resultUrl = await page.evaluate('window.resultDataUrl');
    const base64Clean = resultUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(outputPath, base64Clean, 'base64');
    console.log('Saved transparent image to:', outputPath);
  } finally {
    await browser.close();
  }
}

removeBackground().catch(console.error);
