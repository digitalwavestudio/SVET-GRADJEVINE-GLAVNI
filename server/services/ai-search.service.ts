import { GoogleGenAI } from "@google/genai";
import { db } from "../config/firebase.ts";

interface AiSearchResult {
  url: string | null;
  keywords: string[];
}

interface AiAskResult {
  answer: string;
  count: number;
  error?: string;
  page: number;
  pageSize: number;
  totalPages: number;
  listings?: Array<{
    id: string;
    title: string;
    location: string;
    salary: string;
    company: string;
    description: string;
    isPremium: boolean;
    isUrgent: boolean;
    createdAt: string;
  }>;
}

async function callGemini(prompt: string) {
  const client = new GoogleGenAI({
    vertexai: true,
    project: "svet-gradjevine-eu",
    location: "us-central1",
  });
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.0, maxOutputTokens: 1000 },
  });
  return response.text || null;
}

function cleanJson(text: string) {
  return text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
}

export async function parseSearchQuery(query: string): Promise<AiSearchResult> {
  try {
    const prompt = `Upit: "${query}"

Kojoj stranici sajta pripada? Stranice: /poslovi, /masine, /placevi, /smestaj, /ketering, /alat-i-oprema, /majstori, /firme, /cene.
Pravila za URL:
- Samo zanat → /poslovi/{zanat}  (npr. /poslovi/tesar)
- Zanat + grad → /poslovi/{zanat}/{grad}  (npr. /poslovi/tesar/beograd)
- Samo grad → /poslovi/{grad}
- Za ostalo → /stranica?q=pretraga  (npr. /masine?q=bager)
Ne znaš → null.

Vrati SAMO {"url":"..."} ili {"url":null}. NISTA DRUGO.`;

    const text = await callGemini(prompt);
    if (!text) return { url: null, keywords: [query] };

    const parsed = JSON.parse(cleanJson(text));

    return {
      url: parsed.url || null,
      keywords: query ? [query] : [],
    };
  } catch (e: unknown) {
    console.error("[AiSearch] Gemini failed:", e instanceof Error ? e.message : e);
    return { url: null, keywords: [query] };
  }
}

