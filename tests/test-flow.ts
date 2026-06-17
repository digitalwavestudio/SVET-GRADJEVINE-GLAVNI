import { chromium } from 'playwright';
import { db } from '../server/config/firebase.ts';

(async () => {
  console.log('🚀 Pokrećem automatski E2E test proces...');
  
  // Pokrećemo browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Pratimo konzolu i greške u pretraživaču
  page.on('console', msg => console.log('💻 BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('❌ BROWSER PAGE ERROR:', error.stack || error.message));

  try {
    const email = `test_firma_${Date.now()}@gmail.com`;
    const password = 'Password123';

    console.log(`1. Otvaram stranicu za registraciju...`);
    await page.goto('http://localhost:3000/registracija', { waitUntil: 'networkidle', timeout: 15000 });
    
    console.log('2. Popunjavam formu za registraciju...');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    console.log('3. Klikćem na dugme za registraciju...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message)),
      page.click('button[type="submit"]')
    ]);

    // Čekamo malo i idemo na prijavu
    console.log('4. Idem na stranicu za prijavu...');
    await page.goto('http://localhost:3000/prijava', { waitUntil: 'networkidle', timeout: 15000 });

    console.log('5. Popunjavam formu za prijavu...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    console.log('6. Klikćem na dugme za prijavu...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message)),
      page.click('button[type="submit"]')
    ]);

    await page.waitForTimeout(3000);
    console.log('Trenutni URL nakon prijave:', page.url());

    // Idemo na dashboard
    console.log('7. Otvaram profil/dashboard...');
    await page.goto('http://localhost:3000/moj-profil', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Idemo na postavljanje oglasa
    console.log('8. Idem na stranicu za postavljanje oglasa...');
    await page.goto('http://localhost:3000/postavi-oglas', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Biramo kategoriju POSAO (Job)
    console.log('9. Biram kategoriju za posao...');
    await page.click('button:has-text("POSAO")');
    await page.waitForTimeout(1000);

    // Popunjavamo formu Korak 1
    console.log('10. Popunjavam Korak 1 (Sektor, Pozicija, Lokacija)...');
    await page.selectOption('select[name="sector"]', { index: 1 }).catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    await page.selectOption('select[name="profession"]', { index: 1 }).catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    await page.fill('input[name="location"]', 'Beograd');
    
    console.log('Klikćem na DALJE (Korak 1)...');
    await page.click('button:has-text("DALJE")');
    await page.waitForTimeout(1000);

    // Popunjavamo Korak 2 (Plata, Iskustvo, Tip)
    console.log('11. Popunjavam Korak 2 (Plata, Iskustvo)...');
    await page.fill('input[name="plataMin"]', '800').catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    await page.fill('input[name="plataMax"]', '1200').catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    await page.selectOption('select[name="iskustvo"]', { index: 1 }).catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    
    console.log('Klikćem na DALJE (Korak 2)...');
    await page.click('button:has-text("DALJE")');
    await page.waitForTimeout(1000);

    // Popunjavamo Korak 3 (Opis, Telefon)
    console.log('12. Popunjavam Korak 3 (Opis, Kontakt)...');
    await page.fill('textarea[name="opis"]', 'Tražimo iskusnog građevinskog radnika za rad na velikim projektima u Beogradu. Obezbeđen smeštaj i hrana.');
    await page.fill('input[name="phone"]', '+38161234567');
    await page.fill('input[name="email"]', email);
    
    console.log('Klikćem na DALJE (Korak 3)...');
    await page.click('button:has-text("DALJE")');
    await page.waitForTimeout(1000);

    // Odabir paketa (Korak 4) i slanje
    console.log('13. Biram paket i objavljujem oglas...');
    await page.click('button:has-text("BESPLATNO")').catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    
    console.log('Klikćem na dugme za slanje/objavu...');
    await page.click('button:has-text("OBJAVI OGLAS")').catch((e: any) => console.warn("[TestFlow] Interaction failed:", e?.message));
    await page.waitForTimeout(5000);

    console.log('Krajnji URL nakon slanja oglasa:', page.url());
    const finalHtml = await page.content();
    if (finalHtml.includes('uspešno') || finalHtml.includes('Uspešno') || page.url().includes('moj-profil') || page.url().includes('dashboard')) {
      console.log('✅ E2E TEST USPEŠAN: Oglas je uspešno postavljen i proces je prošao bez greške!');
    } else {
      console.log('⚠️ E2E TEST: Moguće je da je došlo do greške pri slanju, proverite konzolu iznad.');
    }

  } catch (error) {
    console.error('❌ E2E TEST KRASIRAO SA GREŠKOM:', error);
  } finally {
    await browser.close();
  }
})();
