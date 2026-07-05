import { GoogleGenAI } from "@google/genai";
import { db } from "../config/firebase.ts";

interface AiSearchResult {
  url: string | null;
  keywords: string[];
}

interface AiAskResult {
  answer: string;
  parsedIntent: {
    vertikala: string;
    zanimanje: string;
    lokacija: string;
    tipPosla: string;
  };
  confidence: number;
  count: number;
  error?: string;
  page: number;
  pageSize: number;
  totalPages: number;
  listings?: Array<{
    id: string;
    title: string;
    location: string;
    loc: string;
    salary: string;
    comp: string;
    company: string;
    companyName: string;
    companyId: string | null;
    isCompanyVerified: boolean;
    description: string;
    isPremium: boolean;
    isUrgent: boolean;
    createdAt: string;
    logo: string | null;
    logoPlaceholder: string | null;
    plataMin: number | null;
    plataMax: number | null;
    salaryType: string;
    benefits: string[];
    viewsCount: number;
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

const DEFAULT_INTENT = { vertikala: "Poslovi", zanimanje: "", lokacija: "", tipPosla: "" };

export async function searchAndAnswer(query: string, page = 1, pageSize = 10): Promise<AiAskResult> {
  const startTime = Date.now();
  const log = (msg: string) => console.log(`[AiAsk] ${msg}`);

  if (!query || typeof query !== "string") {
    return { answer: "", parsedIntent: DEFAULT_INTENT, confidence: 0, count: 0, page: 1, pageSize: 10, totalPages: 0, error: "Nema upita" };
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
- tipPosla: tip posla na srpskom (npr. "Rad u inostranstvu", "Građevinski radovi", "Rad na objektima", "Infrastruktura")

Gradovi van Srbije (nemacka, austrija, hrvatska, slovenija, crna-gora, bosna) = "Rad u inostranstvu".
Ako je grad u Srbiji = "Lokalni radovi" ili specifičniji tip.

Vrati SAMO {"profession": ..., "city": ..., "keywords": [...], "tipPosla": "..."} u JSON formatu. Ako nema, vrednost je null ili prazan niz.`;

    const parseText = await callGemini(parsePrompt);
    if (!parseText) {
      log("2. Gemini vratio null odgovor");
      return { answer: "Nisam uspeo da obradim upit.", parsedIntent: DEFAULT_INTENT, confidence: 0, count: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
    log(`2. Gemini odgovorio za ${Date.now() - t1}ms: ${parseText.slice(0, 200)}`);

    if (Date.now() - startTime > timeoutMs) {
      log("TIMEOUT nakon prvog Gemini poziva");
      return { answer: "Predugo traje obrada. Probaj kraći upit.", parsedIntent: DEFAULT_INTENT, confidence: 0, count: 0, page: 1, pageSize: 10, totalPages: 0, error: "timeout" };
    }

    const { profession, city, keywords, tipPosla } = JSON.parse(cleanJson(parseText));
    const kwList: string[] = Array.isArray(keywords) ? keywords : [];
    log(`3. Parsiran: profession="${profession || ''}" city="${city || ''}" keywords=[${kwList.join(', ')}] tipPosla="${tipPosla || ''}"`);

    const parsedIntent = {
      vertikala: "Poslovi",
      zanimanje: profession ? profession.charAt(0).toUpperCase() + profession.slice(1).replace(/-/g, ' ') : query,
      lokacija: city ? city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ') : "Srbija",
      tipPosla: tipPosla || (city && ['nemacka', 'austrija', 'hrvatska', 'slovenija', 'crna-gora', 'bosna'].includes(city) ? "Rad u inostranstvu" : "Lokalni radovi"),
    };

    // Base confidence from parse quality
    let baseConfidence = 50;
    if (profession && city) baseConfidence = 90;
    else if (profession) baseConfidence = 75;
    else if (kwList.length > 0) baseConfidence = 55;

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
      return { answer: "Predugo traje obrada. Probaj kraći upit.", parsedIntent: DEFAULT_INTENT, confidence: 0, count: 0, page: 1, pageSize: 10, totalPages: 0, error: "timeout" };
    }

    // 5. Filtriramo u kodu: samo aktivni poslovi
    let filtered = snap.docs.filter((d: any) => {
      const data = d.data();
      return data.type === "job" && data.status === "active";
    });

    // Premium na vrh, zatim po createdAt desc
    filtered.sort((a: any, b: any) => {
      const aData = a.data();
      const bData = b.data();
      const aP = aData.isPremium ? 1 : 0;
      const bP = bData.isPremium ? 1 : 0;
      if (bP !== aP) return bP - aP;
      const aT = aData.createdAt?.toDate?.()?.getTime() || new Date(aData.createdAt || 0).getTime();
      const bT = bData.createdAt?.toDate?.()?.getTime() || new Date(bData.createdAt || 0).getTime();
      return bT - aT;
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
          ? `${data.plataMin}-${data.plataMax} ${data.salaryType === "hourly" ? "po satu" : "mesečno"}`
          : "",
        plataMin: data.plataMin !== undefined ? data.plataMin : null,
        plataMax: data.plataMax !== undefined ? data.plataMax : null,
        salaryType: data.salaryType || "hourly",
        company: data.companyName || data.comp || "",
        companyName: data.companyName || data.comp || "",
        comp: data.comp || data.company || "",
        isPremium: !!data.isPremium,
        isUrgent: !!data.isUrgent,
        logo: data.logo || null,
        logoPlaceholder: data.logoPlaceholder || null,
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        viewsCount: typeof data.viewsCount === 'number' ? data.viewsCount : 0,
        companyId: data.companyId || null,
        isCompanyVerified: !!data.isCompanyVerified,
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

    // Calculate salary stats
    const salaries = allListings.filter((l: any) => l.plataMin != null).map((l: any) => ({ min: l.plataMin || 0, max: l.plataMax || l.plataMin || 0 }));
    const avgMin = salaries.length > 0 ? Math.round(salaries.reduce((s: number, l: any) => s + l.min, 0) / salaries.length) : 0;
    const avgMax = salaries.length > 0 ? Math.round(salaries.reduce((s: number, l: any) => s + l.max, 0) / salaries.length) : 0;

    // Count locations
    const locCounts: Record<string, number> = {};
    allListings.forEach((l: any) => {
      const loc = l.loc || l.location || "Srbija";
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });
    const topLocs = Object.entries(locCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([loc]) => loc.charAt(0).toUpperCase() + loc.slice(1).replace(/-/g, ' '));

    const answerPrompt = `Korisnik je pitao: "${query}"

Pronađeni oglasi u bazi (${resultCount} ukupno):
${listingsText}

Statistika:
- Prosečna satnica: ${avgMin} - ${avgMax} €/h
- Top lokacije: ${topLocs.join(', ')}

NA OVO PITANJE MORAŠ ODGOVORITI U JSON FORMATU. Vrati SAMO validan JSON:
{
  "summary": "Kratak uvodni paragraf (1-2 rečenice) koji pominje upit, koliko oglasa je pronađeno i gde su najviše ponude.",
  "bullets": [
    {"emoji": "🎯", "text": "Informacija o satnicama i platama (pominji konkretne cifre iz oglasa)"},
    {"emoji": "💰", "text": "Informacija o tipovima poslova i projektima"},
    {"emoji": "🏗️", "text": "Informacija o pogodnostima (smještaj, prevoz, obrok)"},
    {"emoji": "✨", "text": "Savet o korišćenju filtera ili dodatne informacije"}
  ],
  "closing": "Završna rečenica koja upućuje na ispod listu oglasa."
}

Pravila:
- Piši na srpskom jeziku
- Koristi podebljane reči za ključne informacije (kao **6 do 17 €/h**)
- Budu konkretni - pominji cifre iz oglasa
- Ne izmišljaj informacije koje nisu u oglasima
- Bullet poeni moraju imati emoji prefix`;

    const answerText = await callGemini(answerPrompt);
    log(`6. Gemini odgovorio za ${Date.now() - t4}ms: "${(answerText || '').slice(0, 100)}..."`);

    // Parse structured answer
    let structuredAnswer = null;
    try {
      structuredAnswer = JSON.parse(cleanJson(answerText || ''));
    } catch {
      // Fallback to plain text
      structuredAnswer = { summary: answerText || `Pronađeno ${resultCount} oglasa za "${query}".`, bullets: [], closing: "" };
    }

    // Adjust confidence based on results
    let confidence = baseConfidence;
    if (resultCount > 0) confidence = Math.min(confidence + 5, 99);
    else confidence = Math.max(confidence - 20, 20);

    // Update lokacija with actual top locations if available
    if (topLocs.length > 0 && (!city || city === "srbija")) {
      parsedIntent.lokacija = topLocs.join(", ");
    }

    const totalTime = Date.now() - startTime;
    log(`7. Ukupno vreme: ${totalTime}ms`);

    return {
      answer: JSON.stringify(structuredAnswer),
      parsedIntent,
      confidence,
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
      return { answer: "Predugo traje obrada. Probaj kraći upit.", parsedIntent: DEFAULT_INTENT, confidence: 0, count: 0, page: 1, pageSize: 10, totalPages: 0, error: "timeout" };
    }
    return { answer: "Došlo je do greške pri pretrazi.", parsedIntent: DEFAULT_INTENT, confidence: 0, count: 0, page: 1, pageSize: 10, totalPages: 0, error: msg };
  }
}
