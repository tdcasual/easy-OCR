const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Light mode
  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tmp/easy-ocr-console-light.png', fullPage: false });

  // Dark mode via theme toggle
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp/easy-ocr-console-dark.png', fullPage: false });

  // English locale via language toggle
  await page.click('[data-testid="language-toggle"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp/easy-ocr-console-en.png', fullPage: false });

  console.log('screenshots saved to tmp/');
  await browser.close();
})();
