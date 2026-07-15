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

export async function callGemini(prompt: string, temp = 0.1) {
  const client = new GoogleGenAI({
    vertexai: true,
    project: "svet-gradjevine-eu",
    location: "us-central1",
  });
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: temp, maxOutputTokens: 2000 },
  });
  return response.text || null;
}

export async function chatWithGemini(messages: {role: "user" | "model", content: string}[]) {
  try {
    const client = new GoogleGenAI({
      vertexai: true,
      project: "svet-gradjevine-eu",
      location: "us-central1",
    });
    
    // RAG Injection: provera da li korisnik pita za platu/satnicu/posao
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let systemAddon = "";
    
    if (lastMsg.includes("satnic") || lastMsg.includes("plat") || lastMsg.includes("zarad") || lastMsg.includes("posa") || lastMsg.includes("posl") || lastMsg.includes("cen")) {
       const professions = ['tesar', 'zidar', 'armirac', 'moler', 'fasader', 'keramicar', 'elektricar', 'vodoinstalater', 'bravar', 'stolar', 'parketar', 'gipsar', 'izolater', 'rukovalac', 'vozac', 'bagerista', 'kranista', 'pomocni', 'fizicki', 'inzenjer', 'monter', 'limar', 'varilac'];
       // Jednostavna detekcija zanimanja
       const foundProf = professions.find(p => lastMsg.includes(p) || lastMsg.includes(p.replace(/ar$/, 'ari')) || lastMsg.includes(p.replace(/ar$/, 'are')) || lastMsg.includes(p.replace(/c$/, 'ci')));
       
       if (foundProf) {
         try {
           const snap = await db.collection("listings")
            .where("type", "==", "job")
            .where("status", "==", "active")
            .where("searchKeywords", "array-contains", foundProf)
            .get();
            
           if (!snap.empty) {
             let count = 0, minSum = 0, maxSum = 0, salaryCount = 0;
             snap.docs.forEach(doc => {
               const data = doc.data();
               count++;
               if (data.plataMin) {
                 minSum += data.plataMin;
                 maxSum += (data.plataMax || data.plataMin);
                 salaryCount++;
               }
             });
             
             if (salaryCount > 0) {
               systemAddon = `\n\n[SISTEMSKA INFORMACIJA - TRENUTNI PODACI IZ BAZE KORISTI IH ZA ODGOVOR]: Imamo ${count} aktivnih oglasa za zanimanje '${foundProf}'. Prosečna plata/satnica je od ${Math.round(minSum/salaryCount)} do ${Math.round(maxSum/salaryCount)} (iznosi do 20 su evri/sat, iznosi preko 500 su evri/mesec). Obavesti korisnika o ovim prosečnim cenama i uputi ga na stranicu /poslovi.`;
             } else {
               systemAddon = `\n\n[SISTEMSKA INFORMACIJA]: Imamo ${count} aktivnih oglasa za '${foundProf}', ali poslodavci nisu naveli tačne plate u oglasima. Uputi korisnika da pogleda detalje na stranici /poslovi.`;
             }
           } else {
             systemAddon = `\n\n[SISTEMSKA INFORMACIJA]: Trenutno nema aktivnih oglasa za zanimanje '${foundProf}'.`;
           }
         } catch (e) {
           console.error("Stats RAG error:", e);
         }
       } else {
           // Opšta prosečna satnica
           try {
               const snap = await db.collection("listings")
                .where("type", "==", "job")
                .where("status", "==", "active")
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();
               let count = 0, minSum = 0, maxSum = 0, salaryCount = 0;
               snap.docs.forEach(doc => {
                 const data = doc.data();
                 count++;
                 if (data.plataMin && data.plataMin < 30) { // samo satnice
                   minSum += data.plataMin;
                   maxSum += (data.plataMax || data.plataMin);
                   salaryCount++;
                 }
               });
               if (salaryCount > 0) {
                   systemAddon = `\n\n[SISTEMSKA INFORMACIJA - TRENUTNI PODACI]: Opšta prosečna satnica u građevini (najnoviji oglasi) je oko ${Math.round(minSum/salaryCount)}-${Math.round(maxSum/salaryCount)} €/h. Plate variraju po zanatima.`;
               }
           } catch(e) {}
       }
    }

    const formattedContents = messages.map(msg => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const systemPrompt = `Ti si "Svet Građevine Asistent", ljubazni ekspert za platformu Svet Građevine.
Tvoj posao je da pomažeš korisnicima (majstorima i poslodavcima) oko traženja posla, cena, objave oglasa i navigacije.
Budi kratak, jasan i uvek koristi srpski jezik. Ograniči odgovore na najviše 3-4 rečenice.
Ukoliko te pitaju nešto van građevine ili platforme, ljubazno reci da si tu samo za Svet Građevine.${systemAddon}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: formattedContents,
      config: { 
        temperature: 0.5, 
        maxOutputTokens: 1000,
        systemInstruction: systemPrompt
      },
    });
    return response.text || "Izvinite, trenutno ne mogu da odgovorim. Pokušajte ponovo kasnije.";
  } catch (error) {
    console.error("[AiChat] Gemini failed:", error);
    return "Došlo je do greške na serveru. Molim vas pokušajte kasnije.";
  }
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

    // 5b. Filtriranje po gradu ako je korisnik ukucao (npr "tesar beograd")
    if (city) {
      const citySlug = city.toLowerCase();
      const byCity = filtered.filter((d: any) => {
        const data = d.data();
        const loc = (data.locationSlug || data.location || "").toLowerCase().replace(/\s+/g, '-');
        return loc === citySlug || loc.includes(citySlug);
      });
      if (byCity.length >= 2) {
        filtered = byCity;
        log(`5b. Filtrirano na "${city}": ${filtered.length} oglasa`);
      } else {
        log(`5b. Samo ${byCity.length} oglasa za "${city}", prikazujem sve lokacije (premalo rezultata)`);
      }
    }

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

    // Per-country salary stats
    const germanyKeywords = ['nemacka', 'nemačka', 'germany'];
    const serbiaKeywords = ['srbija', 'beograd', 'nis', 'novi-sad', 'kragujevac', 'subotica', 'kraljevo', 'zrenjanin', 'krusevac', 'cacak', 'novi-pazar', 'leskovac', 'sabac', 'smederevo', 'pozarevac', 'uzice', 'vranje', 'zlatibor'];
    const germanyListings = allListings.filter((l: any) => {
      const loc = (l.loc || l.location || '').toLowerCase().replace(/\s+/g, '-');
      return germanyKeywords.some(k => loc.includes(k));
    });
    const serbiaListings = allListings.filter((l: any) => {
      const loc = (l.loc || l.location || '').toLowerCase().replace(/\s+/g, '-');
      return serbiaKeywords.some(k => loc.includes(k));
    });
    const calcCountryAvg = (list: any[]) => {
      const sals = list.filter((l: any) => l.plataMin != null).map((l: any) => ({ min: l.plataMin || 0, max: l.plataMax || l.plataMin || 0 }));
      if (sals.length === 0) return '';
      const mn = Math.round(sals.reduce((s: number, l: any) => s + l.min, 0) / sals.length);
      const mx = Math.round(sals.reduce((s: number, l: any) => s + l.max, 0) / sals.length);
      return `${mn}–${mx} €/h`;
    };
    const srAvg = calcCountryAvg(serbiaListings);
    const deAvg = calcCountryAvg(germanyListings);
    const countrySalaryLine = [];
    if (srAvg) countrySalaryLine.push(`Prosečna satnica za Srbiju: **${srAvg}**`);
    if (deAvg) countrySalaryLine.push(`Prosečna satnica za Nemačku: **${deAvg}**`);

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
${countrySalaryLine.length > 0 ? '- ' + countrySalaryLine.join('\n- ') : ''}
- Top lokacije: ${topLocs.join(', ')}
- Broj oglasa sa smeštajem: ${allListings.filter((l: any) => l.benefits?.includes('smestaj')).length}
- Broj oglasa sa prevozom: ${allListings.filter((l: any) => l.benefits?.includes('prevoz')).length}
- Broj oglasa sa obrokom: ${allListings.filter((l: any) => l.benefits?.includes('topli-obrok') || l.benefits?.includes('hrana')).length}

SISTEM: Ti si tržišni analitičar. Analiziraš OVE konkretne oglase iznad. Ne izmišljaš ništa što ne vidiš u podacima. Ne koristiš floskule "građevinski projekti", "rad na gradilištima", "pomoćni radnici". Pišeš SAMO ono što stoji u oglasima iznad.

Pravila za format odgovora:
- Summary: **Pronađeno je UKUPNO oglasa za posao ZANIMANJE**. UKUPNO = ukupan broj iz zagrade "({resultCount} ukupno)". ZANIMANJE napiši VELIKIM SLOVIMA i BOLDIRAJ. SAMO jedna rečenica, NE dodaji lokacije.
- Lokacije bullet: PRONADJENO OGLASA ZA 'ZANIMANJE' PO LOKACIJAMA — svaki grad/državu boldiraj i broj. ZANIMANJE VELIKIM SLOVIMA boldirano.
- CENOVNI VODIČ: svaku lokaciju sa satnicom u novom redu, boldirano. Zatim "Najviše plaća" linija. Odvojenu prosečnu satnicu za Srbiju i Nemačku ako ima podataka. Ne piši uvek Nemačka.
- SAVET: najbolji deal iz podataka. Ako ima i Srbije i Nemačke, razdvoji. Alternativa ako je malo oglasa. Prijava — šta poslodavci traže.
- Ne piši instrukcije i pravila u odgovor. Samo čist sadržaj.

NA OVO PITANJE MORAŠ ODGOVORITI U JSON FORMATU. Vrati SAMO validan JSON:
{
  "summary": "**Pronađeno je X oglaza za posao FASADER**",
  "bullets": [
    {"emoji": "", "text": "PRONADJENO OGLASA ZA 'FASADER' PO LOKACIJAMA:<br>**Beograd** (5), **Ostalo u Srbiji** (4), **Novi Sad** (1), **Pančevo** (2), **Slovenija** (1)"},
    {"emoji": "", "text": "CENOVNI VODIČ PO LOKACIJAMA:<br>**Beograd** **6–11 €/h**<br>**Novi Sad** **7–10 €/h**<br><br>Najviše plaća **Beograd** sa **6–11 €/h**.<br>Prosečna satnica: **6–11 €/h**"},
    {"emoji": "", "text": "🏠 Smeštaj: **3/12** | 🚌 Prevoz: **5/12** | 🍽️ Obrok: **2/12**"},
    {"emoji": "", "text": "SAVET:<br>💡 **Najbolji deal:** opiši najbolju ponudu.<br>💡 **Alternativa:** ako je malo oglasa, predloži obližnje.<br>💡 **Prijava:** istakni tražene veštine iz oglasa."}
  ],
  "closing": "Ispod je lista oglasa koje smo pronašli. Klikni na 'Pogledaj' za detalje."
}

Pravila:
- Piši na srpskom jeziku
- NE piši instrukcije, pravila ili uputstva u odgovor — samo čist sadržaj
- BELEŽI SAMO ono što vidiš u oglasima iznad — ne dodaji ništa po defaultu
- Ako nema podataka za nešto (npr nema smeštaja ni u jednom oglasu), NE PIŠI to polje
- UKUPNO u summary je broj iz zagrade "({resultCount} ukupno)"`;



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

export async function parseAdIntent(text: string) {
  try {
    const prompt = `Analiziraj sledeći tekst oglasa za posao u građevini i izvuci ključne informacije.
Tekst: "${text}"

Vrati JSON objekat sa sledećim poljima (ako nešto ne možeš da zaključiš, ostavi prazno ili null):
- sector (string): slug sektora, npr. 'visokogradnja', 'niskogradnja', 'zavrsni-radovi', 'instalacije', 'upravljanje-i-nadzor', 'masine-i-transport', 'pomocni-radovi'
- profession (string): slug zanimanja (npr. 'tesar', 'zidar', 'armirac', 'moler', 'vozac', 'bagerista', 'inzenjer', 'keramicar', 'fizicki-radnik', 'vodoinstalater', 'elektricar')
- location (string): slug grada ili države (npr. 'beograd', 'novi-sad', 'nemacka', 'austrija', 'minhen', 'slovenija', 'hrvatska')
- plataMin (broj): minimalna plata (npr. 15 za 15e/h, ili 2000 za 2000e)
- plataMax (broj): maksimalna plata
- salaryType (string): 'po_satu', 'dnevno', 'mesecno', 'po_kvadratu', 'po_kubiku', 'dogovor'
- benefits (niz stringova): tačno ovi ključevi ako postoje: 'smestaj', 'prevoz', 'hrana', 'osiguranje', 'prijava', 'alat', 'obuka', 'bonusi'

VAŽNO PRAVILO: NEMOJ DA IZMIŠLJAŠ PODATKE! Ako korisnik nije eksplicitno napisao platu, satnicu, ili benefite (smeštaj, hrana, prevoz), OBAVEZNO ostavi ta polja prazna (null ili prazan niz)!
Vrati ISKLJUČIVO validan JSON, bez markdauna.`;

    const res = await callGemini(prompt);
    if (!res) return null;
    return JSON.parse(cleanJson(res));
  } catch (error) {
    console.error("[AiSearch] parseAdIntent error:", error);
    return null;
  }
}

export async function gradeAd(adData: any) {
  try {
    const prompt = `Ovo su podaci iz oglasa za posao u građevini:
Zanimanje: ${adData.profession || 'Nije navedeno'}
Lokacija: ${adData.location || 'Nije navedeno'}
Zarada (iz forme): ${adData.plataMin || ''} - ${adData.plataMax || ''} ${adData.salaryType || ''}
Benefiti (iz forme): ${(adData.benefits || []).join(', ')}
Tekst oglasa: ${adData.opis || 'Nema opisa'}

VAŽNO PRAVILO: Poslodavci često ne popune formu za platu i benefite, već to napišu direktno u "Tekst oglasa" (npr. "satnica 7-9 eur", "obezbeđen smeštaj i hrana"). 
Kada ocenjuješ, OBAVEZNO pročitaj "Tekst oglasa" i ako se satnica, plata ili benefiti tu spominju, smatraj taj kriterijum ISPUNJENIM (daj maksimalne poene za taj deo). U građevini se zarada najčešće izražava kao SATNICA.

Ocenite kvalitet ovog oglasa na skali od 0 do 100. Kriterijumi:
- Jasnoća pozicije i lokacije (20%)
- Informacije o zaradi / satnici (30%) - Oglasi bez ikakve satnice ili plate gube poene. Ako je satnica u tekstu, daj 30/30!
- Informacije o benefitima (20%) - Smeštaj, prevoz, hrana. Ako se pominju u tekstu, daj 20/20!
- Detaljnost opisa (30%)

Vrati JSON objekat sa:
- score (broj od 0 do 100)
- feedback (string, 1-2 kratke rečenice. PRAVILO 1: Ako oglasu fali zarada, napiši "Dodajte preciznu informaciju o zaradi kako bi se privuklo više kandidata.". PRAVILO 2: Ako je sve tu (oglas ima zaradu, lokaciju, benefite i detaljan opis), napiši ISKLJUČIVO: "Odličan oglas! Imate sve ključne informacije." bez dodavanja onoga šta fali! VAŽNO: NEMOJ da spominješ "dogovor" ako ga korisnik nije napisao, i nemoj da ispisuješ kontradiktorne rečenice!)

Vrati ISKLJUČIVO validan JSON, bez markdauna.`;

    const res = await callGemini(prompt, 0);
    if (!res) return { score: 0, feedback: "Nismo mogli da ocenimo oglas." };
    return JSON.parse(cleanJson(res));
  } catch (error) {
    console.error("[AiSearch] gradeAd error:", error);
    return { score: 0, feedback: "Greška pri ocenjivanju." };
  }
}