export async function searchAndAnswer(query: string, page = 1, pageSize = 10): Promise<AiAskResult> {
  const startTime = Date.now();
  const log = (msg: string) => console.log(`[AiAsk] ${msg}`);

  if (!query || typeof query !== "string") {
    return { answer: "", count: 0, page: 1, pageSize: 10, totalPages: 0, error: "Nema upita" };
  }

  log(`1. Primljen query: "${query}"`);

  const timeoutMs = 30000;

  try {
    // 2. Gemini izvlači profesiju, grad i ključne reči
    log("2. Saljem Gemini-u na parsiranje...");
    const t1 = Date.now();
    const parsePrompt = `Upit: "${query}"

Izvuci:
- profession: zanimanje slug (npr. tesar, krovopokrivac, zidar, armirač, fasader, moler, keramicar, bravar, elektricar, vodoinstalater, stolar, parketar, gipsar, izolater, rukovalac)
- city: grad slug (npr. beograd, nis, novi-sad, kragujevac, subotica, zrenjanin, krusevac, cacak, novi-pazar, kraljevo, leskovac, sabac, smederevo, pozarevac, uzice, vranje, sumadija, nisava, srbija)
- keywords: niz sinonima i srodnih termina za pretragu (min 2, max 5, na primer za "tesar": ["tesar", "tesari", "oplata", "salovanje", "krov"])

Vrati SAMO {"profession": ..., "city": ..., "keywords": [...]} u JSON formatu. Ako nema, vrednost je null ili prazan niz.`;

    const parseText = await callGemini(parsePrompt);
    if (!parseText) {
      log("2. Gemini vratio null odgovor");
      return { answer: "Nisam uspeo da obradim upit.", count: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
    log(`2. Gemini odgovorio za ${Date.now() - t1}ms: ${parseText.slice(0, 200)}`);

    if (Date.now() - startTime > timeoutMs) {
      log("TIMEOUT nakon prvog Gemini poziva");
      return { answer: "Predugo traje obrada. Probaj kraći upit.", count: 0, page: 1, pageSize: 10, totalPages: 0, error: "timeout" };
    }

    const { profession, city, keywords } = JSON.parse(cleanJson(parseText));
    const kwList: string[] = Array.isArray(keywords) ? keywords : [];
    log(`3. Parsiran: profession="${profession || ''}" city="${city || ''}" keywords=[${kwList.join(', ')}]`);

    // 4. Firestore pretraga po prioritetu
    log("4. Izvrsavam Firestore query...");
    const t2 = Date.now();
    let snap: any;
    let queryDesc = "";

    if (profession) {
      queryDesc = `profession=${profession} (filtrirano u kodu)`;
      snap = await db.collection("listings")
        .where("profession", "==", profession)
        .get();
    } else if (kwList.length > 0) {
      let found = false;
      for (const kw of kwList.slice(0, 3)) {
        if (found) break;
        queryDesc = `searchKeywords array-contains "${kw}"`;
        log(`   Probam keyword: "${kw}"`);
        snap = await db.collection("listings")
          .where("searchKeywords", "array-contains", kw)
          .get();
        found = snap.size > 0;
        log(`   Rezultat: ${snap.size} oglasa`);
      }
    } else {
      queryDesc = "type=job, status=active, orderBy createdAt desc (najnoviji)";
      snap = await db.collection("listings")
        .where("type", "==", "job")
        .where("status", "==", "active")
        .orderBy("createdAt", "desc")
        .limit(5).get();
    }

    log(`4. Query: ${queryDesc}`);
    log(`4. Firestore vratio ${snap?.size || 0} oglasa za ${Date.now() - t2}ms`);

    if (Date.now() - startTime > timeoutMs) {
      log("TIMEOUT nakon Firestore query-a");
      return { answer: "Predugo traje obrada. Probaj kraći upit.", count: 0, page: 1, pageSize: 10, totalPages: 0, error: "timeout" };
    }

    // 5. Filtriramo u kodu: samo aktivni poslovi
    let filtered = snap.docs.filter((d: any) => {
      const data = d.data();
      return data.type === "job" && data.status === "active";
    });

    // 6. Fallback ako nema rezultata
    if (filtered.length === 0) {
      log("5. Nema rezultata, vracam najnovije oglase");
      const t3 = Date.now();
      const fallback = await db.collection("listings")
        .orderBy("createdAt", "desc")
        .limit(50).get();
      filtered = fallback.docs.filter((d: any) => {
        const data = d.data();
        return data.type === "job" && data.status === "active";
      }).slice(0, 5);
      log(`5. Fallback vratio ${filtered.length} oglasa za ${Date.now() - t3}ms`);
    }

    // 6. Spremi oglase za odgovor i prikaz
    const resultCount = filtered.length;
    const allListings = filtered.map((d: any) => {
      const data = d.data();
      const ts = data.createdAt;
      return {
        id: d.id,
        title: data.title || "",
        description: (data.description || "").slice(0, 300),
        location: data.location || data.locationSlug || "",
        loc: data.loc || data.location || "",
        salary: data.plataMin && data.plataMax
          ? `${data.plataMin}-${data.plataMax} ${data.salaryType || "eur/h"}`
          : "",
        plataMin: data.plataMin !== undefined ? data.plataMin : null,
        plataMax: data.plataMax !== undefined ? data.plataMax : null,
        salaryType: data.salaryType || "eur/h",
        company: data.companyName || data.comp || "",
        companyName: data.companyName || data.comp || "",
        comp: data.comp || data.company || "",
        isPremium: !!data.isPremium,
        isUrgent: !!data.isUrgent,
        logo: data.logo || null,
        logoPlaceholder: data.logoPlaceholder || null,
        createdAt: ts?.toDate ? ts.toDate().toISOString() : (typeof ts === 'string' ? ts : ''),
      };
    });

    // 7. Paginacija
    const totalPages = Math.max(1, Math.ceil(resultCount / pageSize));
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * pageSize;
    const pageListings = allListings.slice(start, start + pageSize);

    // 8. Prvih 10 za Gemini da napravi odgovor, ostale vracamo za prikaz
    const geminiListings = allListings.slice(0, 10);
    const listingsText = geminiListings.map((l: any, i: number) =>
      `${i + 1}. ${l.title} (${l.location})${l.salary ? " - " + l.salary : ""}${l.company ? " - " + l.company : ""}${l.description ? "\n   " + l.description : ""}`
    ).join("\n");

    log(`6. Saljem ${geminiListings.length}/${resultCount} oglasa Gemini-ju na odgovor...`);
    const t4 = Date.now();
    const answerPrompt = `Korisnik je pitao: "${query}"

Pronađeni oglasi u bazi:
${listingsText}

Daj odgovor korisniku na srpskom. Reci mu koliko oglasa je pronađeno (${resultCount}) i ukratko opiši šta je dostupno. Ako nema potpunog poklapanja, reci mu iskreno. Ne izmišljaj informacije koje nisu u oglasima.`;

    const answerText = await callGemini(answerPrompt);
    log(`6. Gemini odgovorio za ${Date.now() - t4}ms: "${(answerText || '').slice(0, 100)}..."`);

    const totalTime = Date.now() - startTime;
    log(`7. Ukupno vreme: ${totalTime}ms`);

    return {
      answer: answerText || `Pronađeno ${resultCount} oglasa za "${query}".`,
      count: resultCount,
      page: validPage,
      pageSize,
      totalPages,
      listings: pageListings,
    };
  } catch (e: unknown) {
    const elapsed = Date.now() - startTime;
    const msg = e instanceof Error ? e.message : String(e);
    log(`GRESKA (${elapsed}ms): ${msg}`);
    if (elapsed > timeoutMs) {
      return { answer: "Predugo traje obrada. Probaj kraći upit.", count: 0, page: 1, pageSize: 10, totalPages: 0, error: "timeout" };
    }
    return { answer: "Došlo je do greške pri pretrazi.", count: 0, page: 1, pageSize: 10, totalPages: 0, error: msg };
  }
}
