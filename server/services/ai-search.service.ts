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

Kojoj stranici sajta pripada? Stranice: /poslovi, /masine, /placevi, /smestaj, /ketering, /alat-i-oprema, /majstori, /firme, /cene.
Pravila za URL:
- Samo zanat → /poslovi/{zanat}  (npr. /poslovi/tesar)
- Zanat + grad → /poslovi/{zanat}/{grad}  (npr. /poslovi/tesar/beograd)
- Samo grad → /poslovi/{grad}
- Za ostalo → /stranica?q=pretraga  (npr. /masine?q=bager)
Ne znaš → null.

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
  } catch (e: unknown) {
    console.error("[AiSearch] Gemini failed:", e instanceof Error ? e.message : e);
    return { url: null, keywords: [query] };
  }
}
