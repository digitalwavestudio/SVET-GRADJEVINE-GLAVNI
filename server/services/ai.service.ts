import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";

let aiInstance: GoogleGenAI | null = null;

export const getGenAI = () => {
  if (!aiInstance) {
    if (!env.GEMINI_API_KEY) {
      logger.warn("[AI] GEMINI_API_KEY missing, AI services disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiInstance;
};

export const callGeminiAPI = async (prompt: string) => {
  const ai = getGenAI();
  if (!ai) {
    logger.warn("[AI] Gemini API unavailable, returning empty response.");
    return "";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("AI service failed");
  }
};

export const parseSearchIntent = async (query: string) => {
  const ai = getGenAI();
  if (!ai) {
    logger.warn("[AI] Gemini unavailable, returning fallback intent.");
    return { keywords: [query], intentType: "SEARCH" };
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analiziraj upit za portal "Svet Građevine" i pretvori ga u strukturirane filtere.
      Upit: "${query}"

      PRAVILA:
      1. Mapiraj gradove na slug-ove (npr. "u Nišu" -> "nis", "beogradu" -> "beograd").
      2. Prepoznaj kategoriju: jobs (posao), accommodations (smeštaj), catering (hrana), companies (firme), machines (mašine), marketplace (oglasi/prodaja), masters (majstori).
      3. Cena: "do 5000" -> maxPrice: 5000.
      4. Izdvoj ključne reči koje nisu lokacija ili kategorija.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: [
                "jobs",
                "accommodations",
                "catering",
                "companies",
                "machines",
                "real-estate",
                "marketplace",
                "masters",
              ],
              nullable: true,
            },
            subCategory: { type: Type.STRING, nullable: true },
            locationSlug: { type: Type.STRING, nullable: true },
            minPrice: { type: Type.NUMBER, nullable: true },
            maxPrice: { type: Type.NUMBER, nullable: true },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            isUrgent: { type: Type.BOOLEAN },
            intentType: { type: Type.STRING, enum: ["SEARCH", "QUESTION"] },
          },
          required: ["keywords", "intentType"],
        },
      },
    });
    const jsonStr = response.text?.trim() || "{}";
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // Fallback if Gemini returns non‑JSON
      return { keywords: [query], intentType: "SEARCH" };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return { keywords: [query], intentType: "SEARCH" };
  }
};

export const moderateImage = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64Data = await new Promise<string>((resolve) => {
      const arrayBuffer = blob.arrayBuffer();
      arrayBuffer.then((buffer) => {
        const base64 = Buffer.from(buffer).toString("base64");
        resolve(base64);
      }).catch(err => logger.warn('[AI] ArrayBuffer extraction error:', err));
    });

    const ai = getGenAI();
    if (!ai) {
      logger.warn("[AI] Gemini unavailable, skipping image moderation.");
      return { isSafe: true, confidence: 1 };
    }
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: blob.type,
              data: base64Data,
            },
          },
          {
            text: `Analiziraj sliku za oglas na građevinskom portalu "Svet Građevine". Proveri da li slika krši sledeća pravila: 
            1. Sadrži eksplicitni seksualni sadržaj ili golotinju.
            2. Sadrži ekstremno nasilje ili uznemirujuće prizore (krvi, povrede).
            3. Sadrži ilegalne supstance, drogu ili oružje.
            4. Sadrži govor mržnje, uvredljiv tekst ili simbole mržnje.
            5. Sadrži agresivni spam tekst, QR kodove ka sumnjivim sajtovima ili nejasne reklame koje nisu vezane za svet građevine.

            Odgovori isključivo u JSON formatu:
            {
              "isSafe": boolean,
              "reason": "Kratko obrazloženje na srpskom jeziku AKO slika NIJE bezbedna (npr. 'Detektovan neprimeren sadržaj' ili 'Slika sadrži oružje')",
              "confidence": number (0 do 1)
            }`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["isSafe", "confidence"],
        },
      },
    });

    const jsonStr = result.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API error in image moderation:", error);
    // Fallback: allow if AI fails
    return { isSafe: true, confidence: 0 };
  } finally {
    // No cleanup needed
  }
};

