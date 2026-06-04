import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const pending = new Set<string>();
  
  page.on('request', r => { pending.add(r.url()); });
  page.on('response', r => { pending.delete(r.url()); });
  page.on('requestfailed', r => { pending.delete(r.url()); });
  page.on('requestfinished', r => { pending.delete(r.url()); });
  
  await page.goto('http://localhost:3000', { waitUntil: 'commit', timeout: 5000 }).catch(()=>{});
    await page.waitForTimeout(10000);
  
  console.log('Pending requests:', Array.from(pending));
  await browser.close();
})();
