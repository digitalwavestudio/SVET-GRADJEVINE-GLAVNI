import https from "https";

const pages = [
  "/", "/poslovi", "/poslovi/zidar/beograd", "/poslovi/beograd", "/masine/beograd",
  "/firme", "/gradjevinske-masine", "/smestaj", "/ketering", "/placevi", "/alat-i-oprema",
  "/gradjevinske-masine/bager-xyz",
  "/o-nama", "/kontakt", "/cenovnik",
  "/nepostojeci",
];

function fetchAsBot(path) {
  return new Promise((ok) => {
    const opts = {
      hostname: "svetgradjevine.com",
      path,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
    };
    https.get(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => ok({ path, status: res.statusCode, body: d, size: d.length }));
    }).on("error", (e) => ok({ path, status: "ERR", body: e.message, size: 0 }));
  });
}

async function main() {
  const results = [];
  for (const p of pages) {
    const r = await fetchAsBot(p);
    const h = r.body;
    const hasTitle = h.includes("<title>");
    const hasH1 = h.includes("<h1");
    const hasOgImage = h.includes('og:image');
    const hasCanonical = h.includes('rel="canonical"');
    const hasBreadcrumb = h.includes("BreadcrumbList");
    const hasSerbian = h.includes("Građevine") || h.includes("Građevine");
    const is404 = r.status === 404;
    const hasDescription = h.includes('name="description"');
    
    results.push({
      path: p,
      status: r.status,
      size: r.size,
      title: hasTitle ? "OK" : "MISS",
      h1: hasH1 ? "OK" : "MISS",
      ogImg: hasOgImage ? "OK" : "MISS",
      canon: hasCanonical ? "OK" : "MISS",
      bread: hasBreadcrumb ? "OK" : "MISS",
      srpski: hasSerbian ? "OK" : "CORRUPT",
      desc: hasDescription ? "OK" : "MISS",
      is404: is404 ? "404" : "",
    });
  }
  console.log("Path".padEnd(38) + "St  Size  T  H1 OG  Ca  Br  SR  De");
  console.log("-".repeat(75));
  for (const r of results) {
    console.log(
      r.path.padEnd(38) +
      (""+r.status).padStart(3) + " " +
      (""+r.size).padStart(5) + " " +
      r.title.padEnd(2) + " " +
      r.h1.padEnd(3) + " " +
      r.ogImg.padEnd(3) + " " +
      r.canon.padEnd(3) + " " +
      r.bread.padEnd(3) + " " +
      r.srpski.padEnd(3) + " " +
      r.desc.padEnd(3) +
      (r.is404 ? " " + r.is404 : "")
    );
  }

  // Check Serbian chars in key pages
  console.log("\n=== Serbian char check ===");
  for (const p of ["/", "/poslovi", "/o-nama", "/gradjevinske-masine"]) {
    const r = await fetchAsBot(p);
    const h = r.body;
    const titleMatch = h.match(/<title>(.*?)<\/title>/);
    if (titleMatch) console.log(p + " → title: " + titleMatch[1]);
  }
}
main().catch(console.error);
