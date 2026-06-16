
export class RedirectService {
  private static readonly MAPPINGS: Record<string, string> = {
    "/poslovi/": "/poslovi",
    "/poslodavci/": "/firme",
    "/gradjevinske-firme/": "/firme",
    "/kontakt/": "/kontakt",
    "/o-nama/": "/o-nama",
    "/magazin/": "/magazin",
    "/masine/": "/masine",
    "/nekretnine/": "/nekretnine",
    "/majstori/": "/majstori",
    "/smestaj/": "/smestaj",
    "/ketering/": "/ketering",
    "/alati/": "/alati",
    "/oglasi/": "/pretraga",
    "/login/": "/auth/login",
    "/register/": "/auth/register",
  };

  private static readonly PREFIX_MAPPINGS: Record<string, string> = {
    "/lokacija/": "/poslovi/",
    "/delatnost/": "/poslovi/",
    "/poslodavac/": "/firma/",
    "/category/": "/magazin/",
    "/kategorija/": "/magazin/",
    "/tag/": "/magazin/",
    "/author/": "/magazin/",
  };

  /**
   * Evaluates if a path needs redirection based on legacy WP patterns.
   * Returns the new path or null if no redirect is needed.
   */
  static getRedirectPath(path: string): string | null {
    // Normalization: strip protocol, host (if any), and ensure trailing slash handled
    const target = path.toLowerCase();
    
    // Exact matches (including with/without trailing slash)
    const exactMatch = this.MAPPINGS[target] || this.MAPPINGS[target + "/"];
    if (exactMatch && exactMatch !== target && exactMatch !== target + "/") return exactMatch;

    // Prefix matches (e.g., /lokacija/beograd/ -> /poslovi/beograd)
    for (const [prefix, newPrefix] of Object.entries(this.PREFIX_MAPPINGS)) {
      if (target.startsWith(prefix)) {
        let slug = target.substring(prefix.length);
        // Remove trailing slash from slug
        if (slug.endsWith("/")) slug = slug.slice(0, -1);
        return newPrefix + slug;
      }
    }

    // Special case for old job detail: /poslovi/some-slug/
    // Since we don't have a 1:1 ID mapping for old ads, we redirect them to the general list
    // to preserve PageRank but avoid 404s for the 30 ads that might be gone.
    if (target.startsWith("/poslovi/") && target.length > 9) {
        // If it's not a known P-SEO pattern (handled by Prefix mappings if they matched, but /poslovi/ is not in prefix)
        // we redirect old deep links to the main hub.
        return "/poslovi";
    }

    return null;
  }
}
