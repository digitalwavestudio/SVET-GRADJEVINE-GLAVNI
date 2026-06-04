import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER PAGE ERROR:', error.message));
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'commit', timeout: 10000 });
    await page.waitForTimeout(15000);
  } catch (e) {
    console.log('Timeout, but fetching whatever we have');
  }
  
  const content = await page.content();
  console.log('--- HTML CONTENT ---');
  console.log(content.substring(0, 10000));
  
  await browser.close();
})();
