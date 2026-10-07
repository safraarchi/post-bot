const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : '/usr/bin/google-chrome';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    await page.goto('http://localhost:3300', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('#customDaysSlider', { timeout: 5000 });

    // Set slider to 7 days
    await page.evaluate(() => {
      selectPresetDays(7);
    });

    const lightPath = path.join('C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\25a7a484-abc8-4f2a-a114-3c5adaf039cf', 'slider_control_preview.png');
    await page.screenshot({ path: lightPath, fullPage: false });
    console.log('Light mode screenshot saved:', lightPath);

    // Switch to dark mode and wait for transition (500ms)
    await page.evaluate(() => {
      toggleTheme();
    });
    await new Promise(r => setTimeout(r, 600));

    const darkPath = path.join('C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\25a7a484-abc8-4f2a-a114-3c5adaf039cf', 'slider_dark_mode_preview.png');
    await page.screenshot({ path: darkPath, fullPage: false });
    console.log('Dark mode screenshot saved:', darkPath);

  } catch (err) {
    console.error('Error during verification:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
