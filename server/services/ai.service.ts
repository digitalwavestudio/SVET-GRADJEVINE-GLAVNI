import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export const getGenAI = () => {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("[AI] GEMINI_API_KEY missing, AI services disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
};

export const callGeminiAPI = async (prompt: string) => {
  const ai = getGenAI();
  if (!ai) {
    console.warn("[AI] Gemini API unavailable, returning empty response.");
    return "";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
    console.warn("[AI] Gemini unavailable, returning fallback intent.");
    return { keywords: [query], intentType: "SEARCH" };
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiziraj upit za portal "Svet Građevine" i pretvori ga u strukturirane filtere.
      Upit: "${query}"

      PRAVILA:
      1. Mapiraj gradove na slug-ove (npr. "u Nišu" -> "nis", "beogradu" -> "beograd").
      2. Prepoznaj kategoriju: jobs (posao), accommodations (smeštaj), catering (hrana), companies (firme), machines (mašine), real-estate (nekretnine), marketplace (oglasi/prodaja), masters (majstori).
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
   if (process.env.NODE_ENV === "production") {
      runPendingMigrations().catch(e => console.error("Migration failed", e));
      try {
        DLQMonitoringService.startMonitoring();
      } catch (e) {
        console.warn("[DLQ] Monitoring failed to start:", e);
      }
    }return { keywords: [query], intentType: "SEARCH" };
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
      });
    });

    const ai = getGenAI();
    if (!ai) {
      console.warn("[AI] Gemini unavailable, skipping image moderation.");
      return { isSafe: true, confidence: 1 };
    }
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
  }
};

export const processDashboardCommand = async (input: string, context?: any) => {
  const ai = getGenAI();
  if (!ai) {
    console.warn("[AI] Gemini unavailable, returning default command response.");
    return "Komanda je obrađena.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user typed the following command: "${input}". Provide a helpful and brief response simulating an advanced AI assistant answering the command. Context: ${JSON.stringify(context || {})}`,
    });
    return response.text || "Komanda je obrađena.";
  } catch (err) {
    console.error("AI Error:", err);
    return "Došlo je do greške prilikom obrade, proverite konekciju ili ključeve.";
  }
};
