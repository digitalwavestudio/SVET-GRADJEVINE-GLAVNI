import { GoogleGenAI, Type } from "@google/genai";
import { Article } from "../../src/types/magazine.ts";

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn('[MagazineAIService] GEMINI_API_KEY missing, AI functions disabled.');
}

export class MagazineAIService {
  /**
   * Generates SEO title (H1) and meta description variants for an article
   */
  static async generateSEOVariants(article: Partial<Article>) {
    if (!ai) {
        console.warn("[MagazineAIService] AI client not initialized, skipping AI SEO generation");
        return null;
    }

    try {
      const prompt = `Analiziraj sledeći članak i generiši 3 varijante optimizovanog SEO naslova (H1) i 3 varijante meta opisa.
      Naslovi treba da budu privlačni (click-worthy) ali profesionalni, prilagodjeni gradjevinskoj industriji u Srbiji.
      Meta opisi treba da sadrže ključne reči i poziv na akciju.
      
      Članak:
      Naslov: ${article.title}
      Izvod: ${article.excerpt}
      Sadržaj: ${article.content?.substring(0, 2000)}...`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              variants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    seoTitle: { type: Type.STRING },
                    metaDescription: { type: Type.STRING }
                  },
                  required: ["seoTitle", "metaDescription"]
                }
              }
            },
            required: ["variants"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result.variants as { seoTitle: string; metaDescription: string }[];
    } catch (err) {
      console.error("[MagazineAIService] AI Generation error:", err);
      return null;
    }
  }

  /**
   * Generates a complete high-quality, professional article based on topic, category, tone, and length
   */
  static async generateFullArticle(options: {
    topic: string;
    category: string;
    tone: "strucan" | "edukativan" | "novinarski" | "promotivni" | string;
    approximateLength: number;
  }) {
    if (!ai) {
        console.warn("[MagazineAIService] AI client not initialized, skipping AI Article generation");
        return null;
    }

    const { topic, category, tone, approximateLength } = options;

    try {
      const toneDescriptions: Record<string, string> = {
        strucan: "izrazito tehnički, naučni, inženjerski i stručan stil sa tačnim terminima iz građevinarstva, mašinstva ili arhitekture",
        edukativan: "edukativan, pristupačan ali visokostručan stil koji detaljno objašnjava koncepte i daje praktične savete",
        novinarski: "izbalansiran, informativan i objektivan novinarski stil sa analizom tržišta i citatima",
        promotivni: "PR i marketinški stil fokusiran na prednosti, rešenja, vizuelni utisak i poziv na akciju"
      };

      const selectedTone = toneDescriptions[tone] || toneDescriptions.strucan;

      const prompt = `Ti si glavni urednik i vrhunski inženjer građevinarstva za vodeći portal "Svet Građevine".
      Napiši kompletan, visoko kvalitetan i profesionalan članak na sledeću temu:
      Tema: "${topic}"
      Kategorija: "${category}"
      Stil/Ton: ${selectedTone}
      Ciljana dužina: oko ${approximateLength} reči.

      ZAHTEVI ZA PISANJE SADRŽAJA:
      1. Članak mora biti na srpskom jeziku (latinica).
      2. Razrađena detaljna inženjerska i tehnička stručna analiza sa podnaslovima (H2, H3), listama, zvezdicama i naglašenim elementima u bogatom Markdown formatu.
      3. Koristi pasuse od najviše 3-4 rečenice za bolju čitljivost na mobilnim uređajima i desktopu.
      4. Sadržaj mora biti koristan i praktičan za inženjere, izvođače radova, majstore, investitore ili ljubitelje arhitekture.
      5. Pisanje mora biti originalno, bez ponavljanja rečenica ili generičkih fraza bez vrednosti.
      
      POTREBNI PARAMETRI U ODGOVORU:
      - title: Privlačan, stručan, SEO-optimizovan naslov (H1) na srpskom jeziku.
      - excerpt: Kratak izvod / sinopsis od 120 do 160 karaktera koji privlači pažnju i opisuje suštinu članka.
      - content: Kompletan prelepo strukturisan tekst članka u punom Markdown formatu sa H2 i H3 naslovima, listama (bullet points), i podebljanim ključnim rečima.
      - tags: Niz od 4-6 relevantnih, pretraživih tagova / ključnih reči (svaka reč odvojeno).
      - seoTitle: Idealan SEO meta naslov dužine između 50 i 65 karaktera za Google pretragu.
      - metaDescription: Savršen Google meta opis dužine između 120 i 150 karaktera sa pozivom na akciju.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              seoTitle: { type: Type.STRING },
              metaDescription: { type: Type.STRING }
            },
            required: ["title", "excerpt", "content", "tags", "seoTitle", "metaDescription"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result as {
        title: string;
        excerpt: string;
        content: string;
        tags: string[];
        seoTitle: string;
        metaDescription: string;
      };
    } catch (err) {
      console.error("[MagazineAIService] Full article generation error:", err);
      return null;
    }
  }
}
