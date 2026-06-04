import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import SeoHead from '@/src/components/SeoHead';
import { magazineService } from '@/src/services/magazineService';
import { magazineCategoryService } from '@/src/services/magazineCategoryService';
import { Article, ArticleStatus } from '@/src/types/magazine';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Calendar, Clock, Eye, TrendingUp, TrendingDown, Download, FileSpreadsheet } from 'lucide-react';

// Base64 BFF JSON cursor encoder
function encodeCursor(lastId: string, category?: string) {
  const json = JSON.stringify({ lastId, id: lastId, category, ts: Date.now() });
  return btoa(unescape(encodeURIComponent(json)));
}

const MARKET_MATERIALS = [
  { name: 'ČELIK BE 500 S', code: 'STEEL-EU', price: '764.20 €/t', change: '+2.41%', isPositive: true, sparkline: '5,15 15,12 25,18 35,5 45,14 55,4' },
  { name: 'PORTLAND CEMENT I', code: 'CEM-I-52', price: '118.50 €/t', change: '-0.78%', isPositive: false, sparkline: '5,5 15,8 25,4 35,12 45,10 55,16' },
  { name: 'REZANA BUKOVA GRAĐA', code: 'TIMB-BU', price: '395.00 €/m³', change: '+1.65%', isPositive: true, sparkline: '5,14 15,15 25,11 35,8 45,6 55,3' },
  { name: 'INDUSTRIJSKI BAKAR', code: 'COP-LME', price: '8,410.00 $/t', change: '+3.12%', isPositive: true, sparkline: '5,18 15,14 25,12 35,6 45,8 55,2' },
];

const MARKET_ANALYSES = [
  { id: 'AN-2026-04', title: 'Fluktuacija cena građevinskog gvožđa i armature na Balkanu Q2', date: 'Maj 2026.', source: 'Kancelarija za analitiku SG', type: 'CENOVNIK', size: '2.4 MB' },
  { id: 'AN-2026-03', title: 'Troškovnik materijala za gips-kartonske sisteme i krovnu izolaciju', date: 'Maj 2026.', source: 'Svet Građevine Research', type: 'ANALIZA', size: '1.8 MB' },
  { id: 'AN-2026-02', title: 'Indeks transportnih troškova i uvoza cementnih smeša iz EU u Srbiju', date: 'April 2026.', source: 'Industrial Group RS', type: 'INDEKS', size: '3.1 MB' },
];

