import express from "express";
import { db } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";

const router = express.Router();

router.use((req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600");
  }
  next();
});

// L1 Memory Cache for Global Feed (30 seconds)
let l1FeedCache: { data: any; expires: number } | null = null;

router.get("/", async (req, res) => {
  const cacheKey = "global:feed:unified";
  const now = Date.now();

  // 1. Check L1 Memory Cache (30s)
  if (l1FeedCache && now < l1FeedCache.expires) {
    return res.json(l1FeedCache.data);
  }

  try {
    // 2. Check L2 Redis Cache (10 minutes)
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      l1FeedCache = { data: cached, expires: now + 30000 };
      return res.json(cached);
    }

    // 3. Cold Path: Unified Fetch
    const [listings, events] = await Promise.all([
      db.collection("listings").where("status", "==", "active").orderBy("createdAt", "desc").limit(10).get(),
      db.collection("events").orderBy("createdAt", "desc").limit(5).get()
    ]);

    const result = {
      ads: listings.docs.map(d => ({ id: d.id, ...d.data() })),
      news: events.docs.map(d => ({ id: d.id, ...d.data() })),
      timestamp: now
    };

    // Store in L2 (10m) and L1 (30s)
    await CacheService.set(cacheKey, result, 10 * 60 * 1000);
    l1FeedCache = { data: result, expires: now + 30000 };

    res.json(result);
  } catch (error) {
    console.error("[Feed] Unified feed error:", error);
    res.json({ ads: [], news: [], error: "Feed temporarily unavailable" });
  }
});

router.get("/rss/:category", async (req, res) => {
  const { category } = req.params;
  const validCategories = [
    "jobs",
    "companies",
    "machines",
    "plots",
    "accommodations",
    "caterings",
    "marketplace",
  ];

  if (!validCategories.includes(category)) {
    return res.status(404).send("Invalid RSS feed category");
  }

  const cacheKey = `rss:feed:${category}`;

  try {
    const cached = await CacheService.get<string>(cacheKey);
    if (cached) {
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      return res.send(cached);
    }

    const snapshot = await db
      .collection(category)
      .where("status", "in", ["active", "approved"])
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    let itemsXml = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const title = data.title || data.name || data.adTitle || "Oglas";
      const desc = data.description
        ? data.description.substring(0, 200)
        : "Detalji oglasa";
      const date = data.createdAt
        ? new Date(
            data.createdAt.toMillis
              ? data.createdAt.toMillis()
              : data.createdAt,
          ).toUTCString()
        : new Date().toUTCString();

      // Derived canonical mapping
      const typeMapping: Record<string, string> = {
        jobs: "posao",
        companies: "firma",
        plots: "nekretnine",
        machines: "gradjevinske-masine",
        caterings: "ketering-provajder",
        accommodations: "smestaj",
        marketplace: "alat-i-oprema",
      };
      const mappedType = typeMapping[category] || category;
      const url = `https://svetgradjevine.com/${mappedType}/${id}`;

      itemsXml += `
        <item>
            <title><![CDATA[${title}]]></title>
            <link>${url}</link>
            <guid isPermaLink="true">${url}</guid>
            <description><![CDATA[${desc}]]></description>
            <pubDate>${date}</pubDate>
        </item>\n`;
    });

    const feedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>Svet GraÄ‘evine - ${category.toUpperCase()}</title>
    <link>https://svetgradjevine.com</link>
    <description>Najnoviji oglasi iz kategorije ${category}</description>
    <language>sr</language>
    <atom:link href="https://svetgradjevine.com/feed/rss/${category}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
</channel>
</rss>`;

    await CacheService.set(cacheKey, feedXml, 1800000); // 30 minutes cache
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(feedXml);
  } catch (error) {
    console.error(`Error generating RSS feed for ${category}:`, error);
    res.status(500).send("Error generating RSS feed");
  }
});

export default router;

