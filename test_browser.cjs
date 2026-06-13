const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => {
        console.error('PAGE ERROR CAUGHT:', err.message);
        console.error('STACK:', err.stack);
    });

    try {
        await page.goto('https://www.svetgradjevine.com', { waitUntil: 'networkidle0' });
        console.log('Page loaded successfully without uncaught errors (if none shown above).');
    } catch (e) {
        console.error('Navigation failed or timeout:', e);
    }
    
    await browser.close();
})();
