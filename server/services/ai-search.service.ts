import { env } from "../config/env.ts";
import { GoogleGenAI } from "@google/genai";

interface AiSearchResult {
  url: string | null;
  keywords: string[];
}

export async function parseSearchQuery(query: string): Promise<AiSearchResult> {
  if (!env.GEMINI_API_KEY) {
    return { url: null, keywords: [query] };
  }

  try {
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const prompt = `Upit: "${query}"

Kojoj stranici sajta pripada? Stranice: /poslovi (poslovi), /masine, /placevi, /smestaj, /ketering, /alat-i-oprema, /majstori, /firme, /cene.
Ako je posao → /poslovi/{zanat}/{grad} (npr. /poslovi/tesar/beograd).
Ako nije posao, npr. "bager" → /stranica?q=pretraga (npr. /masine?q=bager).
Ne znam → null.

Vrati SAMO {"url":"..."} ili {"url":null}. NISTA DRUGO.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: prompt }] },
      ],
      config: { temperature: 0.0, maxOutputTokens: 1000 },
    });

    const text = response.text;
    if (!text) return { url: null, keywords: [query] };

    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      url: parsed.url || null,
      keywords: query ? [query] : [],
    };
  } catch (e) {
    console.error("[AiSearch] Gemini failed:", e?.message || e);
    return { url: null, keywords: [query] };
  }
}
