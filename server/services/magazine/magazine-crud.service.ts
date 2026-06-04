// @ts-nocheck
import { db, admin } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { Article, ArticleStatus } from "../../../src/types/magazine.ts";
import { syncArticlesToIndex } from "../algolia.service.ts";
import {
  InternalLinkingService,
  InternalLinkSuggestion,
} from "../internal-linking.service.ts";
import { ImageTransformer } from "../../utils/image.transformer.ts";

export class MagazineCrudService {
  public static readonly COLLECTION = "articles";

  // L1 RAM Shield (Protecting both Redis and Firestore from thundering herd)
  public static l1ShieldCache = new Map<
    string,
    { data: unknown; expiry: number }
  >();
  public static readonly L1_SHIELD_TTL = 60 * 1000; // 1 minut hard RAM cache

  /**
   * Creates a new article with outbox consistency (Enterprise Pattern)
   */
  static async createArticle(data: Partial<Article>) {
    const id = data.id || db.collection(this.COLLECTION).doc().id;
    const articleRef = db.collection(this.COLLECTION).doc(id);
    const outboxRef = db.collection("outbox").doc();

    await db.runTransaction(async (transaction) => {
      // 1. Write the Article
      transaction.set(articleRef, {
        ...data,
        id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0,
        status: data.status || ArticleStatus.DRAFT,
      });

      // 2. Write to Outbox for asynchronous tasks (AI SEO, Algolia, Notifications)
      transaction.set(outboxRef, {
        type: "ARTICLE_CREATED",
        payload: { id, ...data },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        version: "1.0",
      });

      // 3. Update global counts (Meta aggregation)
      const metadataRef = db.doc("metadata/magazine_stats");
      transaction.set(
        metadataRef,
        {
          totalArticles: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    // Invalidate cache
    this.l1ShieldCache.clear();
    await CacheService.invalidateByPrefix("magazine_list_");

    if (data.status === ArticleStatus.SCHEDULED && data.scheduledAt) {
      const { CloudTasksService } = await import("../cloud-tasks.service.ts");
      await CloudTasksService.scheduleArticlePublication(id, new Date(data.scheduledAt._seconds * 1000));
    }

    return id;
  }

  /**
   * Fetches articles with pagination and caching
   */
  static async getArticles(
    options: {
      category?: string;
      limit?: number;
      startAfter?: FirebaseFirestore.DocumentSnapshot;
      status?: ArticleStatus;
    } = {},
  ) {
    const {
      category,
      limit = 12,
      startAfter,
      status = ArticleStatus.PUBLISHED,
    } = options;

    let docId = startAfter;
    if (startAfter && typeof startAfter === "string") {
      if (startAfter.startsWith("{") || startAfter.startsWith("ey")) {
        try {
          let decoded = startAfter;
          if (startAfter.startsWith("ey")) {
            decoded = Buffer.from(startAfter, "base64").toString("utf-8");
          }
          const parsed = JSON.parse(decoded);
          docId = parsed.lastId || parsed.id || startAfter;
        } catch (e) {
          // Fallback to raw ID
        }
      }
    }

    // Unique cache key per cursor to prevent page caching collision
    const cleanCursor =
      startAfter && typeof startAfter === "string"
        ? startAfter.replace(/[^a-zA-Z0-9]/g, "").slice(-30)
        : "1";
    const cacheKey = `magazine_list_${category || "all"}_${limit}_${cleanCursor}`;

    // L1 Shield Check
    const now = Date.now();
    const shield = this.l1ShieldCache.get(cacheKey);
    if (shield && now < shield.expiry) return shield.data as T;

    const data = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        let query = db
          .collection(this.COLLECTION)
          .where("status", "==", status)
          .orderBy("publishedAt", "desc")
          .limit(limit)
          .select("title", "categoryId", "category", "slug", "thumbnail", "authorId", "publishedAt", "status", "excerpt", "viewsCount", "authorName", "authorAvatar");

        if (category) {
          query = query.where("category", "==", category);
        }

        if (docId) {
          const { checkQuotaStatus } = await import("../../config/firebase.ts");
          
          if (checkQuotaStatus()) {
             // Skip cursor when quota is exhausted to prevent secondary timeouts
             query = query.limit(limit);
          } else {
             const doc = await db.collection(this.COLLECTION).doc(docId).get();
             if (doc.exists) {
               query = query.startAfter(doc);
             }
          }
        }

        let snapshot = await query.get();
        if (snapshot.empty && !startAfter) {
          // Check if collection is entirely empty of articles
          const checkAll = await db.collection(this.COLLECTION).limit(1).get();
          if (checkAll.empty) {
            await this.seedDefaultArticles();
            snapshot = await query.get();
          }
        }

        return snapshot.docs.map((doc) =>
          ImageTransformer.transformDocumentImages({
            id: doc.id,
            ...doc.data(),
          }),
        );
      },
      60 * 60 * 1000, // In the new architecture, we permit 60 min SWR for news
      [], // Fallback value
    );

    // Update L1
    this.l1ShieldCache.set(cacheKey, {
      data,
      expiry: now + this.L1_SHIELD_TTL,
    });
    return data;
  }

  /**
   * Fetches a single article by slug
   */
  static async getArticleBySlug(
    slug: string,
  ): Promise<(Article & { suggestions?: InternalLinkSuggestion[] }) | null> {
    const cacheKey = `article_slug_${slug}`;

    // L1 Shield Check
    const now = Date.now();
    const shield = this.l1ShieldCache.get(cacheKey);
    if (shield && now < shield.expiry) return shield.data as T;

    const data = await CacheService.getOrSetSWR<
      (Article & { suggestions?: InternalLinkSuggestion[] }) | null
    >(
      cacheKey,
      async () => {
        let snapshot = await db
          .collection(this.COLLECTION)
          .where("slug", "==", slug)
          .where("status", "==", ArticleStatus.PUBLISHED)
          .limit(1)
          .get();

        if (snapshot.empty) {
          // Check if collection is entirely empty
          const checkAll = await db.collection(this.COLLECTION).limit(1).get();
          if (checkAll.empty) {
            await this.seedDefaultArticles();
            snapshot = await db
              .collection(this.COLLECTION)
              .where("slug", "==", slug)
              .where("status", "==", ArticleStatus.PUBLISHED)
              .limit(1)
              .get();
          }
        }

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        const article = ImageTransformer.transformDocumentImages({
          id: doc.id,
          ...doc.data(),
        }) as Article;

        // ENTERPRISE SEO: Automatic Internal Linking
        // We scan the content and title for keywords to find related marketplace links
        const suggestions = await InternalLinkingService.getSuggestionsForText(
          `${article.title} ${article.excerpt} ${article.content}`,
          5, // agreed limit 3-5
        );

        return { ...article, suggestions };
      },
      24 * 60 * 60 * 1000, // Very long SWR for single articles (24h) - we invalidate on edit
      null, // Fallback value
    );

    // Update L1
    this.l1ShieldCache.set(cacheKey, {
      data,
      expiry: now + this.L1_SHIELD_TTL,
    });
    return data;
  }

  public static async seedDefaultArticles() {
    console.log("[MagazineCrudService] Seeding default articles...");
    const rawArticles = [
      {
        id: "curated-1",
        title:
          "Generativni AI i BIM: Kako algoritmi optimizuju statički proračun u realnom vremenu",
        slug: "generativni-ai-bim-statiski-proracun",
        excerpt:
          "Veštačka inteligencija više nije samo teorijski koncept. Najnoviji BIM softveri samostalno predlažu optimalne armaturne mreže i smanjuju potrošnju čelika za čak 18%.",
        featuredImage:
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop",
        category: "gradjevina",
        status: "published",
        authorName: "dr Milan Vujović",
        readingTime: 6,
        viewCount: 1542,
        tags: [
          "BIM",
          "Generativni AI",
          "Inženjering",
          "Optimizacija",
          "Statika",
        ],
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        content: `
          <p>Uvođenje generativnog dizajna zasnovanog na algoritmima veštačke inteligencije (AI) u građevinarstvo predstavlja najveći tehnološki skok od prelaska sa klasičnog crtanja na CAD sisteme. Tradicionalno projektovanje i proračuni statike oslanjali su se na manuelno postavljanje konstrukcije, nakon čega su inženjeri radili iterativne provere napona i deformacija u FEM (Finite Element Method) softverima. To je proces koji često traje nedeljama i ostavlja vrlo malo vremena za istraživanje alternativnih, ekonomičnijih geometrijskih oblika objekta.</p>
          <p>Danas, najsavremeniji BIM softverski paketi opremljeni generativnim algoritmima menjaju taj proces iz korena. Koristeći parametarske podatke o opterećenju, klimatskim zonama i građevinskim propisima, AI može samostalno generisati hiljade različitih strukturnih rešenja za samo nekoliko minuta. Algoritmi automatski vrše proračune raspodele sila i predlažu optimalne dimenzije betonskih stubova, čeličnih greda i temelja tiskajući ih ka apsolutnom inženjerskom i ekonomskom optimumu.</p>
          <p>Ovakva automatska optimizacija ne samo da štedi sate rada inženjerima, već ima i ogroman direktan uticaj na finansijsku isplativost projekata. Testiranjem u realnom vremenu na nekoliko referentnih višespratnica u Evropskoj uniji, generativni algoritmi su uspeli da smanje potrošnju konstruktivnog armaturnog čelika za čak 18%, dok je količina livenog betona smanjena za prosečno 12%, a sve to uz besprekorno ispunjavanje svih Eurocode sigurnosnih standarda za seizmičku i statičku stabilnost.</p>
          <p>U narednoj fazi razvoja, planira se povezivanje generativnih modela direktno sa IoT senzorima sa gradilišta. Na taj način će se obezbediti dinamički povratni krug podataka pomoću koga će statički proračuni moći automatski da se rekalibrišu ukoliko dođe do minimalnih odstupanja u kvalitetu isporučenih sirovina, čime će se obezbediti apsolutni nivo sigurnosti tokom izvođenja najkompleksnijih arhitektonskih projekata današnjice.</p>
        `,
      },
      {
        id: "curated-2",
        title:
          "3D štampani beton: Prvi stambeni kvart u Minhenu sa nultom stopom otpada",
        slug: "3d-stampani-beton-stambeni-kvart-minhen",
        excerpt:
          "Najveći evropski projekat aditivne proizvodnje u građevinarstvu ulazi u finalnu fazu. Istražujemo mehanička svojstva novih geopolimernih veziva.",
        featuredImage:
          "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop",
        category: "gradjevina",
        status: "published",
        authorName: "Redakcija",
        readingTime: 5,
        viewCount: 984,
        tags: ["3D štampa", "Beton", "Ekologija", "Minhen", "Geopolimeri"],
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        content: `
          <p>Aditivna proizvodnja unutar građevinskog sektora postepeno prerasta u dominantnu industrijsku metodologiju. Korišćenje 3D printera za postavljanje konstruktivnih zidova direktno eliminira potrebu za klasičnom drvenom ili metalnom oplatom, što automatski skraćuje vreme izvođenja građevinskih radova na gradilištu za čak 60% i štedi značajne materijalne resurse.</p>
          <p>Najbolji pokazatelj ovog trenda je novi pionirski stambeni kvart u severnom delu Minhena, gde se celokupna nadzemna struktura zgrada izvodi pomoću robota sa portalnim vođenjem za nanošenje betonske smeše. Inženjeri su za ovaj projekat razvili posebnu ekološku formulaciju geopolimernog veziva koja kombinuje industrijski pepeo i zguru, u potpunosti eliminišući upotrebu običnog Portland cementa i time smanjujući emisiju ugljen-dioksida za fantastičnih 70%.</p>
          <p>Mehanička ispitivanja sakupljenih uzoraka dokazala su da 3D štampani zidovi poseduju izuzetne strukturne karakteristike, visoku čvrstoću na pritisak i poboljšanu termičku izolaciju usled unutrašnjih vazdušnih komora unutar štampane geometrije. Projektni biroi širom Nemačke već razmatraju uvrštavanje ove metode u standardne stambene module za sledeću godinu.</p>
          <p>Nulta stopa građevinskog otpada na minhenskom gradilištu predstavlja ključni iskorak za cirkularnu ekonomiju. Svi ostaci procesa nanošenja mogu se neposredno samleti i vratiti u rezervoar štampača u toku istog dana, pružajući izvođačima radova neprevaziđenu ekološku i ekonomsku dobit u poređenju sa monolitnim livenjem.</p>
        `,
      },
      {
        id: "curated-3",
        title:
          "Senzorska mreža na mostu Gazela: Implementacija IoT sistema za rano otkrivanje zamora materijala",
        slug: "senzorska-mreza-gazela-iot-sistem-zamor-materijala",
        excerpt:
          "Postavljanje preko 150 optičkih senzora omogućilo je mikronsko praćenje vibracija i napona konstrukcije pod punim saobraćajnim opterećenjem.",
        featuredImage:
          "https://images.unsplash.com/photo-1545558014-868d57f0f2f5?q=80&w=800&auto=format&fit=crop",
        category: "gradjevina",
        status: "published",
        authorName: "dr Milan Vujović",
        readingTime: 8,
        viewCount: 2011,
        tags: [
          "Most Gazela",
          "Senzori",
          "IoT",
          "Strukturni monitoring",
          "Inženjering",
        ],
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        content: `
          <p>Gazela, kao najprometniji mostni objekat u Republici Srbiji, svakodnevno trpi ogromna dinamička saobraćajna opterećenja od preko 120.000 vozila. Kako bi se obezbedila dugoročna strukturna stabilnost i na vreme uočile nevidljive mikropukotine unutar čeličnih sandučastih nosača, postavljen je najnoviji integrisani inženjerski ekosistem baziran na distribuiranoj senzorskoj mreži.</p>
          <p>Sistem se sastoji od preko 150 fiber-optičkih senzora sa Bragg-ovom rešetkom (FBG) raspoređenih po najkritičnijim zonama zatezanja i ugiba mosta. Ovi uređaji prenose spektralne promene svetlosti do centralnog procesora, beležeći i najmanja relativna istezanja metala sa preciznošću od jednog mikrona u realnom vremenu pod uticajem vetra, temperature i teretnih vozila.</p>
          <p>Pored optičkih instrumenata, instalirano je i 12 seizmičkih senzora u samim temeljima stubova mosta kako bi se pratilo prenošenje rezonantnih frekvencija kroz tlo. Kombinacija ovih podataka generiše digitalni blizanac (Digital Twin) mosta koji pruža izvođačima i inženjerima detaljan profil strukturnog "zdravlja" bez potrebe za obustavom saobraćaja radi redovnih fizičkih inspekcija.</p>
          <p>Instalacija je pokazala da primena naprednog IoT monitoringa produžava vek trajanja mostne konstrukcije za oko 15 godina smanjujući troškove sanacije. Algoritam veštačke inteligencije na serveru šalje automatska upozorenja nadležnim inspekcijama čim se detektuju nagla odstupanja od normalnog stanja konstrukcije.</p>
        `,
      },
      {
        id: "curated-4",
        title:
          "Minimalizam i brutalizam u modernoj stanogradnji: Estetika sirovog betona na Novom Beogradu",
        slug: "minimalizam-brutalizam-moderna-stanogradnja-novi-beograd",
        excerpt:
          "Analiza novih rezidencijalnih objekata koji revitalizuju nasleđe beogradske škole brutalizma kroz savremene materijale i prostrane fasadne sisteme.",
        featuredImage:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
        category: "arhitektura",
        status: "published",
        authorName: "arh. Jelena Kovačević",
        readingTime: 7,
        viewCount: 1240,
        tags: [
          "Novi Beograd",
          "Brutalizam",
          "Arhitektura",
          "Stanogradnja",
          "Sirovi beton",
        ],
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        content: `
          <p>Arhitektonsko nasleđe Novog Beograda obeleženo je posleratnom izgradnjom masivnih stambenih blokova u stilu brutalizma, karakterističnog po monumentalnim fasadama od natur-betona. Iako se ovaj stil decenijama smatrao isključivo funkcionalnim i simplifikovanim, savremeni projektni biroi danas prepoznaju njegovu duboku iskrenost forme i ponovo oživljavaju estetiku sirovih materijala kroz luksuzne stambene objekte.</p>
          <p>Novi rezidencijalni kompleksi uspešno integrišu elemente sirovog betona sa prostranim staklenim fasadama, aluminijumskim profilima i prirodnim kamenom. Sinergija ovih grubo obrađenih i modernih poliranih materijala pruža unutrašnjim prostorima rafiniranu industrijsku eleganciju, koja privlači posebnu pažnju kupaca na trenutno prezasićenom domaćem tržištu nekretnina.</p>
          <p>Zahvaljujući visoko preciznim poliuretanskim i silikonskim kalupima za oplate, moderna građevinska tehnologija omogućava postizanje savršeno glatkih tekstura na monolitnim betonskim zidovima bez deformacija. Ovi zidovi ostaju neomalterisani, a nakon skidanja oplate tretiraju se specijalnim transparentnim hidrofobnim premazima koji ističu prirodne šare i štite fasadu od atmosferskih uticaja.</p>
          <p>Estetika betona prestaje da bude simbol hladnih stambenih blokova i postaje esencijalni obeleživač luksuzne autorske arhitekture Novog Beograda. Savremeni stanari više ne teže prekrivanju strukturnih elemenata, već slavljenju inženjerske iskrenosti i skulpturalnog doprinosa samog konstruktivnog sistema.</p>
        `,
      },
      {
        id: "curated-5",
        title:
          "Revitalizacija industrijskih zona: Kako napuštene fabrike postaju poslovni centri A klase",
        slug: "revitalizacija-industrijskih-zona-napustene-fabrike",
        excerpt:
          "Konverzija industrijskog nasleđa predstavlja ogroman inženjerski izazov. Predstavljamo uspešne studije slučaja iz Berlina, Beča i Beograda.",
        featuredImage:
          "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
        category: "arhitektura",
        status: "published",
        authorName: "arh. Jelena Kovačević",
        readingTime: 6,
        viewCount: 840,
        tags: [
          "Urbanizam",
          "Industrijsko nasleđe",
          "Konverzija",
          "Beograd",
          "A klasa",
        ],
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        content: `
          <p>Umetnost reurbanizacije i davanja novog života starim industrijskim objektima predstavlja jedan od najsloženijih zadataka savremene arhitekture i inženjerstva. Napušteni pogoni, livnice i skladišta građena početkom dvadesetog veka poseduju izdašnu spratnu visinu i masivne konstruktivne rastere koji se uz pažljivu sanaciju mogu pretvoriti u vrhunski kancelarijski prostor.</p>
          <p>Najveći inženjerski izazovi tokom ovih konverzija obuhvataju detaljnu statičku sanaciju čeličnih i armiranobetonskih elemenata, uklanjanje tragova teških metala iz tla (remedijacija zemljišta) i ugradnju savremenih termotehničkih sistema (KGH) koji moraju obezbediti energetsku efikasnost objekta bez narušavanja istorijskog izgleda originalnih fasada.</p>
          <p>Uspešni primeri iz referentnih evrops metropola pokazuju da ovakvi prostori dostižu najviše cene zakupa, pošto nude jedinstven vizuelni karakter koji privlači IT kompanije i svetske B2B korporacije. Beogradski projekti poput nekadašnje fabrike piva ili tekstilne industrije predstavljaju svetle primere kako se istorijski lokaliteti mogu sačuvati i ekonomski opravdati.</p>
          <p>Kombinovanje originalne opeke sa minimalističkim čeličnim stepeništima i staklenim panoramama zadržava šarm prohujalog vremena, dok istovremeno ispunjava najstrože standarde zelene gradnje (LEED i BREEAM sertifikati), dokazujući da održivost i estetika idu ruku pod ruku.</p>
        `,
      },
      {
        id: "curated-6",
        title:
          "Budućnost fasadnih sistema: Kinetičke fasade koje same optimizuju insolaciju i potrošnju energije",
        slug: "buducnost-fasadnih-sistema-kineticke-fasade-insolacija",
        excerpt:
          "Kinetički paneli kontrolisani centralnim nadzornim sistemom menjaju ugao u zavisnosti od položaja sunca, smanjujući troškove hlađenja za 40%.",
        featuredImage:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
        category: "arhitektura",
        status: "published",
        authorName: "Redakcija",
        readingTime: 5,
        viewCount: 1105,
        tags: [
          "Fasade",
          "Kinetička arhitektura",
          "Insolacija",
          "Energetska efikasnost",
          "Zelena gradnja",
        ],
        publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        content: `
          <p>Današnji objekti visoke gradnje se suočavaju sa ozbiljnim problemima pregrevanja usled ogromnih staklenih površina koje propuštaju sunčevu toplotu tokom letnjih meseci. Rešenje više ne leži u ugradnji sve snažnijih čilera i rashladnih sistema, već u adaptivnim "živim" fasadama koje dinamički sarađuju sa lokalnim mikroklimatima.</p>
          <p>Kinetički fasadni sistemi sastoje se od senzorske mreže i stotina nezavisnih, motorizovanih aluminijumskih ili kompozitnih panela. Centralni sistem upravljanja zgradom (BMS) koristi složene meteorološke podatke da u realnom vremenu proračuna najbolji ugao zakretanja svakog panela, obezbeđujući maksimalnu prirodnu insolaciju unutrašnjeg prostora bez prekomernog grejanja.</p>
          <p>Studije izvedene na poslovnim oblakoderima u Seulu i Abu Dabiju potvrdile su da primena ove napredne tehnologije smanjuje potrošnju električne energije za hlađenje enterijera za neverovatnih 40%. Paneli se automatski zatvaraju kako sunce prelazi preko neba, blokirajući direktan upad neželjenih svetlosnih i toplotnih zraka.</p>
          <p>Investicija u složeni kinetički sistem se isplaćuje u roku od samo sedam godina kroz smanjenje računa za struju i produženje životnog veka rashladne opreme. Pored inženjerske upotrebne vrednosti, ove fasade stvaraju dinamične, hipnotišuće vizuelne efekte na spoljašnjosti zgrada, menjajući izgled objekta iz sata u sat.</p>
        `,
      },
      {
        id: "curated-7",
        title:
          "Elektromobilnost na gradilištu: Prvi potpuno električni bageri od 20 tona stupaju na scenu",
        slug: "elektromobilnost-gradiliste-elektricni-bageri-20-tona",
        excerpt:
          "Poređenje operativnih troškova dizel i baterijskih hidrauličnih bagera. Prednosti nulte emisije i ekstremno niskog nivoa buke u urbanim sredinama.",
        featuredImage:
          "https://images.unsplash.com/photo-1579165466541-71e24090a2cf?q=80&w=800&auto=format&fit=crop",
        category: "vesti",
        status: "published",
        authorName: "Redakcija",
        readingTime: 6,
        viewCount: 712,
        tags: [
          "Elektromobilnost",
          "Građevinske mašine",
          "Bageri",
          "Ekologija",
          "Urbana gradilišta",
        ],
        publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        content: `
          <p>Teška građevinska mehanizacija tradicionalno je prepoznata kao ogroman proizvođač štetnih gasova i neprijatne komunalne buke u gradovima. Sa uvođenjem prvih serijskih, potpuno električnih hidrauličnih bagera radne mase od 20 tona, započela je radikalna transformacija i elektrifikacija modernih gradskih gradilišta.</p>
          <p>Ove inovativne mašine opremljene su velikim litijum-gvozdeno-fosfatnim (LFP) baterijama energetskog kapaciteta do 300 kWh, koje omogućavaju nesmetan rad od 8 punih radnih sati pri standardnom ciklusu iskopavanja. Odsustvo dizel motora u potpunosti uklanja direktne CO2 emisije i dramatično smanjuje zagađenje vazduha česticama u gusto naseljenim zonama.</p>
          <p>Pored ekoloških prednosti, detaljno finansijsko poređenje troškova pokazalo je da električni bageri donose impresivne operativne uštede. Troškovi električne energije za punjenje baterija su i do 70% niži od troškova dizel goriva za isti broj radnih sati, dok odsustvo motornog ulja, filtera, turbine i izduvnog sistema smanjuje troškove održavanja za polovinu.</p>
          <p>Ekstremno nizak nivo buke takođe predstavlja ključnu inženjersku prednost u naseljenim delovima gradova. Radovi na iskopu i rušenju sada se mogu obavljati i u kasnim večernjim satima ili rano ujutru bez opasnosti od remećenja javnog reda i kršenja komunalnih odluka, što značajno ubrzava rokove izvođenja projekata.</p>
        `,
      },
      {
        id: "curated-8",
        title:
          "Autonomni damper-kamioni: Kako GPS i LIDAR sistemi eliminišu potrebu za vozačima u kamenolomima",
        slug: "autonomni-damper-kamioni-gps-lidar-kamenolomi",
        excerpt:
          "Praktična analiza bezbednosti i produktivnosti autonomnih transportnih sistema na površinskim kopovima u istočnoj Srbiji.",
        featuredImage:
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop",
        category: "vesti",
        status: "published",
        authorName: "Redakcija",
        readingTime: 6,
        viewCount: 650,
        tags: [
          "Autonomna vozila",
          "Kamioni",
          "LIDAR",
          "Kamenolomi",
          "Sigurnost",
        ],
        publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        content: `
          <p>Površinski kopovi i veliki kamenolomi predstavljaju opasna i monotona radna okruženja u kojima se prevoze hiljade tona jalovine i materijala dnevno. Teški damper-kamioni noseći teret od preko 100 tona kreću se uskim, strmim putevima gde i najmanja nepažnja ili umor vozača može dovesti do kobnih nesreća.</p>
          <p>Uvođenjem potpuno autonomnih sistema transporta, navigisanih naprednim GPS i 3D LIDAR skeniranjem, ljudski faktor je u potpunosti eliminisan iz transportnog lanca. Vozila se samostalno kreću rutama, precizno pronalazeći poziciju bagera za utovar i rampu za istovar materijala bez ikakve asistencije vozača u kabini.</p>
          <p>Zahvaljujući visoko senzitivnim LIDAR senzorima, kamioni mogu bez problema "videti" prepreke na putu, druge mašine ili neočekivane odrone kamenja čak i u uslovima guste prašine, magle i u potpunom mraku. Autonomni kontroler donosi bezbednosne odluke i zaustavlja vozilo u delu sekunde ukoliko detektuje bilo kakvu opasnost.</p>
          <p>Praksa u kamenolomima u istočnoj Srbiji pokazala je da uvođenje autonomnih dampera povećava dnevnu produktivnost za 15%, s obzirom na to da mašine rade bez pauza za smene, toalet i ručak, a istovremeno se potrošnja guma i habanje mehanike svodi na minimum zbog savršeno konstantnih ubrzanja i kočenja.</p>
        `,
      },
      {
        id: "curated-9",
        title:
          "Hibridni pogonski sistemi kod autodizalica: Smanjenje potrošnje goriva pri podizanju ekstremnih tereta",
        slug: "hibridni-pogonski-sistemi-autodizalice-ekstremni-tereti",
        excerpt:
          "Analiza novih Liebherr i Tadano sistema koji koriste kinetičku energiju spuštanja tereta za skladištenje električne energije u superkondenzatorima.",
        featuredImage:
          "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop",
        category: "vesti",
        status: "published",
        authorName: "dr Milan Vujović",
        readingTime: 7,
        viewCount: 1422,
        tags: [
          "Autodizalice",
          "Hibrid",
          "Liebherr",
          "Superkondenzatori",
          "Energetska efikasnost",
        ],
        publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        content: `
          <p>Podizanje ekstremno teških tereta na velike visine zahteva ogromnu snagu motora, što uzrokuje ekstremnu potrošnju goriva kod tradicionalnih autodizalica. Međutim, uz najnovija inženjerska rešenja inkorporirana u hibridne sisteme, energija se više ne rasipa nepovratno u atmosferu u vidu toplote kočnica.</p>
          <p>Novi modeli dizalica renomiranih proizvođača poput Liebherr-a i Tadana koriste regenerativne hidraulične elektro-motore. Prilikom pažljivog spuštanja masivnog tereta pod uticajem gravitacije, motori funkcionišu kao generatori, pretvarajući kinetičku energiju u visokonaponsku struju i skladišteći je u ultra-brzim superkondenzatorima poslednje generacije.</p>
          <p>Prikupljena električna energija se potom koristi za pogon električnih pumpi tokom sledećeg ciklusa podizanja ili za bezšuman rad kabine i elektronike na gradilištu dok je primarni dizel motor ugašen. Ovakav zatvoreni kružni energetski sistem smanjuje ukupnu potrošnju skupog dizela za čak 30% i značajno smanjuje habanje mehanizma vitla.</p>
          <p>Hibridni pogon obezbeđuje i izuzetnu preciznost pri pozicioniranju najdelikatnijih konstruktivnih elemenata. Električni asistenti pružaju fluidan i ravnomerni obrtni moment koji uklanja neprijatne trzaje i vibracije hidro-pumpi na visinama, obezbeđujući vrhunski komfor i maksimalan nivo sigurnosti na gradilištu.</p>
        `,
      },
      {
        id: "curated-10",
        title: "Fluktuacija cena gvožđa i armature na Balkanu Q2",
        slug: "generativni-ai-bim-statiski-proracun", // Fallback redirection compatible with recommended
        excerpt:
          "Detaljan statistički izveštaj o kretanju cena građevinskog gvožđa, betonskog čelika i armaturnih mreža na regionalnom tržištu.",
        featuredImage:
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop",
        category: "cenovnici",
        status: "published",
        authorName: "Kancelarija za analitiku SG",
        readingTime: 5,
        viewCount: 1812,
        tags: ["Cene čelika", "Gvožđe", "Armatura", "Cenovnik", "Balkan"],
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        content: `
          <p>Tržište građevinskog gvožđa i armaturnog čelika na Balkanu zabeležilo je značajne cenovne fluktuacije tokom drugog kvartala. Usled prekida nekih tradicionalnih lanaca snabdevanja i uvođenja kvota na uvoz iz trećih zemalja od strane Evropske unije, cene su pretrpele nagli skok u aprilu, nakon čega je usledila stabilizacija pred letnju sezonu radova.</p>
          <p>Betonski čelik klase B500B i armaturne mreže standardnih dimenzija dostigli su istorijski stabilnu prosečnu cenu od 764 evra po toni, što predstavlja povećanje od 2.4% u poređenju sa prethodnim mesecom. Građevinski sakupljači i veletrgovci savetuju izvođačima ugovaranje fiksnih cena u dugoročnim ugovorima pre početka velikih infrastrukturnih iskopa.</p>
          <p>Sektor visokogradnje najviše oseća ove oscilacije pošto se armatura ugrađuje u masivne temeljne ploče i stubove. Preporučujemo svim registrovanim B2B kompanijama i investitorima preuzimanje kompletnog PDF izveštaja i naših Excel troškovnika koji detaljno tabelarno prikazuju cene na skladištima u Beogradu, Sarajevu, Zagrebu i Skoplju radi optimizacije budžeta.</p>
          <p>Stabilizacija tržišta se očekuje krajem leta kada se aktiviraju nove fabrike u okruženju, ali cene sirovog koksnog uglja i ruda gvožđa na svetskim berzama i dalje predstavljaju značajan rizik za sve kalkulacije izvođača.</p>
        `,
      },
      {
        id: "curated-11",
        title:
          "Troškovnik materijala za gips-kartonske sisteme i krovnu izolaciju",
        slug: "pro-troskovnik-gips-karton",
        excerpt:
          "Izračun prosečnih veleprodajnih i maloprodajnih cena gips-tabli, profila, pratećeg materijala i mineralne vune za projekte suve gradnje.",
        featuredImage:
          "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop",
        category: "cenovnici",
        status: "published",
        authorName: "Svet Građevine Research",
        readingTime: 4,
        viewCount: 955,
        tags: [
          "Gips karton",
          "Izolacija",
          "Suva gradnja",
          "Mineralna vuna",
          "Troškovnik",
        ],
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        content: `
          <p>Suva gradnja i toplotna izolacija krovova su trenutno najaktivniji segmenti renoviranja u stambenom sektoru pred nastupajuće tople letnje mesece. Obezbeđivanje ispravnog proračuna i nabavka gips-kartonskih ploča, metalnih UD i CD profila kao i kamene/mineralne vune ključna je za završetak radova bez nepredviđenih prekoračenja.</p>
          <p>Standardne gips-kartonske ploče debljine 12.5 mm kreću se u proseku oko 2.8 evra po kvadratnom metru na veleprodajnom tržištu, dok su vlagootporne (zelene) ploče skuplje za oko 35% usled specijalnih silikonskih aditiva u samom gipsu. Cene metalnih profila zabeležile su blagi pad od 1.2% usled uvoza sirovina nižih transportnih troškova.</p>
          <p>Kamena vuna gustine od 50 kg/m³ namenjena za zvučnu i toplotnu izolaciju unutrašnjih pregradnih zidova beleži stabilnu potražnju. Naš istraživački tim sastavio je kompletan troškovnik u saradnji sa tri vodeća uvoznika, pružajući izvođačima radova precizan kalkulativni alat za ponude klijentima.</p>
          <p>Ukoliko planirate veće investicije u gipsarske radove, savetujemo postavljanje javnog B2B tendera putem našeg konektora kako biste dobili direktne popuste od distributera i sertifikovane izvođače sa dugogodišnjim iskustvom.</p>
        `,
      },
      {
        id: "curated-12",
        title: "Vodič kroz sanaciju kapilarne vlage u podrumskim prostorijama",
        slug: "pro-vodic-sanacija-kapilarne-vlage",
        excerpt:
          "Inženjersko uputstvo za trajnu sanaciju vlage metodom elektroosmoze, hidrofobizacije i injektiranja silikatnih smola u zidove od opeke i betona.",
        featuredImage:
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop",
        category: "saveti",
        status: "published",
        authorName: "dr Milan Vujović",
        readingTime: 6,
        viewCount: 1618,
        tags: [
          "Kapilarna vlaga",
          "Sanacija",
          "Elektroosmoza",
          "Hidroizolacija",
          "Injektiranje",
        ],
        publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        content: `
          <p>Kapilarna vlaga je jedan od najčešćih i najopasnijih neprijatelja konstrukcije, posebno kod starih istorijskih zgrada građenih bez savremene horizontalne hidroizolacije. Voda iz tla se usled površinske napetosti penje kroz pore u opeci i betonu, noseći rastvorene soli koje kristališu na površini i uzrokuju raspadanje maltera i buđ.</p>
          <p>Trajno rešenje ovog problema zahteva presecanje kapilarnog penjanja. Savremene inženjerske metode obuhvataju injektiranje silikonskih mikromolekularnih krema pod pritiskom u bušotine unutar zida. Ove smole reaguju sa građevinskim materijalom i stvaraju trajno hidrofobni sloj koji sprečava vodu da se penje naviše.</p>
          <p>Druga izuzetno uspešna metoda je aktivna elektroosmoza, gde se instaliranjem elektroda stvara suprotno električno polje koje skreće kretanje molekula vode nazad ka tlu. Ova bezšumna i bezopasna tehnologija ne zahteva grube fizičke građevinske radove niti presecanje nosećih zidova, čuvajući integritet objekta.</p>
          <p>Za izvođenje radova injektiranja i elektroosmoze uvek savetujemo angažovanje isključivo licenciranih i verifikovanih firmi sa našeg portala, pošto nepravilno apliciranje preparata može prouzrokovati dodatnu štetu na istorijskim objektima i bacanje dragocenog budžeta.</p>
        `,
      },
      {
        id: "curated-13",
        title:
          "Kako odabrati optimalnu hidroizolaciju za ravne prohodne krovove",
        slug: "pro-optimalna-hidroizolacija-ravni-krovovi",
        excerpt:
          "Poređenje polimernih membrana (EPDM, TPO) sa bitumenskim dvoslojnim sistemima. Prednosti, mane, trajnost i detalji izvođenja dilatacionih spojeva.",
        featuredImage:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
        category: "saveti",
        status: "published",
        authorName: "Redakcija",
        readingTime: 5,
        viewCount: 1140,
        tags: ["Hidroizolacija", "Ravni krov", "EPDM", "TPO", "Bitumen"],
        publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        content: `
          <p>Izvođenje prohodnih ravnih krovova i terasa predstavlja izuzetan projektantski i izvođački izazov. Najmanja greška u varenju spojeva ili neusklađenost termo i hidroizolacionih slojeva može prepustiti vodu prodiranju u niže stambene etaže, uzrokujući ogromne materijalne štete nakon prvih jačih padavina.</p>
          <p>Tradicionalni bitumenski dvoslojni sistemi sa SBS modifikovanim trakama i dalje drže primat usled niske cene i jednostavne ugradnje, ali njihova elastičnost opada pod uticajem ultraljubičastog zračenja. Sa druge strane, savremene jednoslojne polimerne krovne membrane na bazi EPDM gume obezbeđuju neverovatan životni vek od preko 50 godina i ostaju fleksibilne na temperaturama do -45 stepeni.</p>
          <p>Ukoliko planirate prohodnu krovnu terasu prekrivenu keramikom ili dekingom, TPO membrane predstavljaju odličan inženjerski kompromis. Zbog visoke otpornosti na mehanička probijanja i korenje biljaka u slučaju zelenih krovova, one trajno štite termoizolaciju i obezbeđuju maksimalnu stabilnost slojeva.</p>
          <p>Pre početka radova na ravnom krovu, obavezno konsultujte proverene i sertifikovane majstore na našem B2B portalu, koji poseduju savremene ispitne metode poput elektrostatičkog skeniranja prohodnosti, što eliminiše i najmanju opasnost od kasnijeg prokišnjavanja.</p>
        `,
      },
    ];

    const batch = db.batch();
    for (const art of rawArticles) {
      const docRef = db.collection(this.COLLECTION).doc(art.id);
      batch.set(docRef, {
        ...art,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: admin.firestore.Timestamp.fromDate(art.publishedAt),
      });
    }

    await batch.commit();

    console.log(
      `[MagazineCrudService] Seeded ${rawArticles.length} default articles in Firestore.`,
    );
  }

  /**
   * Migration Helper: Bulk upsert articles
   * Used when importing from WP
   */
  static async upsertArticles(articles: Partial<Article>[]) {
    const batch = db.batch();

    for (const article of articles) {
      if (!article.slug) continue;

      const docRef = db
        .collection(this.COLLECTION)
        .doc(article.id || article.slug);
      batch.set(
        docRef,
        {
          ...article,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          viewCount: article.viewCount || 0,
          status: article.status || ArticleStatus.PUBLISHED,
        },
        { merge: true },
      );
    }

    await batch.commit();

    // Sync to Algolia
    const algoliaObjects = articles.map((a) => ({
      id: a.id || a.slug!,
      data: a,
    }));
    syncArticlesToIndex(algoliaObjects).catch((err) =>
      console.error("[MagazineCrudService] Algolia batch sync failed", err),
    );

    // Invalidate main lists
    await CacheService.invalidateByPrefix("magazine_list_");
    this.l1ShieldCache.clear(); // Clear RAM shield on update
  }

  /**
   * Delete an article
   */
  static async deleteArticle(id: string) {
    const articleRef = db.collection(this.COLLECTION).doc(id);
    const outboxRef = db.collection("outbox").doc();

    await db.runTransaction(async (transaction) => {
      transaction.delete(articleRef);

      transaction.set(outboxRef, {
        type: "ARTICLE_DELETED",
        payload: { id },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        version: "1.0",
      });
    });

    await CacheService.invalidateByPrefix("magazine_list_");
    await CacheService.invalidateByPrefix("article_slug_");
    this.l1ShieldCache.clear();
  }

  /**
   * Update article metadata or content
   */
  static async updateArticle(id: string, data: Partial<Article>) {
    const articleRef = db.collection(this.COLLECTION).doc(id);
    const outboxRef = db.collection("outbox").doc();

    await db.runTransaction(async (transaction) => {
      transaction.set(
        articleRef,
        {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(outboxRef, {
        type: "ARTICLE_UPDATED",
        payload: { id, ...data },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        version: "1.0",
      });
    });

    // Invalidate cache
    await CacheService.invalidateByPrefix("magazine_list_");
    this.l1ShieldCache.clear();
    if (data.slug) {
      await CacheService.invalidateByPrefix(`article_slug_${data.slug}`);
    }
  }

  /**
   * Get related articles based on category and intersecting tags with 24h SWR caching
   */
  static async getRelatedArticles(articleId: string): Promise<Article[]> {
    const cacheKey = `magazine:related:${articleId}`;

    const data = await CacheService.getOrSetSWR<Article[]>(
      cacheKey,
      async () => {
        const doc = await db.collection(this.COLLECTION).doc(articleId).get();
        if (!doc.exists) return [];

        const article = doc.data() as Article;
        const tags = article.tags || [];
        const category = article.category;

        // Find candidate articles in the same category or with tags
        let candidates: any[] = [];

        if (tags.length > 0) {
          // Firestore array-contains-any works for up to 10 tags
          const tagsSubset = tags.slice(0, 10);
          const snapshot = await db
            .collection(this.COLLECTION)
            .where("status", "==", ArticleStatus.PUBLISHED)
            .where("tags", "array-contains-any", tagsSubset)
            .limit(20)
            .get();

          candidates = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d) => d.id !== articleId);
        }

        // If not enough tagged candidates, fallback to same category
        if (candidates.length < 3 && category) {
          const snapshot = await db
            .collection(this.COLLECTION)
            .where("status", "==", ArticleStatus.PUBLISHED)
            .where("category", "==", category)
            .limit(10)
            .get();
          const categoryCandidates = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter(
              (d) =>
                d.id !== articleId && !candidates.some((c) => c.id === d.id),
            );
          candidates = [...candidates, ...categoryCandidates];
        }

        // Score candidates based on intersection of tags
        const scored = candidates.map((c) => {
          const commonTags = (c.tags || []).filter((t: string) =>
            tags.includes(t),
          );
          return {
            article: ImageTransformer.transformDocumentImages({
              id: c.id,
              ...c,
            }),
            score: commonTags.length,
          };
        });

        // Sort by score (descending) and return top 3
        return scored
          .sort((a, b) => b.score - a.score)
          .map((s) => s.article)
          .slice(0, 3);
      },
      24 * 60 * 60 * 1000, // 24 hours SWR cache
      [], // Fallback value
    );

    return data;
  }

  /**
   * Get all articles (Admin view, includes drafts)
   */
  static async getAllArticlesAdmin(limit = 50) {
    const snapshot = await db
      .collection(this.COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}
