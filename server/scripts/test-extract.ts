import { PROFESSIONS } from '../../src/constants/taxonomy';

const normal = (s: string) => s.toLowerCase().replace(/š/g, 's').replace(/đ/g, 'dj').replace(/č/g, 'c').replace(/ć/g, 'c').replace(/ž/g, 'z');

const PROFESSION_KEYWORDS: Record<string, { id: string; sector: string }> = {
  'hidroizolacija': { id: 'hidroizolater', sector: 'zavrsni-radovi' },
  'termoizolacija': { id: 'izolater', sector: 'zavrsni-radovi' },
};

// OLD fallback (no after check)
function extractProfessionOld(text: string): { id: string; sector: string } | null {
  if (!text) return null;
  const normalized = normal(text);
  for (const [sector, items] of Object.entries(PROFESSIONS)) {
    for (const item of items) {
      for (const name of [item.name, item.shortName]) {
        if (!name) continue;
        const n = normal(name);
        if (n.length < 3) continue;
        const variants = [n, n + 'a', n + 'u', n + 'e', n + 'i', n + 'om'];
        for (const v of variants) {
          const idx = normalized.indexOf(v);
          if (idx === -1) continue;
          const before = normalized[idx - 1] || ' ';
          const after = normalized[idx + v.length] || ' ';
          if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
            console.log('  OLD variant:', item.id, JSON.stringify(v));
            return { id: item.id, sector };
          }
        }
      }
      for (const name of [item.name, item.shortName]) {
        if (!name) continue;
        const n = normal(name);
        if (n.length < 8) continue;
        for (let start = 0; start <= n.length - 6; start++) {
          const sub = n.substring(start, start + 6);
          if (sub.length < 6) continue;
          const idx = normalized.indexOf(sub);
          if (idx === -1) continue;
          const before = normalized[idx - 1] || ' ';
          // OLD: no after check
          if (!/[a-z0-9]/.test(before)) {
            console.log('  OLD fallback:', item.id, JSON.stringify(sub), 'at', idx, 'before:', JSON.stringify(before));
            return { id: item.id, sector };
          }
        }
      }
    }
  }
  return null;
}

const text = 'bravar\n\nMesto rada: Beograd (Dobanovci)\nSatnica: 800 RSD NETO\nIsplata: 05. u mesecu\nRadno vreme: 06-14h , 14-22h, subota 06-14h\n\nSmeštaj: ?\nPrevoz: ?\nHrana: ?\n\nBenefiti: prijava\nRad u radionici sa HEA profilima, radi se sa gotovim komadima, heftanje po crtežu.';
console.log('=== OLD code (bez after check) ===');
const old = extractProfessionOld(text);
console.log('  OLD RESULT:', old);

// Also list ALL matches from OLD fallback (without returning early)
console.log('\n=== ALL fallback matches (old) ===');
const norm = normal(text);
for (const [sector, items] of Object.entries(PROFESSIONS)) {
  for (const item of items) {
    for (const name of [item.name, item.shortName]) {
      if (!name) continue;
      const n = normal(name);
      if (n.length < 8) continue;
      for (let start = 0; start <= n.length - 6; start++) {
        const sub = n.substring(start, start + 6);
        if (sub.length < 6) continue;
        const idx = norm.indexOf(sub);
        if (idx === -1) continue;
        const before = norm[idx - 1] || ' ';
        if (!/[a-z0-9]/.test(before)) {
          const after = norm[idx + sub.length] || ' ';
          console.log(`  ${item.id}: sub=${JSON.stringify(sub)} at=${idx} before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
        }
      }
    }
  }
}