export const generateAdFromDescription = async (description: string, category: string) => {
  const ai = getGenAI();
  if (!ai) {
    logger.warn("[AI] Gemini unavailable, returning empty ad data.");
    return { opis: description };
  }

  const categoryFields: Record<string, string> = {
    job: `location (grad slug), sector (slug), profession (slug), opis (detaljan opis posla na srpskom), plataMin (broj), plataMax (broj), dinamikaIsplate (slug: dnevno/nedeljno/mesecno), benefits (array stringova)`,
    machines: `location (grad slug), machCategory (slug), machSubCategory (slug), machBrand (string), machModel (string), machAdType (prodaja ili iznajmljivanje), machPrice (broj), machYear (broj), machHours (broj, radni sati), machFuel (slug goriva), opis (detaljan opis na srpskom)`,
    accommodation: `location (grad slug), accType (slug tipa smestaja), totalBeds (broj), availableBeds (broj), price (broj), priceType (perPerson ili perNight), opis (detaljan opis na srpskom), amenities (array stringova)`,
    catering: `location (grad slug), catKitchenType (slug), catMinOrder (broj), catPricePerMeal (broj), catDeliveryZone (string), opis (detaljan opis na srpskom)`,
    plot: `location (grad slug), plotPurpose (slug), plotArea (broj), plotAreaUnit (ari ili ha), plotPrice (broj), opis (detaljan opis na srpskom), plotInfrastructure (objekat sa boolean poljima: struja, voda, kanalizacija, gas, optika)`,
    marketplace: `location (grad slug), marketCategory (slug), title (string), marketCondition (novo ili polovno), marketValue (broj), opis (detaljan opis na srpskom)`,
    company: `location (grad slug), companyName (string), companyDescription (string), opis (detaljan opis na srpskom), companyMainCats (array stringova), companyWorkingHours (string)`,
  };

  const fields = categoryFields[category] || categoryFields.job;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Korisnik zeli da postavi oglas na gradjevinskom portalu "Svet Građevine" u kategoriji "${category}".

Korisnikov opis: "${description}"

Na osnovu opisa, popuni sledeca polja za ovu kategoriju:
${fields}

Vazna pravila:
1. location je uvek TACAN slug grada (samo: "beograd", "novi-sad", "nis", "kragujevac", "cacak", "kraljevo", "subotica", "pancevo", "krusevac", "leskovac", "vranje", "sabac", "novi-pazar", "uzice", "ostalo-u-srbiji", "rad-na-terenu", "nemacka", "austrija", "slovenija", "hrvatska")
2. sector (samo za job) MORA biti TACAN slug. Sektori sa profesijama:
   - "gruba-gradnja": zidar, tesar, armirač, betonirac, krovopokrivac, masinski-malter, fizicki-radnik, pomocni-radnik, univerzalac-majstor
   - "zavrsni-radovi": moler, gipsar, fasader, keramicar, parketar, izolater, podopolagac, monter-kamena, fizicki-radnik, pomocni-radnik
   - "instalacije-i-tehnika": vodoinstalater, elektricar, instalater-grejanja, instalater-solarnih-panela, hvac-tehnicar, fizicki-radnik
   - "metal-i-bravarija": zavarivac, bravar, LIMAR, montazer-celicnih-konstrukcija, antikorozista, fizicki-radnik
   - "niskogradnja": asfalter, putar, cevopolagac, radnik-na-niskogradnji, geobusac, fizicki-radnik
   - "rukovaoc-gradjevinskom-mehanizacijom": rukovalac-bagerom, rukovalac-kranom, rukovalac-viljuskarom, vozac-kamiona
   - "inzenjering": gradjevinski-inzenjer-visokogradnja, arhitekta, geodeta, sef-gradilista, projekt-menadzer
   - "ostalo": cuvar-gradilista, radnik-na-ciscenju, bastovan, fizicki-radnik, pomocni-radnik
3. profession (samo za job) MORA biti TACAN slug iz liste iznad - PRONADJI najblizi po zanimanju (npr. "limar" -> "limar", "krović" -> "krovopokrivac", "šofer" -> "vozac-kamiona")
4. Ako korisnik nije specificirao neko polje, ostavi ga null
5. opis treba da bude detaljan i profesionalan tekst na SRPSKOM, prosiren na osnovu korisnikovog opisa, minimum 50 karaktera
6. Ako korisnik kaze "mašina" bez detalja, machCategory postavi "ostalo", machAdType postavi "prodaja"

Odgovori iskljucivo u JSON formatu sa ovim poljima.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING, nullable: true },
            opis: { type: Type.STRING },
            sector: { type: Type.STRING, nullable: true },
            profession: { type: Type.STRING, nullable: true },
            plataMin: { type: Type.NUMBER, nullable: true },
            plataMax: { type: Type.NUMBER, nullable: true },
            dinamikaIsplate: { type: Type.STRING, nullable: true },

            machCategory: { type: Type.STRING, nullable: true },
            machSubCategory: { type: Type.STRING, nullable: true },
            machBrand: { type: Type.STRING, nullable: true },
            machModel: { type: Type.STRING, nullable: true },
            machAdType: { type: Type.STRING, nullable: true },
            machPrice: { type: Type.NUMBER, nullable: true },
            machYear: { type: Type.NUMBER, nullable: true },
            machHours: { type: Type.NUMBER, nullable: true },
            machFuel: { type: Type.STRING, nullable: true },
            accType: { type: Type.STRING, nullable: true },
            totalBeds: { type: Type.NUMBER, nullable: true },
            availableBeds: { type: Type.NUMBER, nullable: true },
            price: { type: Type.NUMBER, nullable: true },
            priceType: { type: Type.STRING, nullable: true },
            catKitchenType: { type: Type.STRING, nullable: true },
            catMinOrder: { type: Type.NUMBER, nullable: true },
            catPricePerMeal: { type: Type.NUMBER, nullable: true },
            catDeliveryZone: { type: Type.STRING, nullable: true },
            plotPurpose: { type: Type.STRING, nullable: true },
            plotArea: { type: Type.NUMBER, nullable: true },
            plotAreaUnit: { type: Type.STRING, nullable: true },
            plotPrice: { type: Type.NUMBER, nullable: true },
            marketCategory: { type: Type.STRING, nullable: true },
            title: { type: Type.STRING, nullable: true },
            marketCondition: { type: Type.STRING, nullable: true },
            marketValue: { type: Type.NUMBER, nullable: true },
            companyName: { type: Type.STRING, nullable: true },
            companyDescription: { type: Type.STRING, nullable: true },
            companyWorkingHours: { type: Type.STRING, nullable: true },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            amenities: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            companyMainCats: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
          },
          required: ["opis"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return { opis: description };
    }
  } catch (error) {
    console.error("Gemini API error in generateAdFromDescription:", error);
    return { opis: description };
  }
};

export const processDashboardCommand = async (input: string, context?: any) => {
  const ai = getGenAI();
  if (!ai) {
    logger.warn("[AI] Gemini unavailable, returning default command response.");
    return "Komanda je obrađena.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The user typed the following command: "${input}". Provide a helpful and brief response simulating an advanced AI assistant answering the command. Context: ${JSON.stringify(context || {})}`,
    });
    return response.text || "Komanda je obrađena.";
  } catch (err) {
    console.error("AI Error:", err);
    return "Došlo je do greške prilikom obrade, proverite konekciju ili ključeve.";
  }
};