const CURATED_STATIC_ARTICLES: Article[] = [
  {
    id: 'curated-1',
    title: 'Generativni AI i BIM: Kako algoritmi optimizuju statički proračun u realnom vremenu',
    slug: 'generativni-ai-bim-statiski-proracun',
    excerpt: 'Veštačka inteligencija više nije samo teorijski koncept. Najnoviji BIM softveri samostalno predlažu optimalne armaturne mreže i smanjuju potrošnju čelika za čak 18%.',
    featuredImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop',
    category: 'Svet Tehnologije',
    content: '',
    authorId: 'system',
    authorName: 'Redakcija SG',
    tags: ['AI', 'BIM', 'Inženjering'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 1250,
    publishedAt: new Date('2026-05-10'),
    seo: {}
  },
  {
    id: 'curated-2',
    title: '3D štampani beton: Prvi stambeni kvart u Minhenu sa nultom stopom otpada',
    slug: '3d-stampani-beton-stambeni-kvart-minhen',
    excerpt: 'Najveći evropski projekat aditivne proizvodnje u građevinarstvu ulazi u finalnu fazu. Istražujemo mehanička svojstva novih geopolimernih veziva.',
    featuredImage: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    category: 'Inovacije',
    content: '',
    authorId: 'system',
    authorName: 'Redakcija SG',
    tags: ['3D Printing', 'Beton', 'Održivost'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 840,
    publishedAt: new Date('2026-05-14'),
    seo: {}
  },
  {
    id: 'curated-3',
    title: 'Senzorska mreža na mostu Gazela: Implementacija IoT sistema za rano otkrivanje zamora materijala',
    slug: 'senzorska-mreza-gazela-iot-sistem-zamor-materijala',
    excerpt: 'Postavljanje preko 150 optičkih senzora omogućilo je mikronsko praćenje vibracija i napona konstrukcije pod punim saobraćajnim opterećenjem.',
    featuredImage: 'https://images.unsplash.com/photo-1545558014-868d57f0f2f5?q=80&w=800&auto=format&fit=crop',
    category: 'Inženjering',
    content: '',
    authorId: 'system',
    authorName: 'Inženjering Tim',
    tags: ['IoT', 'Infrastruktura', 'Mostovi'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 2100,
    publishedAt: new Date('2026-05-18'),
    seo: {}
  },
  {
    id: 'curated-4',
    title: 'Minimalizam i brutalizam u modernoj stanogradnji: Estetika sirovog betona na Novom Beogradu',
    slug: 'minimalizam-brutalizam-moderna-stanogradnja-novi-beograd',
    excerpt: 'Analiza novih rezidencijalnih objekata koji revitalizuju nasleđe beogradske škole brutalizma kroz savremene materijale i prostrane fasadne sisteme.',
    featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',
    category: 'Arhitektura',
    content: '',
    authorId: 'system',
    authorName: 'Arhitektura Tim',
    tags: ['Arhitektura', 'Beton', 'Dizajn'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 1560,
    publishedAt: new Date('2025-12-05'),
    seo: {}
  },
  {
    id: 'curated-5',
    title: 'Revitalizacija industrijskih zona: Kako napuštene fabrike postaju poslovni centri A klase',
    slug: 'revitalizacija-industrijskih-zona-napustene-fabrike',
    excerpt: 'Konverzija industrijskog nasleđa predstavlja ogroman inženjerski izazov. Predstavljamo uspešne studije slučaja iz Berlina, Beča i Beograda.',
    featuredImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    category: 'Urbanizam',
    content: '',
    authorId: 'system',
    authorName: 'Redakcija SG',
    tags: ['Urbanizam', 'Rekonstrukcija', 'Industrija'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 920,
    publishedAt: new Date('2026-04-20'),
    seo: {}
  },
  {
    id: 'curated-6',
    title: 'Budućnost fasadnih sistema: Kinetičke fasade koje same optimizuju insolaciju i potrošnju energije',
    slug: 'buducnost-fasadnih-sistema-kineticke-fasade-insolacija',
    excerpt: 'Kinetički paneli kontrolisani centralnim nadzornim sistemom menjaju ugao u zavisnosti od položaja sunca, smanjujući troškove hlađenja za 40%.',
    featuredImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    category: 'Arhitektura',
    content: '',
    authorId: 'system',
    authorName: 'Arhitektura Tim',
    tags: ['Fasade', 'Energija', 'Tehnologija'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 1100,
    publishedAt: new Date('2026-05-21'),
    seo: {}
  },
  {
    id: 'curated-7',
    title: 'Elektromobilnost na gradilištu: Prvi potpuno električni bageri od 20 tona stupaju na scenu',
    slug: 'elektromobilnost-gradiliste-elektricni-bageri-20-tona',
    excerpt: 'Poređenje operativnih troškova dizel i baterijskih hidrauličnih bagera. Prednosti nulte emisije i ekstremno niskog nivoa buke u urbanim sredinama.',
    featuredImage: 'https://images.unsplash.com/photo-1579165466541-71e24090a2cf?q=80&w=800&auto=format&fit=crop',
    category: 'Mašine',
    content: '',
    authorId: 'system',
    authorName: 'Mašine Tim',
    tags: ['Mašine', 'Elektromobilnost', 'Ekologija'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 780,
    publishedAt: new Date('2026-05-15'),
    seo: {}
  },
  {
    id: 'curated-8',
    title: 'Autonomni damper-kamioni: Kako GPS i LIDAR sistemi eliminišu potrebu za vozačima u kamenolomima',
    slug: 'autonomni-damper-kamioni-gps-lidar-kamenolomi',
    excerpt: 'Praktična analiza bezbednosti i produktivnosti autonomnih transportnih sistema na površinskim kopovima u istočnoj Srbiji.',
    featuredImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    category: 'Mašine',
    content: '',
    authorId: 'system',
    authorName: 'Mašine Tim',
    tags: ['Mašine', 'Automatizacija', 'Rudnik'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 650,
    publishedAt: new Date('2026-05-19'),
    seo: {}
  },
  {
    id: 'curated-9',
    title: 'Hibridni pogonski sistemi kod autodizalica: Smanjenje potrošnje goriva pri podizanju ekstremnih tereta',
    slug: 'hibridni-pogonski-sistemi-autodizalice-ekstremni-tereti',
    excerpt: 'Analiza novih Liebherr i Tadano sistema koji koriste kinetičku energiju spuštanja tereta za skladištenje električne energije u superkondenzatorima.',
    featuredImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop',
    category: 'Mašine',
    content: '',
    authorId: 'system',
    authorName: 'Mašine Tim',
    tags: ['Mašine', 'Hibrid', 'Kranovi'],
    status: ArticleStatus.PUBLISHED,
    viewCount: 430,
    publishedAt: new Date('2025-11-12'),
    seo: {}
  },
];

const SPOTLIGHT_INTERVIEWS = [
  {
    id: 'int-1',
    author: 'dr Milan Vujović',
    role: 'GLAVNI INŽENJER / STRUCTURA BG',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop',
    quote: '"Budućnost građevinske industrije na Balkanu više ne zavisi samo od sirove radne snage, već od integracije pametnih IoT senzora u betonske stubove i parametarske optimizacije statike u realnom vremenu."',
  },
  {
    id: 'int-2',
    author: 'arh. Jelena Kovačević',
    role: 'VODEĆI PROJEKTANT / STUDIO VERTICAL',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&auto=format&fit=crop',
    quote: '"Klimatska održivost i zelena sertifikacija objekata nisu prolazni trendovi, već pravni i inženjerski imperativ. Arhitektura mora prestati da zagađuje i postati produžetak regionalnog ekosistema."',
  }
];

export default function MagazinePage() {
  const [category, setCategory] = useState<string | undefined>(undefined);

  // Pagination states
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  const handleDownload = (id: string) => {
    setDownloadingIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setDownloadingIds(prev => ({ ...prev, [id]: false }));
    }, 1000);
  };

  // Tanstack Query for the first page
  const { data: initialArticles, isLoading, error } = useQuery<Article[]>({
    queryKey: ['magazine-articles-initial', category],
    queryFn: () => magazineService.getArticles(category, 12, undefined),
    staleTime: 5 * 60 * 1000
  });

  // Sync initial query with state safely (Prevents rerender loops)
  useEffect(() => {
    if (initialArticles) {
      setArticlesList(initialArticles);
      if (initialArticles.length < 12) {
        setHasMore(false);
        setNextCursor(undefined);
      } else {
        const lastArticle = initialArticles[initialArticles.length - 1];
        if (lastArticle?.id) {
          setNextCursor(encodeCursor(lastArticle.id, category));
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      }
    }
  }, [initialArticles, category]);

  // Load More Handler (Fetch next page with Firestore startAfter cursor parsed as base64 JSON)
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const moreArticles = await magazineService.getArticles(category, 12, nextCursor);
      
      if (moreArticles && Array.isArray(moreArticles)) {
        if (moreArticles.length === 0) {
          setHasMore(false);
        } else {
          setArticlesList((prev) => [...prev, ...moreArticles]);
          
          if (moreArticles.length < 12) {
            setHasMore(false);
            setNextCursor(undefined);
          } else {
            const lastArticle = moreArticles[moreArticles.length - 1];
            if (lastArticle?.id) {
              setNextCursor(encodeCursor(lastArticle.id, category));
            } else {
              setHasMore(false);
            }
          }
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Greška pri učitavanju dodatnih članaka:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const { data: dbCategories, isError: isCategoriesError } = useQuery({
    queryKey: ['magazine-categories'],
    queryFn: () => magazineCategoryService.getCategories(),
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  const categoriesList = useMemo(() => {
    const list = [{ name: 'Aktuelno', value: undefined as string | undefined }];
    if (dbCategories && Array.isArray(dbCategories) && !isCategoriesError) {
      const activeCats = dbCategories
        .filter(c => c.isActive)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(c => ({ name: c.name, value: c.slug }));
      if (activeCats.length > 0) {
        return [...list, ...activeCats];
      }
    }
    // Safe Fallback na osnovne taksonomije sa slug formatom
    return [
      { name: 'Aktuelno', value: undefined },
      { name: 'Vesti', value: 'vesti' },
      { name: 'Arhitektura', value: 'arhitektura' },
      { name: 'Građevina', value: 'gradjevina' },
      { name: 'Cenovnici', value: 'cenovnici' },
      { name: 'Saveti', value: 'saveti' }
    ];
  }, [dbCategories, isCategoriesError]);

  if (error) {
    return (
      <div className="bg-[#0f1115] min-h-screen pt-24 pb-32 flex flex-col items-center justify-center">
        <p className="text-gray-400 font-medium mb-6">Došlo je do greške prilikom učitavanja magazina.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-secondary text-slate-950 px-8 py-3 rounded-md font-bold text-sm tracking-widest hover:bg-secondary/90 transition-colors"
          id="btn-refresh-magazine"
        >
          OSVEŽI STRANICU
        </button>
      </div>
    );
  }

  // Odvojimo istaknuti (prvi) članak i ostale
  const featuredArticle = articlesList.length > 0 ? articlesList[0] : null;
  const regularArticles = articlesList.length > 1 ? articlesList.slice(1) : [];

  const [activeInterview, setActiveInterview] = useState(0);

  const sectionTechArticles = useMemo(() => {
    const dbTech = regularArticles.filter(a => 
      a.category?.toLowerCase().includes('teh') || 
      a.category?.toLowerCase().includes('inova') || 
      a.category?.toLowerCase().includes('nau')
    );
    const placeholders = CURATED_STATIC_ARTICLES.slice(0, 3);
    const combined = [...dbTech, ...placeholders];
    const seenSlugs = new Set<string>();
    return combined.filter(a => {
      if (seenSlugs.has(a.slug)) return false;
      seenSlugs.add(a.slug);
      return true;
    }).slice(0, 3);
  }, [regularArticles]);

  const sectionArchArticles = useMemo(() => {
    const dbArch = regularArticles.filter(a => 
      a.category?.toLowerCase().includes('arh') || 
      a.category?.toLowerCase().includes('urb') || 
      a.category?.toLowerCase().includes('diz')
    );
    const placeholders = CURATED_STATIC_ARTICLES.slice(3, 6);
    const combined = [...dbArch, ...placeholders];
    const seenSlugs = new Set<string>();
    return combined.filter(a => {
      if (seenSlugs.has(a.slug)) return false;
      seenSlugs.add(a.slug);
      return true;
    }).slice(0, 3);
  }, [regularArticles]);

  const sectionMachineryArticles = useMemo(() => {
    const dbMach = regularArticles.filter(a => 
      a.category?.toLowerCase().includes('maš') || 
      a.category?.toLowerCase().includes('mas') || 
      a.category?.toLowerCase().includes('ina') ||
      a.category?.toLowerCase().includes('inf')
    );
    const placeholders = CURATED_STATIC_ARTICLES.slice(6, 9);
    const combined = [...dbMach, ...placeholders];
    const seenSlugs = new Set<string>();
    return combined.filter(a => {
      if (seenSlugs.has(a.slug)) return false;
      seenSlugs.add(a.slug);
      return true;
    }).slice(0, 3);
  }, [regularArticles]);

  return (
    <div className="bg-[#0b0c10] min-h-screen pt-24 pb-32 font-sans text-gray-100 selection:bg-secondary selection:text-black">
      <SeoHead 
        title="Magazin & Edukacija | Svet Građevine"
        description="Stručni arhitektonski magazin. Vesti, saveti, cenovnici i analize tržišta u građevinskoj industriji."
        type="website"
      />
      
      {/* BRANDING TOP BAR */}
      <div className="w-full bg-[#111318] py-8 px-6 md:px-12 mb-8 hidden md:block border-b-2 border-secondary">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
             <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase font-sans">
               SvetGrađevine<span className="text-secondary text-2xl md:text-4xl absolute -mt-1 ml-1">®</span>
             </h1>
             <span className="ml-8 text-secondary font-bold text-sm tracking-widest hidden md:block mt-2">MAGAZIN</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-bold text-gray-300 uppercase tracking-widest">
            <span className="hover:text-secondary cursor-pointer transition-colors">Vesti & Članci</span>
            <span className="hover:text-secondary cursor-pointer transition-colors">Intervjui</span>
            <span className="hover:text-secondary cursor-pointer transition-colors text-secondary">Analize</span>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 w-full pt-8 md:pt-0">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-sans mb-8 md:hidden">
          SvetGrađevine<span className="text-secondary absolute -mt-1 ml-1 text-2xl">®</span> <span className="block text-secondary text-xl mt-2">MAGAZIN</span>
        </h1>

        {/* NAVIGATION / FILTER TABS (SUB-NAVBAR) */}
        <div className="flex mb-12 border-y border-white/10 bg-[#161a22] flex-wrap overflow-x-auto pb-0">
          <div className="flex w-max min-w-full">
            {categoriesList.map((cat, idx) => (
              <button
                key={cat.name}
                id={`cat-btn-${cat.name}`}
                onClick={() => setCategory(cat.value)}
                className={`px-6 py-4 text-sm font-black uppercase tracking-wider transition-all duration-300 relative border-r border-white/10 hover:bg-[#1a1f29] ${
                  category === cat.value 
                    ? 'text-white bg-[#1a1f29]' 
                    : 'text-gray-500'
                }`}
              >
                {category === cat.value && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-secondary"></div>
                )}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="space-y-16">
            <div className="h-[500px] w-full bg-[#161920] animate-pulse border border-white/5"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-[#161920] animate-pulse border border-white/5"></div>
              ))}
            </div>
          </div>
        ) : articlesList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center"
          >
             <div className="inline-flex items-center justify-center w-16 h-16 bg-[#161920] mb-6 border border-white/10">
               <span className="material-symbols-outlined text-3xl text-gray-400">article</span>
             </div>
             <p className="text-gray-400 font-bold text-xl uppercase tracking-widest">Trenutno nema objavljenih članaka u ovoj kategoriji.</p>
          </motion.div>
        ) : (
          <div className="space-y-16">
            
            {/* CONSTRUCTION DIGITAL INSPIRED EDITORIAL GRID */}
            <div className="flex flex-col xl:flex-row gap-6 mb-8">
               {/* LEFT & CENTER - ARTICLES (10 columns equivalent) */}
               <div className="w-full xl:w-5/6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                 
                 {/* FEATURED SKEW (Equivalent to 2 cols) */}
                 <div className="lg:col-span-2 flex flex-col">
                   <Link to={`/magazin/${featuredArticle?.slug || ''}`} className="group flex flex-col h-full bg-[#161920] border border-white/10 pb-6 hover:border-secondary transition-colors relative">
                     <div className="aspect-[4/3] relative overflow-hidden mb-5">
                       <img src={featuredArticle?.featuredImage || ''} alt={featuredArticle?.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                       <div className="absolute bottom-0 left-0 bg-[#0e1014] text-white font-black uppercase text-[10px] px-2 py-1 tracking-widest border border-white/10 border-l-0 border-b-0">
                         Featured
                       </div>
                     </div>
                     <div className="px-5 flex flex-col flex-grow">
                       <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight mb-4 group-hover:text-secondary mb-auto">
                         {featuredArticle?.title}
                       </h2>
                       <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6">
                         {featuredArticle?.excerpt}
                       </p>
                       <div className="mt-auto">
                         <span className="font-mono text-[10px] border border-white/20 text-gray-400 px-3 py-1 uppercase">{featuredArticle?.category || 'Aktuelno'}</span>
                       </div>
                     </div>
                   </Link>
                 </div>

                 {/* NEXT 3 ARTICLES (Each is 1 col) */}
                 {regularArticles.slice(0, 3).map((article) => (
                   <Link key={article.id} to={`/magazin/${article.slug}`} className="group flex flex-col">
                     <div className="aspect-[3/2] overflow-hidden bg-[#161920] mb-4 border border-white/10 group-hover:border-white/30 transition-colors">
                       <img src={article.featuredImage || ''} alt={article.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 grayscale group-hover:grayscale-0" />
                     </div>
                     <h3 className="text-lg font-black text-white leading-tight mb-3 group-hover:text-secondary line-clamp-4">
                       {article.title}
                     </h3>
                     <p className="text-gray-400 text-[13px] leading-relaxed line-clamp-4 mb-4">
                       {article.excerpt}
                     </p>
                     <div className="mt-auto pt-2 border-t border-white/10">
                       <span className="font-mono text-[10px] border border-white/20 text-gray-400 px-3 py-1 uppercase block w-max mt-2">{article.category}</span>
                     </div>
                   </Link>
                 ))}
               </div>

               {/* RIGHT SIDEBAR - AD & MAGAZINE (2 columns equivalent) */}
               <div className="w-full xl:w-1/6 flex flex-col gap-6">
                 {/* Top Ad Block */}
                 <div className="bg-[#1a1d24] w-full h-[250px] border border-white/5 flex items-center justify-center relative">
                   <span className="absolute top-0 right-0 bg-black/50 text-white/40 text-[8px] uppercase tracking-widest px-2 py-1">Company Reports</span>
                 </div>
                 
                 {/* Magazine Promotion */}
                 <div className="bg-[#161920] border border-white/10 overflow-hidden group relative w-full flex-grow min-h-[300px] flex items-end p-6">
                    <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-105 group-hover:opacity-50 transition-all duration-700" alt="Magazin cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                    <div className="relative z-10 w-full text-center">
                      <span className="bg-secondary text-black font-black uppercase text-[10px] px-2 py-1 mb-3 inline-block">Novo Izdanje</span>
                      <h4 className="text-xl font-black text-white mb-4 leading-tight">Construction Digital vol. 4</h4>
                      <button className="w-full bg-secondary text-black hover:bg-[#ffe066] font-black uppercase text-[11px] tracking-widest py-3 transition-colors flex items-center justify-center gap-2">
                        Preuzmi PDF <ArrowRight size={14} />
                      </button>
                    </div>
                 </div>
               </div>
            </div>

            {/* B2B MARKET WATCH */}
            {category === undefined && (
              <div id="b2b-market-watch-root" className="w-full mt-24 mb-16 px-6 py-8 border border-white/10 bg-[#12141a] relative">
                <div className="absolute -top-4 left-6 bg-secondary text-black font-black uppercase px-4 py-1.5 tracking-widest text-sm border border-secondary hidden sm:block">
                  Tržišni Indeksi & Sirovinski Trendovi
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                  {MARKET_MATERIALS.map((mat) => (
                    <div 
                      key={mat.code}
                      id={`market-item-${mat.code}`}
                      className="bg-[#161920] p-4 border border-white/10 hover:border-white/30 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-mono text-[10px] text-gray-500 font-bold tracking-widest group-hover:text-gray-300 transition-colors">
                            {mat.code}
                          </span>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight mt-1">
                            {mat.name}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between mt-4">
                        <div className="flex flex-col">
                          <span className="font-sans text-2xl text-white font-black tracking-tighter">
                            {mat.price}
                          </span>
                          <span className={`font-mono text-xs font-bold ${mat.isPositive ? 'text-green-500' : 'text-red-500'} flex items-center mt-1`}>
                            {mat.isPositive ? '▲' : '▼'} {mat.change}
                          </span>
                        </div>
                        
                        <svg className="w-16 h-8 overflow-visible" viewBox="0 0 60 20">
                          <polyline
                            fill="none"
                            stroke={mat.isPositive ? '#22c55e' : '#ef4444'}
                            strokeWidth="2"
                            points={mat.sparkline}
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROW 2 - BOTTOM GRID */}
            {regularArticles.length >= 4 && (
              <div className="flex flex-col xl:flex-row gap-6 mb-16 border-t border-white/10 pt-10">
                 <div className="w-full xl:w-5/6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                   {/* Lower Wide Block (Under featured) */}
                   <div className="lg:col-span-2">
                     {regularArticles[3] && (
                       <Link to={`/magazin/${regularArticles[3].slug}`} className="group flex gap-4 bg-[#161920] border border-white/10 p-4 hover:border-secondary transition-colors h-full items-center">
                         <div className="w-1/3 aspect-square bg-[#0e1014] overflow-hidden shrink-0 relative">
                           <img src={regularArticles[3].featuredImage} alt={regularArticles[3].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                           <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-secondary font-black text-[9px] uppercase tracking-widest text-center py-1">Top Priča</div>
                         </div>
                         <div className="w-2/3 flex flex-col py-2">
                           <h4 className="text-sm font-black text-white leading-tight group-hover:text-secondary line-clamp-3 mb-2">{regularArticles[3].title}</h4>
                           <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500 block mb-1 border border-white/10 w-max px-2 py-0.5 mt-auto">{regularArticles[3].category}</span>
                         </div>
                       </Link>
                     )}
                   </div>

                   {/* Next 3 articles in Row 2 */}
                   {regularArticles.slice(4, 7).map(article => (
                     <Link key={article.id} to={`/magazin/${article.slug}`} className="group flex flex-col">
                       <div className="aspect-[16/9] overflow-hidden bg-[#161920] mb-4 border border-white/10">
                         <img src={article.featuredImage || ''} alt={article.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                       </div>
                       <h3 className="text-sm font-black text-white leading-tight mb-2 group-hover:text-secondary line-clamp-3">
                         {article.title}
                       </h3>
                       <div className="mt-auto">
                         <span className="font-mono text-[9px] border border-white/20 text-gray-400 px-2 py-0.5 uppercase">{article.category}</span>
                       </div>
                     </Link>
                   ))}
                 </div>
              </div>
            )}

            {/* KEEP THE REST OF ARTICLES IN A NORMAL GRID */}
            {regularArticles.length >= 7 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-12">
                 {regularArticles.slice(7).map((article) => (
                   <Link 
                     key={article.id}
                     to={`/magazin/${article.slug}`} 
                     className="group block"
                   >
                     <div className="aspect-[4/3] w-full bg-[#161920] border border-white/10 overflow-hidden relative mb-4">
                       <img 
                         src={article.featuredImage || ''} 
                         alt={article.title} 
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                       />
                       <div className="absolute bottom-0 left-0 bg-[#0e1014] text-white font-bold uppercase text-[10px] px-2 py-1 tracking-widest border border-white/10">
                         {article.category}
                       </div>
                     </div>
                     <h4 className="text-md font-black text-white mb-2 leading-tight group-hover:text-secondary group-hover:underline decoration-2 underline-offset-4 decoration-secondary transition-all line-clamp-3">
                       {article.title}
                     </h4>
                     <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium border-l-2 border-white/20 pl-3 ml-1 mt-3">
                       {article.excerpt}
                     </p>
                   </Link>
                 ))}
              </div>
            )}

            {/* REPORTS SECTION (if not filtered) */}
            {category === undefined && (
              <div id="b2b-market-intelligence-root" className="w-full my-16 bg-[#161a22] border-t-2 border-secondary pt-12 pb-16 px-8 relative">
                <div className="absolute top-0 right-0 bg-secondary w-32 h-1"></div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-500 tracking-widest uppercase block mb-1">Preuzimanja za partnere</span>
                    <h3 className="text-3xl font-black uppercase text-white tracking-tight">
                      Elitni Izveštaji & Analize
                    </h3>
                  </div>
                  <button className="bg-transparent border border-white/20 shrink-0 text-white uppercase text-xs font-bold px-6 py-4 tracking-widest hover:bg-white hover:text-black transition-colors w-max">
                    Pregled svih izveštaja
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {MARKET_ANALYSES.map((doc) => (
                    <div 
                      key={doc.id}
                      className="bg-[#12141a] border border-white/10 text-left p-0 overflow-hidden transition-shadow group flex flex-col"
                    >
                      <div className="p-6 flex-1">
                        <span className="inline-block bg-[#1a1d24] text-gray-400 font-mono text-[10px] uppercase tracking-widest px-2 py-1 mb-4">{doc.type}</span>
                        <h4 className="text-lg font-black text-white leading-tight mb-3 group-hover:text-secondary transition-colors">{doc.title}</h4>
                        <div className="font-sans text-xs text-gray-300 border-t border-white/10 pt-3 mt-4">
                          <span className="block text-gray-500 font-mono mb-1">Izvor:</span>
                          <span className="font-bold">{doc.source}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDownload(doc.id)}
                        className="w-full flex items-center justify-center gap-2 bg-[#1a1f29] text-white font-black uppercase text-xs py-4 transition-colors hover:bg-secondary hover:text-black mt-auto border-t border-white/10"
                      >
                        <Download size={14} className={`${downloadingIds[doc.id] ? 'animate-bounce' : ''}`} />
                        {downloadingIds[doc.id] ? 'Učitavanje...' : `Preuzmi PDF (${doc.size})`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* LOAD MORE BUTTON */}
            {hasMore && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-8 border-t border-white/10 mt-16"
              >
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  id="btn-load-more-articles"
                  className="px-10 py-5 bg-[#1a1f29] border border-white/10 hover:border-white/30 hover:bg-white hover:text-black text-white disabled:opacity-50 font-black uppercase text-xs tracking-widest transition-all duration-300 flex items-center gap-3"
                >
                  {loadingMore ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      UČITAVANJE ARHIVE...
                    </>
                  ) : (
                    <>
                      UČITAJ PRETHODNA IZDANJA
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
