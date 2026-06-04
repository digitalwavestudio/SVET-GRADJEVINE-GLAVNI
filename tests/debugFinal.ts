import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER PAGE ERROR:', error.stack || error.message));
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const rootHtml = await page.$eval('#root', el => el.innerHTML).catch(() => 'no root');
  console.log('Root HTML:', rootHtml);
  
  await browser.close();
})();
