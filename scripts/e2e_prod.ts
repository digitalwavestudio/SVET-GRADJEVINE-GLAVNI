import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(path.resolve(__dirname, '../firebase-service-account.json'), 'utf8'));
const app = admin.initializeApp({ credential: admin.credential.cert(sa) });

const DB_ID = 'ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8';
const USER_EMAIL = 'mancoresolution@gmail.com';
const UID = 'kC97lodzPHdmsUGv4FQP0yj1rkw2';
const BASE = 'https://svetgradjevine.com';
const TAG = `E2E_${Date.now()}`;
const AD_TITLE = `E2E Test Oglas ${TAG}`;
const db = getFirestore(app, DB_ID);

let adId = '';
let ssDir = '';

async function setupUser() {
  console.log('── Setup ──');
  await db.collection('users').doc(UID).set({
    role: 'poslodavac', email: USER_EMAIL, name: 'Test Korisnik',
    status: 'active', walletBalance: 5000, isVerified: true,
    permissions: ['ads:read', 'ads:create', 'ads:edit', 'user:edit'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await admin.auth().setCustomUserClaims(UID, { role: 'poslodavac', permissions: ['ads:read', 'ads:create', 'ads:edit', 'user:edit'] });
  console.log('✓ User ready (poslodavac, wallet=5000)');
}

  async function cleanup() {
  console.log('\n── Cleanup ──');
  if (adId) { try { await db.collection('listings').doc(adId).delete(); console.log('✓ Ad deleted'); } catch {} }
  try {
    const snap = await db.collection('listings').where('authorId', '==', UID).get();
    const testAds = snap.docs.filter(d => (d.data().title||'').startsWith('E2E') || (d.data().opis||'').startsWith('E2E'));
    if (testAds.length) {
      const b = db.batch(); testAds.forEach(d => b.delete(d.ref)); await b.commit();
      console.log(`✓ Cleaned ${testAds.length} test ads`);
    } else { console.log('  No test ads'); }
  } catch (e: any) { console.log(`  Cleanup: ${e.message}`); }
}

async function run() {
  ssDir = path.resolve(__dirname, `../e2e-${TAG}`);
  mkdirSync(ssDir, { recursive: true });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  FULL E2E TEST  ${TAG}`);
  console.log(`${'='.repeat(60)}\n`);

  await setupUser();
  const token = await admin.auth().createCustomToken(UID, { role: 'poslodavac', permissions: ['ads:read', 'ads:create', 'ads:edit', 'user:edit'] });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  let allOk = true;
  let mutationError = '';
  const page = await ctx.newPage();

  page.on('console', msg => {
    const t = msg.text();
    if (t.includes('Global Mutation Error') || t.includes('ApiError')) {
      mutationError = t.substring(0, 250);
      console.log(`\n  [MUTATION_ERR] ${mutationError}`);
    } else if (msg.type() === 'error' && !t.includes('Failed to load') && !t.includes('401') && !t.includes('429')) {
      console.log(`\n  [CONSOLE_${msg.type()}] ${t.substring(0, 120)}`);
    }
  });

  async function ss(name: string) {
    try { await page.screenshot({ path: path.join(ssDir, `${name}.png`) }); } catch {}
  }

  async function step(name: string, fn: () => Promise<void>) {
    mutationError = '';
    process.stdout.write(`\n▶ ${name}... `);
    try { await fn(); console.log(`✓`); }
    catch (e: any) {
      const errMsg = e.message;
      console.log(`✗ ${errMsg}`);
      if (mutationError && !errMsg.includes(mutationError)) console.log(`  Last mutation error: ${mutationError}`);
      allOk = false;
    }
    await ss(name.replace(/[^a-z0-9]/gi, '_').substring(0, 55));
  }

  async function cookie() {
    try {
      const b = page.locator('button:has-text("Prihvatam")');
      if (await b.isVisible({ timeout: 1000 }).catch(() => false)) { await b.click(); await page.waitForTimeout(500); }
    } catch {}
  }

  // ====== 1. LOGIN ======
  console.log(`── 1. LOGIN ──`);
  await step('Login by bypassToken', async () => {
    await page.goto(`${BASE}/prijava?bypassToken=${token}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(8000);
    if (page.url().includes('/prijava')) throw new Error('Login failed');
    await cookie();
  });

  // ====== 2. DASHBOARD ======
  console.log(`── 2. DASHBOARD ──`);
  await step('Dashboard loads', async () => {
    await page.goto(`${BASE}/kontrolna-tabla`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);
    await cookie();
    if (page.url().includes('/prijava')) throw new Error('Redirected');
  });

  // ====== 3. POST AD ======
  console.log(`── 3. POST AD ──`);

  await step('Open /postavi-oglas', async () => {
    await page.goto(`${BASE}/postavi-oglas`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4000);
    await cookie();
    if (page.url().includes('/prijava')) throw new Error('Redirected');
  });

  await step('Select POSAO category', async () => {
    await page.waitForTimeout(2000);
    const h3s = page.locator('h3');
    const n = await h3s.count();
    for (let i = 0; i < n; i++) {
      const t = ((await h3s.nth(i).textContent()) || '').toLowerCase();
      if (t.includes('posao')) { await h3s.nth(i).click(); await page.waitForTimeout(2000); return; }
    }
    throw new Error('Job category not found');
  });

  // Dynamic step filler (works for steps 1-3)
  async function fillAndAdvance() {
    await cookie();
    await page.waitForTimeout(1500);

    // Fill all visible inputs/selects
    const inputs = await page.locator('input, select').all();
    for (const el of inputs) {
      const name = await el.getAttribute('name').catch(() => '');
      const type = await el.getAttribute('type').catch(() => '');
      if (!name || type === 'hidden' || type === 'radio') continue;
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      if (tag === 'select') {
        const opts = await el.locator('option').all();
        if (opts.length > 1) await el.selectOption({ index: opts.length > 2 ? 1 : opts.length - 1 }).catch(() => {});
      } else if (name === 'location' || name === 'tacnaLokacija') {
        await el.fill('Beograd').catch(() => {});
      } else if (['plataMin', 'plataMax', 'price', 'machPrice', 'plotPrice', 'marketValue'].includes(name)) {
        await el.fill('500').catch(() => {});
      } else if (name.includes('email')) {
        await el.fill(USER_EMAIL).catch(() => {});
      } else if (['phone', 'kontaktTelefon', 'viber', 'whatsapp'].includes(name)) {
        await el.fill('+38161123456').catch(() => {});
      } else if (name === 'title') {
        await el.fill(AD_TITLE).catch(() => {});
      }
    }
    // Textarea
    const ta = page.locator('textarea').first();
    if (await ta.isVisible({ timeout: 300 }).catch(() => false)) {
      await ta.fill(`${AD_TITLE}. Potreban iskusan radnik za građevinske radove u Beogradu.`).catch(() => {});
    }

    // Check step indicator
    const activeStepEl = page.locator('span.text-secondary').first();
    const stepText = await activeStepEl.textContent().catch(() => '');
    console.log(`\n  Step indicator: "${stepText}"`);

    // Click Nastavi (not the submit button)
    const nextBtn = page.locator('button:not([type="submit"]):has-text("Nastavi"), button:not([type="submit"]):has-text("Dalje")').first();
    if (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      const t = await nextBtn.textContent();
      await nextBtn.click();
      await page.waitForTimeout(2000);
      console.log(`  Clicked "${t}"`);
    } else {
      // Check for submit button
      const sub = page.locator('button[type="submit"]');
      if (await sub.isVisible({ timeout: 500 }).catch(() => false)) {
        const st = await sub.textContent();
        console.log(`  Already on submit step ("${st}")`);
      } else {
        console.log(`  No navigation button found`);
      }
    }
  }

  await step('Fill step 1', async () => { await fillAndAdvance(); });
  await step('Fill step 2', async () => { await fillAndAdvance(); });
  await step('Fill step 3', async () => { await fillAndAdvance(); });

  // Step 4: Submit
  await step('Select package & submit', async () => {
    await cookie();
    await page.waitForTimeout(2000);

    // Select STANDARD package
    const stdLabel = page.locator('label:has-text("STANDARD")').first();
    if (await stdLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stdLabel.click();
      await page.waitForTimeout(1000);
      console.log(`\n  Selected STANDARD`);
    } else {
      console.log(`\n  No STANDARD label found`);
    }

    const submitBtn = page.locator('button[type="submit"]');
    if (!await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      throw new Error('Submit button not found');
    }

    const btnBefore = await submitBtn.textContent();
    console.log(`  Button: "${btnBefore}"`);
    if (btnBefore !== 'Objavite oglas') {
      if (btnBefore?.includes('Izaberite')) { console.log(`  ⚠ No package selected`); }
      else if (btnBefore?.includes('Nedovoljno')) { console.log(`  ⚠ Insufficient funds`); }
      throw new Error(`Button state: ${btnBefore}`);
    }

    await submitBtn.click();
    await page.waitForTimeout(3000);

    const btnAfter = await submitBtn.textContent();
    console.log(`  After 3s: "${btnAfter}"`);

    if (btnAfter === 'SLANJE...' || btnAfter?.includes('SLANJE')) {
      console.log('  ✓ Submit started, waiting...');
      // Wait for mutation to finish (button should change back or page should update)
      try {
        await page.waitForFunction(() => {
          const btn = document.querySelector('button[type="submit"]');
          return !btn || btn.textContent?.includes('Objavite') || btn.textContent?.includes('Nedovoljno') || btn.textContent?.includes('Izaberite');
        }, { timeout: 25000 });
        const finalBtnText = await submitBtn.textContent().catch(() => 'BUTTON_GONE');
        console.log(`  Button settled: "${finalBtnText}"`);
        console.log(`  URL: ${page.url()}`);
      } catch {
        // Button might have disappeared entirely (page changed)
        console.log(`  Button disappeared - page may have changed`);
      }
      console.log(`  Final URL: ${page.url()}`);
      console.log(`  Page title: ${await page.title().catch(() => 'N/A')}`);
      const body = (await page.textContent('body') || '').substring(0, 500);
      console.log(`  Body: ${body.replace(/\n/g, ' ').substring(0, 300)}`);

      if (body.includes('uspešno') || body.includes('Uspešno') || body.includes('Success')) {
        console.log('  ✓ Success state detected');
      } else if (mutationError) {
        console.log(`  Mutation error present: ${mutationError}`);
        throw new Error(`Submit failed: ${mutationError}`);
      } else if (body.includes('nedovoljno') || body.includes('greška') || body.includes('Error')) {
        console.log('  ⚠ Error state detected');
      }
    } else if (btnAfter === 'Objavite oglas') {
      // Check for error messages
      const body = (await page.textContent('body') || '').substring(0, 1000);
      console.log(`  Body: ${body.substring(100, 400)}`);
      if (mutationError) throw new Error(`Submit error: ${mutationError}`);
      // If no mutation error, maybe validation prevented submission
      throw new Error('Submit returned to original state');
    } else {
      console.log(`  Unknown state: ${btnAfter}`);
      if (mutationError) console.log(`  Error: ${mutationError}`);
    }
  });

  // ====== 4. VERIFY ======
  console.log(`\n── 4. VERIFY ──`);

  await step('Find ad in Firestore', async () => {
    const snap = await db.collection('listings').where('authorId', '==', UID).get();
    const e2e = snap.docs.filter(d => (d.data().title||'').startsWith('E2E') || (d.data().opis||'').startsWith('E2E'));
    if (e2e.length > 0) {
      adId = e2e[0].id;
      console.log(`\n  ✓ Ad: ${adId} - "${e2e[0].data().title}"`);
    } else {
      console.log(`\n  ⚠ No E2E ads found (${snap.docs.length} total for user)`);
      throw new Error('Ad not created');
    }
  });

  await step('My Ads page', async () => {
    await page.goto(`${BASE}/moj-profil/oglasi`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);
    await cookie();
    if (page.url().includes('/prijava')) throw new Error('Redirected');
    const body = await page.textContent('body') || '';
    console.log(`\n  ${body.includes(TAG) ? '✓ Found' : '⚠ Not found by text'}`);
  });

  await step('Admin moderation tab', async () => {
    await page.goto(`${BASE}/admin?tab=moderation`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);
    await cookie();
    const body = await page.textContent('body') || '';
    console.log(`\n  ${body.includes(TAG) ? '✓ Found in moderation' : '⚠ Not found'}`);
  });

  await step('Admin overview tab', async () => {
    await page.goto(`${BASE}/admin?tab=overview`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4000);
    await cookie();
  });

  await step('Jobs page', async () => {
    await page.goto(`${BASE}/poslovi`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(5000);
    const body = await page.textContent('body') || '';
    console.log(`\n  Page: ${body.length} chars`);
  });

  await step('Homepage', async () => {
    await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4000);
  });

  // ====== 5. API ======
  console.log(`\n── 5. API HEALTH ──`);
  await step('Health', async () => {
    const h = await (await page.request.get(`${BASE}/api/health`)).json();
    console.log(`\n  ${JSON.stringify(h)}`);
    const l = await (await page.request.get(`${BASE}/api/system/liveness`)).text();
    console.log(`  Liveness: ${l}`);
  });

  await cleanup();
  await browser.close();

  console.log(`\n${'='.repeat(60)}`);
  if (allOk) console.log(`  ✅ ALL PASSED`);
  else console.log(`  ⚠️ SOME FAILED`);
  console.log(`  Ad: ${adId || 'N/A'}`);
  console.log(`  Screenshots: ${ssDir}`);
  console.log(`${'='.repeat(60)}\n`);
  process.exit(allOk ? 0 : 1);
}

run();
