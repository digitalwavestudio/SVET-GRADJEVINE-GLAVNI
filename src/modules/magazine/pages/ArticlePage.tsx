import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SeoHead from '@/src/components/SeoHead';
import { magazineService } from '@/src/services/magazineService';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { Article } from '@/src/types/magazine';
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, X, Mail, Printer, MessageSquare } from 'lucide-react';

const SIDEBAR_RECOMMENDED_FALLBACK = [
  { id: 'rec-1', title: 'Fluktuacija cena gvoÅ¾Ä‘a i armature na Balkanu Q2', category: 'Cenovnik', slug: 'generativni-ai-bim-statiski-proracun' },
  { id: 'rec-2', title: 'IoT senzori na Gazeli za praÄ‡enje zamora materijala', category: 'InÅ¾enjering', slug: 'senzorska-mreza-gazela-iot-sistem-zamor-materijala' },
  { id: 'rec-3', title: 'Automobilska reÅ¡enja i mehanizacija za prenos tereta', category: 'MaÅ¡ine', slug: 'elektromobilnost-gradiliste-elektricni-bageri-20-tona' },
  { id: 'rec-4', title: 'Brutalizam na Novom Beogradu: Revitalizacija', category: 'Arhitektura', slug: 'minimalizam-brutalizam-moderna-stanogradnja-novi-beograd' },
];

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [showConversionBar, setShowConversionBar] = useState(false);
  const { scrollYProgress } = useScroll();

  const [isMobile, setIsMobile] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouch || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => magazineService.getArticleBySlug(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000
  });

  const { data: relatedArticles, isLoading: isRelatedLoading } = useQuery({
    queryKey: ['related-articles', slug],
    queryFn: () => magazineService.getRelatedArticles(slug!),
    enabled: !!slug && !!article,
    staleTime: 60 * 60 * 1000,
  });

  const recommendedList = useMemo(() => {
    const list = relatedArticles ? relatedArticles.filter(a => a.slug !== slug) : [];
    const fallbacks = SIDEBAR_RECOMMENDED_FALLBACK.filter(f => f.slug !== slug);
    const combined = [...list, ...fallbacks];
    
    // Deduplicate by slug
    const seen = new Set<string>();
    return combined.filter(item => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    }).slice(0, 4);
  }, [relatedArticles, slug]);

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: article?.title || 'Svet GraÄ‘evine',
        text: article?.excerpt || '',
        url: window.location.href,
      });
    } catch (err) {
      console.log('Native share failed or dismissed', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest > 0.5) {
        setShowConversionBar(true);
      } else {
        setShowConversionBar(false);
      }
    });
  }, [scrollYProgress]);

  useEffect(() => {
    if (article?.id) {
      magazineService.recordView(article.id);
    }
  }, [article?.id]);

  const [showExitPopup, setShowExitPopup] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'loading'>('idle');

  useEffect(() => {
    if (!article) return;
    
    // Check localStorage
    const dismissedUntil = localStorage.getItem('magazine:newsletter_popup_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Trigger on exit intent (mouse moving to the top of the viewport)
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 15) {
        setShowExitPopup(true);
        // Remove listener once triggered
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Trigger on 2 minute timeout (120000ms)
    const timer = setTimeout(() => {
      setShowExitPopup(true);
      document.removeEventListener('mousemove', handleMouseMove);
    }, 120000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [article]);

  const handleDismissNewsletter = () => {
    setShowExitPopup(false);
    // Set 30 days ban in localStorage
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('magazine:newsletter_popup_dismissed_until', (Date.now() + thirtyDays).toString());
  };

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterStatus('loading');
    try {
      // Simulate subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNewsletterStatus('success');
      
      // Set 30 days ban in localStorage
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('magazine:newsletter_popup_dismissed_until', (Date.now() + thirtyDays).toString());
      
      setTimeout(() => {
        setShowExitPopup(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setNewsletterStatus('idle');
    }
  };

  const trackInternalClick = (targetType: string) => {
    if (article?.id) {
      magazineService.recordClick(article.id, targetType);
    }
  };

  const renderContentWithCTAs = () => {
    if (!article?.content) return null;
    
    // Split on </p> tags to obtain separate paragraphs
    const paragraphs = article.content.split('</p>');
    const elements: React.ReactNode[] = [];
    
    paragraphs.forEach((p: string, idx: number) => {
      if (!p.trim()) return;
      
      const pHtml = p + '</p>';
      elements.push(
        <div key={`p-${idx}`} className="magazine-body font-sans" dangerouslySetInnerHTML={{ __html: pHtml }} />
      );
      
      // Dynamic insertion of B2B Inline Alert/CTA right after the 3rd paragraph (i.e. idx === 2)
      if (idx === 2) {
        elements.push(
          <div 
            key="b2b-inline-alert-cta" 
            className="not-prose my-12 p-8 bg-gray-50 border-2 border-black rounded-none relative overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          >
            <div className="absolute top-0 right-0 w-12 h-2 bg-[#ffb800]"></div>
            <span className="font-mono text-[10px] font-bold text-gray-500 tracking-[0.2em] block mb-2 uppercase">
              B2B PREPORUKA // SVET GRAÄEVINE KONEKTOR
            </span>
            <p className="text-black font-sans font-bold text-sm md:text-base leading-relaxed mb-6">
              Za izvoÄ‘enje graÄ‘evinskih radova opisanih u analizi, pogledajte verifikovane izvoÄ‘aÄe i maÅ¡ine:
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 font-mono text-xs">
              <Link 
                to="/majstori"
                onClick={() => trackInternalClick("b2b_inline_masters")}
                className="text-black hover:text-white hover:bg-black uppercase font-black tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 border-black pb-1 hover:border-transparent px-2"
              >
                // Verifikovani IzvoÄ‘aÄi
              </Link>
              <Link 
                to="/oglasi"
                onClick={() => trackInternalClick("b2b_inline_machinery")}
                className="text-black hover:text-white hover:bg-black uppercase font-black tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 border-black pb-1 hover:border-transparent px-2"
              >
                // GraÄ‘evinska Mehanizacija
              </Link>
              <Link 
                to="/tenderi"
                onClick={() => trackInternalClick("b2b_inline_tenders")}
                className="text-black hover:text-white hover:bg-black uppercase font-black tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 border-black pb-1 hover:border-transparent px-2"
              >
                // Aktivni Tenderi
              </Link>
            </div>
          </div>
        );
      }
    });
    
    // If the article has fewer than 3 paragraphs, append the CTA at the end
    if (paragraphs.length <= 2) {
      elements.push(
        <div 
          key="b2b-inline-alert-cta-end" 
          className="not-prose my-12 p-8 bg-gray-50 border-2 border-black rounded-none relative overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]"
        >
          <div className="absolute top-0 right-0 w-12 h-2 bg-[#ffb800]"></div>
          <span className="font-mono text-[10px] font-bold text-gray-500 tracking-[0.2em] block mb-2 uppercase">
            B2B PREPORUKA // SVET GRAÄEVINE KONEKTOR
          </span>
          <p className="text-black font-sans font-bold text-sm md:text-base leading-relaxed mb-6">
            Za izvoÄ‘enje graÄ‘evinskih radova opisanih u analizi, pogledajte verifikovane izvoÄ‘aÄe i maÅ¡ine:
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 font-mono text-xs">
            <Link 
              to="/majstori"
              onClick={() => trackInternalClick("b2b_inline_masters_end")}
              className="text-black hover:text-white hover:bg-black uppercase font-black tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 border-black pb-1 hover:border-transparent px-2"
            >
              // Verifikovani IzvoÄ‘aÄi
            </Link>
            <Link 
              to="/oglasi"
              onClick={() => trackInternalClick("b2b_inline_machinery_end")}
              className="text-black hover:text-white hover:bg-black uppercase font-black tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 border-black pb-1 hover:border-transparent px-2"
            >
              // GraÄ‘evinska Mehanizacija
            </Link>
            <Link 
              to="/tenderi"
              onClick={() => trackInternalClick("b2b_inline_tenders_end")}
              className="text-black hover:text-white hover:bg-black uppercase font-black tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 border-black pb-1 hover:border-transparent px-2"
            >
              // Aktivni Tenderi
            </Link>
          </div>
        </div>
      );
    }
    
    return <div className="space-y-6">{elements}</div>;
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen pt-24 pb-32 font-sans text-gray-900 animate-pulse">
        <article className="max-w-[900px] mx-auto px-6 md:px-12 w-full">
          {/* Header Mock */}
          <header className="mb-12">
            <div className="space-y-4 mb-8">
              <div className="h-12 md:h-16 w-full bg-gray-200 rounded-none"></div>
              <div className="h-12 md:h-16 w-2/3 bg-gray-200 rounded-none"></div>
            </div>
            <div className="flex flex-wrap gap-4 py-6 border-y border-gray-200">
              <div className="w-8 h-8 rounded-none bg-gray-200"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mt-2"></div>
            </div>
          </header>

          <div className="aspect-[21/9] w-full bg-gray-200 mb-16 border-4 border-gray-100 rounded-none"></div>

          <div className="space-y-6">
            <div className="h-4 w-full bg-gray-200 rounded-none"></div>
            <div className="h-4 w-full bg-gray-200 rounded-none"></div>
            <div className="h-4 w-4/5 bg-gray-200 rounded-none"></div>
            <div className="h-4 w-11/12 bg-gray-200 rounded-none"></div>
          </div>
        </article>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-white min-h-screen pt-32 pb-32 flex flex-col items-center justify-center text-center px-8 border-t-8 border-black">
        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center mb-8 border-4 border-black rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined text-black text-5xl">warning</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black mb-4">ÄŒlanak nije pronaÄ‘en</h1>
        <p className="text-gray-600 font-bold mb-10 text-lg">NaÅ¾alost, nismo uspeli da pronaÄ‘emo Älanak koji traÅ¾ite.</p>
        <Link to="/magazin" className="bg-black text-white px-8 py-4 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-2 hover:bg-[#ffb800] hover:text-black transition-colors rounded-none shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none">
          <span className="material-symbols-outlined text-sm">arrow_back</span> NAZAD NA MAGAZIN
        </Link>
      </div>
    );
  }

  const isServiceRelated = ['Saveti', 'Majstori', 'Enterijer', 'Renoviranje'].includes(article.category || '');

  const jsonLd = useMemo(() => {
    if (!article) return undefined;
    
    const isoDate = article.publishedAt?.toDate 
      ? article.publishedAt.toDate().toISOString()
      : article.publishedAt 
        ? new Date(article.publishedAt).toISOString() 
        : new Date().toISOString();

    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.excerpt || article.seo?.description || "",
      "image": article.featuredImage ? [article.featuredImage] : [],
      "datePublished": isoDate,
      "dateModified": isoDate,
      "author": {
        "@type": "Person",
        "name": article.authorName || "Redakcija"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Svet GraÄ‘evine",
        "logo": {
          "@type": "ImageObject",
          "url": "https://svetgradjevine.com/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://svetgradjevine.com/magazin/${article.slug}`
      }
    };
  }, [article]);

  const publishedDate = article.publishedAt?.toDate 
    ? format(article.publishedAt.toDate(), 'dd. MMMM yyyy.', { locale: sr })
    : article.publishedAt ? format(new Date(article.publishedAt), 'dd. MMMM yyyy.', { locale: sr }) : 'Danas';

  return (
    <div className="bg-[#0b0c10] min-h-screen pt-32 pb-32 font-sans text-gray-100 selection:bg-secondary selection:text-black">
      <SeoHead 
        title={`${article.title} | Svet GraÄ‘evine Magazin`}
        description={article.excerpt || article.seo?.description}
        type="article"
        image={article.featuredImage}
        jsonLd={jsonLd}
      />

      <article className="w-full">
        {/* TOP HEADER SECTION - Editorial Layout */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 w-full mb-14">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-8 font-bold">
            <Link to="/" className="hover:text-white transition-colors">PoÄetna</Link>
            <span className="text-white/20">/</span>
            <Link to="/magazin" className="hover:text-white transition-colors">Magazin</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">{article.category}</span>
          </nav>

          {/* GIANT TITLE (70% standard display space on larger screens) */}
          <div className="lg:w-[70%] w-full">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl md:text-5xl lg:text-7xl font-sans font-black uppercase leading-[0.95] tracking-tighter mb-10 text-white"
            >
              {article.title}
            </motion.h1>
          </div>

          {/* METADATA HORIZONTAL BAR (Cell-based, ultra-solid layout running wide) */}
          <div className="w-full bg-[#161a22] grid grid-cols-2 md:grid-cols-4 gap-y-4 md:divide-x md:divide-white/10 mb-10 p-5 md:py-6 md:px-8 border border-white/10 rounded-none">
            <div className="flex flex-col justify-center pr-4">
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-bold">AUTOR ANALIZE</span>
              <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider truncate">
                {article.authorName || 'Redakcija'}
              </span>
            </div>
            <div className="flex flex-col justify-center md:pl-6 pr-4">
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-bold">DATUM OBJAVE</span>
              <span className="font-mono text-[11px] font-bold text-[#ffb800] uppercase tracking-wider truncate">
                {publishedDate}
              </span>
            </div>
            <div className="flex flex-col justify-center md:pl-6 pr-4">
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-bold">AUDITORIJUM</span>
              <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider truncate">
                {article.viewCount} PREGLEDA
              </span>
            </div>
            <div className="flex flex-col justify-center md:pl-6">
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-bold">VREME ÄŒITANJA</span>
              <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider truncate">
                {article.readingTime || '5'} MINUTA
              </span>
            </div>
          </div>

          {/* COVER PHOTO - MASSIVE & SHARP */}
          {article.featuredImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="aspect-[21/9] w-full overflow-hidden bg-[#161920] border border-white/10 rounded-none relative"
            >
              <img 
                src={article.featuredImage} 
                alt={article.title} 
                className="w-full h-full object-cover transition-all duration-1000"
              />
            </motion.div>
          )}
        </div>

        {/* THREE COLUMN GRID - CONTENT, ACTIONS, RECOMMENDATIONS */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* COLUMN 1: LEFT STICKY SHARE & ACTION SIDEBAR */}
          <div className="hidden lg:col-span-2 lg:block relative">
            <div className="sticky top-32 flex flex-col items-center gap-6 py-4 border-r border-white/10 pr-6">
              <span className="font-mono text-[8px] text-gray-400 font-bold uppercase tracking-[0.25em] mb-4 whitespace-nowrap block">
                DELJENJE
              </span>
              
              {/* Copy button */}
              <button 
                onClick={handleCopyLink}
                title="Kopiraj link"
                className="text-gray-400 hover:text-black hover:scale-105 transition-all cursor-pointer p-2 rounded-none relative"
                id="sticky-copy-btn"
              >
                {copied ? <Check size={16} className="text-black" /> : <Copy size={16} />}
                <AnimatePresence>
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-black text-white text-[9px] font-mono font-bold px-2 py-1 rounded-none shadow-xl shadow-black/10 whitespace-nowrap"
                    >
                      KOPIRANO!
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Facebook */}
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Podeli na Facebook-u"
                className="text-gray-400 hover:text-black hover:scale-105 transition-all p-2 rounded-none"
              >
                <Facebook size={16} />
              </a>

              {/* Twitter */}
              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article?.title || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Podeli na Twitter-u"
                className="text-gray-400 hover:text-black hover:scale-105 transition-all p-2 rounded-none"
              >
                <X size={16} />
              </a>

              {/* LinkedIn */}
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Podeli na LinkedIn-u"
                className="text-gray-400 hover:text-black hover:scale-105 transition-all p-2 rounded-none"
              >
                <Linkedin size={16} />
              </a>

              <div className="w-6 h-[2px] bg-gray-200 my-2"></div>

              {/* Print action */}
              <button 
                onClick={() => window.print()}
                title="OdÅ¡tampaj analizu"
                className="text-gray-400 hover:text-black hover:scale-105 transition-all cursor-pointer p-2 rounded-none"
              >
                <Printer size={16} />
              </button>

              {/* Comment trigger */}
              <button 
                onClick={() => alert("Komentari su odobreni iskljuÄivo za verifikovane B2B entitete.")}
                title="Ostavi komentar"
                className="text-gray-400 hover:text-black hover:scale-105 transition-all cursor-pointer p-2 rounded-none"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>

          {/* COLUMN 2: MIDDLE BODY (STRICT 70ch LIMIT - max-w-3xl) */}
          <div className="lg:col-span-7 col-span-1 max-w-3xl w-full">
            <div 
              className="prose prose-invert max-w-none 
                prose-headings:font-sans prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-black prose-headings:text-white
                prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-300 prose-p:leading-[1.8] prose-p:text-[18px] md:prose-p:text-[20px] prose-p:mb-8 prose-p:font-medium
                prose-strong:text-white prose-strong:font-black
                prose-li:text-gray-300 prose-li:text-[18px] md:prose-li:text-[20px] prose-li:leading-[1.8] prose-ul:my-8 prose-li:my-3 prose-li:font-medium
                prose-a:text-white prose-a:font-bold prose-a:no-underline hover:prose-a:bg-secondary hover:prose-a:text-black transition-colors
                prose-blockquote:border-l-4 prose-blockquote:border-l-secondary prose-blockquote:bg-[#161a22] prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:text-white prose-blockquote:not-italic prose-blockquote:font-bold
                prose-img:rounded-none prose-img:border prose-img:border-white/10 prose-img:my-10
                mb-16"
            >
              {renderContentWithCTAs()}
            </div>

            {/* Tags and B2B Connect */}
            <div className="border-t border-white/10 pt-8">
               <div className="flex flex-wrap gap-2 mb-12">
                  {article.tags?.map((tag: string) => (
                    <span key={tag} className="bg-[#161a22] text-gray-300 border border-white/10 px-3 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-[0.15em] hover:bg-secondary hover:text-black cursor-default transition-colors">
                      #{tag}
                    </span>
                  ))}
               </div>
            </div>

            {/* SUGGESTED FROM ADS (Market connector) */}
            {article.suggestions && article.suggestions.length > 0 && (
              <section className="bg-[#12141a] border border-secondary rounded-none p-6 md:p-8 mb-16 relative">
                <div className="absolute top-0 right-0 w-16 h-1 bg-secondary"></div>
                <span className="font-mono font-bold text-[9px] text-gray-500 tracking-[0.2em] block uppercase mb-3">
                  // POTENCIJAL SA TRÅ½IÅ TA OGLASA
                </span>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-6">Povezane B2B Prilike:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-6">
                   {article.suggestions.map((suggestion: any, idx: number) => (
                     <Link 
                       key={idx}
                       to={suggestion.url}
                       onClick={() => trackInternalClick(suggestion.category || "suggestions")}
                       className="flex items-center justify-between p-4 bg-[#161a22] rounded-none border border-white/10 hover:border-secondary transition-all group"
                     >
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-[#0e1014] flex items-center justify-center text-white group-hover:bg-secondary group-hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-lg">
                              {suggestion.category === 'jobs' ? 'work' : 
                              suggestion.category === 'machines' ? 'agriculture' :
                              suggestion.category === 'masters' ? 'construction' : 'bolt'}
                            </span>
                          </div>
                          <span className="font-mono font-bold uppercase text-[10px] tracking-wider text-white">{suggestion.label}</span>
                       </div>
                       <div className="w-6 h-6 rounded-none bg-[#1a1d24] border border-white/10 flex items-center justify-center group-hover:bg-secondary transition-colors">
                         <span className="material-symbols-outlined text-gray-400 group-hover:text-black transition-colors text-xs">arrow_forward</span>
                       </div>
                     </Link>
                   ))}
                </div>
              </section>
            )}

            {/* AUTHOR PRESENTATION CARD */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-6 px-6 bg-[#161a22] border border-white/10 rounded-none mb-16">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-none bg-black border border-white/10 flex items-center justify-center text-white font-mono text-lg font-black">
                     {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div>
                     <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-gray-400 block mb-0.5">AUTOR ANALIZE</span>
                     <span className="text-lg font-black uppercase tracking-tight text-white">{article.authorName || 'Redakcija'}</span>
                  </div>
               </div>
               <button 
                 onClick={() => navigate('/magazin')}
                 className="bg-transparent border border-white/20 hover:bg-secondary hover:border-secondary hover:text-black text-white px-6 py-3 rounded-none font-sans font-black uppercase text-[10px] tracking-[0.15em] transition-all flex items-center justify-center gap-2 sm:w-auto w-full"
               >
                  SVE ANALIZE <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
               </button>
            </div>
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR 'READ NEXT / POVEZANE TEME' */}
          <div className="lg:col-span-3 col-span-1 border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-6">
            <div className="sticky top-32 space-y-6">
              <div className="flex items-center justify-center border border-white/10 bg-[#161a22] py-3 px-4 mb-6">
                <h4 className="font-sans text-[12px] font-black uppercase tracking-[0.1em] text-white">
                  PreporuÄeno Za Vas
                </h4>
              </div>
              
              <div className="space-y-5">
                {recommendedList.map((item) => (
                  <div key={item.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <span className="font-mono text-[9px] font-bold text-gray-400 tracking-[0.15em] uppercase block mb-1">
                      {item.category}
                    </span>
                    <Link 
                      to={`/magazin/${item.slug}`}
                      className="text-white hover:text-secondary text-[13px] uppercase font-black tracking-tight leading-snug transition-colors line-clamp-3 block"
                    >
                      {item.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* RELATED ARTICLES SECTION - Elegant Bottom Layout */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="mt-24 border-t-2 border-white/10 bg-[#12141a] pt-16 pb-24" id="section-related-articles">
            <div className="max-w-7xl mx-auto px-4 md:px-12 w-full">
              <h3 className="text-3xl font-sans font-black uppercase tracking-tighter text-white mb-10">Povezani ÄŒlanci</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {relatedArticles.map((rel) => {
                  let relDate = 'Danas';
                  if (rel.publishedAt) {
                     const pub = rel.publishedAt as { toDate?: () => Date };
                     if (typeof pub.toDate === 'function') {
                        relDate = format(pub.toDate(), 'dd. MMMM yyyy.', { locale: sr });
                     } else if (typeof rel.publishedAt === 'string' || typeof rel.publishedAt === 'number' || rel.publishedAt instanceof Date) {
                        relDate = format(new Date(rel.publishedAt), 'dd. MMMM yyyy.', { locale: sr });
                     }
                  }
                  return (
                    <Link 
                      to={`/magazin/${rel.slug}`} 
                      key={rel.id}
                      className="bg-[#161a22] rounded-none overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col group"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden bg-[#0e1014] border-b border-white/10">
                        {rel.featuredImage ? (
                          <img 
                            src={rel.featuredImage} 
                            alt={rel.title} 
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <span className="material-symbols-outlined text-4xl font-light">newspaper</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-black border border-white/10 text-white font-bold text-[9px] font-mono px-2.5 py-1 uppercase tracking-widest leading-none block">
                            {rel.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <span className="text-[9px] text-gray-500 font-bold font-mono uppercase tracking-[0.1em] mb-2 block">
                          // {relDate}
                        </span>
                        <h4 className="font-sans uppercase font-black text-base tracking-tight mb-2 text-white group-hover:text-secondary group-hover:underline decoration-2 underline-offset-4 transition-colors line-clamp-3 leading-snug">
                          {rel.title}
                        </h4>
                        <p className="text-[13px] text-gray-400 line-clamp-2 mt-auto font-medium leading-relaxed">
                          {rel.excerpt}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </article>

      {/* FLOATING CONVERSION BAR (Phase 3) */}
      <AnimatePresence>
        {showConversionBar && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:pb-8 pointer-events-none"
          >
            <div className="max-w-[800px] mx-auto bg-[#161920] border border-white/20 rounded-none p-5 md:p-6 shadow-2xl pointer-events-auto flex items-center justify-between gap-6">
              <div className="hidden md:block">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary mb-1.5">DOPADA VAM SE ÄŒLANAK?</p>
                <h4 className="text-base font-black uppercase tracking-tight text-white">Iskoristite potencijal trÅ¾iÅ¡ta</h4>
              </div>
              
              <div className="flex items-center justify-end gap-3 w-full md:w-auto">
                {isServiceRelated ? (
                  <Link 
                    to="/majstori" 
                    onClick={() => trackInternalClick("majstori")}
                    className="flex-1 md:flex-none justify-center bg-secondary text-black px-6 py-3.5 border-2 border-secondary hover:bg-white hover:border-white font-black uppercase text-[10px] tracking-[0.1em] text-center transition-colors"
                  >
                    PRONAÄI MAJSTORA
                  </Link>
                ) : (
                  <Link 
                    to="/postavi-oglas" 
                    onClick={() => trackInternalClick("postavi-oglas")}
                    className="flex-1 md:flex-none justify-center bg-secondary text-black px-6 py-3.5 border-2 border-secondary hover:bg-white hover:border-white font-black uppercase text-[10px] tracking-[0.1em] text-center transition-colors"
                  >
                    POSTAVI OGLAS
                  </Link>
                )}
                <Link 
                  to="/kontakt" 
                  onClick={() => trackInternalClick("kontakt")}
                  className="hidden sm:flex justify-center items-center bg-transparent text-white hover:bg-white hover:text-black px-6 py-3.5 font-black uppercase text-[10px] tracking-[0.1em] border-2 border-white/20 hover:border-white transition-colors"
                >
                  KONTAKT
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXIT INTENT NEWSLETTER POPUP */}
      <AnimatePresence>
        {showExitPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismissNewsletter}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-md w-full bg-[#161a22] border border-white/20 rounded-none p-8 md:p-10 z-10 overflow-hidden text-center shadow-2xl"
              id="exit-intent-newsletter-popup"
            >
              <button 
                onClick={handleDismissNewsletter}
                className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-1"
                id="btn-close-exit-popup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-black mb-6">
                <Mail className="w-7 h-7" />
              </div>

              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 mb-3 block">Dnevna Doza GraÄ‘evinarstva</span>
              <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-4 leading-tight">Ne propustite sledeÄ‡i trend</h3>
              <p className="text-sm text-gray-300 font-medium mb-8 leading-relaxed">
                Pretplatite se na naÅ¡ nedeljni bilten i preuzmite besplatni priruÄnik za optimizaciju troÅ¡kova gradnje i renoviranja.
              </p>

              <form onSubmit={handleSubscribeNewsletter} className="space-y-4 relative">
                {newsletterStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-green-500/20 border border-green-500 text-green-400 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> UspeÅ¡no ste se prijavili! Hvala.
                  </motion.div>
                ) : (
                  <>
                    <input 
                      type="email"
                      required
                      placeholder="Unesite vaÅ¡u e-mail adresu"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      disabled={newsletterStatus === 'loading'}
                      className="w-full bg-[#0b0c10] border border-white/20 focus:border-secondary rounded-none px-5 py-4 text-sm font-bold text-white outline-none transition-all placeholder:text-gray-500"
                    />
                    <button 
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="w-full bg-secondary text-black hover:bg-white border-2 border-secondary hover:border-white disabled:opacity-50 px-6 py-4 rounded-none font-black uppercase text-[11px] tracking-[0.2em] transition-all"
                    >
                      {newsletterStatus === 'loading' ? 'PRIJAVLJIVANJE...' : 'PRETPLATI SE ODMAH'}
                    </button>
                    <button 
                      type="button"
                      onClick={handleDismissNewsletter}
                      className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.1em] transition-colors mt-6 block mx-auto underline underline-offset-4"
                    >
                      NE ZANIMA ME, HVALA
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

