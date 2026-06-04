/**
 * Search Utilities for Firestore "Full-Text" Simulation
 */

/**
 * Generates an array of search keywords from various fields.
 * Includes lowercase tokens, and prefix matching tokens.
 */
export function generateSearchKeywords(text: string | (string | undefined)[]): string[] {
  const combined = Array.isArray(text) 
    ? text.filter(Boolean).join(' ') 
    : text || '';
    
  if (!combined) return [];

  // Normalize and split by non-alphanumeric characters
  const tokens = combined
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2);

  const keywords = new Set<string>();
  
  tokens.forEach(token => {
    keywords.add(token);
    // Add prefix matches for simple "start-with" type searching (optional, can grow index size)
    // for (let i = 2; i <= Math.min(token.length, 10); i++) {
    //   keywords.add(token.substring(0, i));
    // }
  });

  return Array.from(keywords);
}
