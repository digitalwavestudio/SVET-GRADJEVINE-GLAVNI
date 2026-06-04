import { Logger } from "../utils/logger.ts";

export interface InternalLinkSuggestion {
  keyword: string;
  label: string;
  url: string;
  category: string;
}

export class InternalLinkingService {
  private static logger = new Logger({ service: "InternalLinkingService" });

  // Dictionary of keywords to marketplace routes
  // Focusing on high-intent keywords to drive conversions
  private static readonly KEYWORD_MAP: Record<string, { label: string; url: string; category: string }> = {
    "posao": { label: "Oglasi za Posao", url: "/poslovi", category: "jobs" },
    "zaposlenje": { label: "Svi oglasi za Posao", url: "/poslovi", category: "jobs" },
    "radnik": { label: "Pronađite radnike", url: "/poslovi", category: "jobs" },
    "plata": { label: "Ponude poslova", url: "/poslovi", category: "jobs" },
    
    "masin": { label: "Građevinske Mašine", url: "/masine", category: "machines" },
    "bager": { label: "Bageri - Iznajmljivanje i Prodaja", url: "/masine", category: "machines" },
    "kran": { label: "Dizalice i Kranovi", url: "/masine", category: "machines" },
    "kamion": { label: "Transport i Kamioni", url: "/masine", category: "machines" },
    
    "smestaj": { label: "Smeštaj za radnike", url: "/smestaj", category: "accommodations" },
    "stanovan": { label: "Ponuda smeštaja", url: "/smestaj", category: "accommodations" },
    "krevet": { label: "Sobe i ležajevi", url: "/smestaj", category: "accommodations" },
    
    "ketering": { label: "Ketering za gradilišta", url: "/ketering", category: "caterings" },
    "obrok": { label: "Ishrana radnika", url: "/ketering", category: "caterings" },
    "hrana": { label: "Dostava hrane", url: "/ketering", category: "caterings" },
    
    "plac": { label: "Placevi i zemljišta", url: "/placevi", category: "plots" },
    "zemljiste": { label: "Prodaja zemljišta", url: "/placevi", category: "plots" },
    
    "majstor": { label: "Pronađite Majstora", url: "/majstori", category: "masters" },
    "keramicar": { label: "Keramičari - Ponuda", url: "/majstori", category: "masters" },
    "moler": { label: "Molerski radovi", url: "/majstori", category: "masters" },
    "električar": { label: "Elektroinstalateri", url: "/majstori", category: "masters" },
    "vodoinstalater": { label: "Vodoinstalaterske usluge", url: "/majstori", category: "masters" },
    
    "firma": { label: "Građevinske firme", url: "/firme", category: "companies" },
    "preduzeće": { label: "Spisak firmi", url: "/firme", category: "companies" },
    
    "materijal": { label: "Građevinski materijal", url: "/marketplace", category: "marketplace" },
    "alat": { label: "Mašine i alati", url: "/marketplace", category: "marketplace" },
    "prodaja": { label: "Marketplace prodaja", url: "/marketplace", category: "marketplace" },
  };

  /**
   * Scans text for keywords and returns a list of suggested internal links
   * Limited to a specific range (3-5) as requested
   */
  static async getSuggestionsForText(text: string, limit = 5): Promise<InternalLinkSuggestion[]> {
    if (!text) return [];
    
    const lowerText = text.toLowerCase();
    const suggestions: InternalLinkSuggestion[] = [];
    const seenUrls = new Set<string>();

    for (const [keyword, config] of Object.entries(this.KEYWORD_MAP)) {
      if (lowerText.includes(keyword)) {
        if (!seenUrls.has(config.url)) {
          suggestions.push({
            keyword,
            ...config
          });
          seenUrls.add(config.url);
        }
      }
      
      if (suggestions.length >= limit) break;
    }

    return suggestions;
  }
}
