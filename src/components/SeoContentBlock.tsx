import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, TrendingUp, HelpCircle, BarChart3 } from 'lucide-react';
import { APP_CONFIG } from '@/src/constants/config';
import { MACHINE_CATEGORIES } from '@/src/constants/machineTaxonomy';
import { LOCATIONS, PROFESSIONS, MARKETPLACE_CATEGORIES, ACCOMMODATION_TYPES, KITCHEN_TYPES, REAL_ESTATE_PURPOSES, TaxonomyItem } from '@/src/constants/taxonomy';
import Accordion from '@/src/components/Accordion';

interface Props {
  type: 'poslovi' | 'masine' | 'smestaj' | 'ketering' | 'placevi' | 'firme' | 'majstori' | 'alat-i-oprema' | 'berza';
  locationSlug?: string;
  grad?: string;
  zanimanje?: string;
  itemCount?: number;
}

export default function SeoContentBlock({ type, locationSlug, grad, zanimanje, itemCount }: Props) {

  const actualGrad = grad || locationSlug;
  const gradName = actualGrad ? LOCATIONS.find(l => l.slug === actualGrad)?.name : '';
  
  let zanimanjeName = '';
  if (zanimanje) {
    if (type === 'masine') zanimanjeName = MACHINE_CATEGORIES.find(c => c.id === zanimanje)?.name || '';
    else if (type === 'placevi') zanimanjeName = REAL_ESTATE_PURPOSES.find(c => c.slug === zanimanje)?.name || '';
    else if (type === 'smestaj') zanimanjeName = ACCOMMODATION_TYPES.find(c => c.slug === zanimanje)?.name || '';
    else if (type === 'ketering') zanimanjeName = KITCHEN_TYPES.find(c => c.slug === zanimanje)?.name || '';
    else if (type === 'alat-i-oprema') zanimanjeName = MARKETPLACE_CATEGORIES.find(c => c.slug === zanimanje)?.name || '';
    else zanimanjeName = Object.values(PROFESSIONS).flat().find(p => p.slug === zanimanje)?.name || '';
  }

  const getIntro = () => {
    switch (type) {
      case 'poslovi': return `Dobrodošli na najveću berzu rada za građevinski sektor u Srbiji. Ako tražite ${zanimanjeName || 'angažman'} ${gradName ? 'u mestu ' + gradName : 'širom države'}, na pravom ste mestu.`;
      case 'majstori': return `Baza proverenih majstora i stručnjaka iz građevinske industrije. ${gradName ? 'Pronađite stručnjaka u mestu ' + gradName : 'Ovde ćete naći najbolje ocenjene profile sa portfoliom radova.'}`;
      case 'firme': return `Katalog proverenih građevinskih firmi i izvođača radova. ${gradName ? 'Pregledajte najkvalitetnije izvođače u mestu ' + gradName : 'Pronađite pouzdane partnere širom Srbije.'}`;
      case 'masine': return `Najveći oglasnik za građevinsku mehanizaciju nudi širok izbor mašina. ${gradName ? 'Dostupna mehanizacija: ' + gradName + '.' : ''}`;
      case 'smestaj': return `Kvalitetan smeštaj za radnike. ${gradName ? 'Pregledajte objekte u blizini u mestu ' + gradName : 'Pronađite opremljene sobe širom Srbije'}.`;
      case 'ketering': return `Organizovana ishrana na gradilištu. ${gradName ? 'Ketering u gradu ' + gradName : 'Pronađite partnere za tople obroke.'}`;
      case 'placevi': return `Investirajte u zemljište. ${gradName ? 'Ponuda u gradu ' + gradName : 'Najveći izbor zemljišta u Srbiji.'}`;
      case 'alat-i-oprema': return `Berza za alat. ${gradName ? 'Nova i polovna oprema u ' + gradName : 'Sistemsko rešenje za brzo opremanje.'}`;
      default: return '';
    }
  };

  const getMarketInsights = () => {
    switch (type) {
      case 'poslovi': return `Prosečan raspon plata za profil ${zanimanjeName || 'građevinski radnik'} ${gradName ? 'u mestu ' + gradName : 'na nivou Srbije'} kreće se u zavisnosti od iskustva. Trenutna stopa potražnje za ovim profilom je izuzetno visoka, posebno za kvalifikovane majstore.`;
      case 'majstori': return `Prosečna cena dnevnice za profil ${zanimanjeName || 'majstor'} ${gradName ? 'u mestu ' + gradName : 'u Srbiji'} varira od složenosti posla i regije. Savetuje se provera portfolija i prethodnih ocena korisnika radi osiguranja kvaliteta izvedenih radova.`;
      case 'firme': return `Pri izboru izvođača proverite PIB, licence, izvođačke projekte i poštovanje mera zaštite na radu. Platforma objedinjuje pouzdane kompanije koje poštuju ugovorne obaveze.`;
      case 'masine': return `Baza najma uključuje bager, kran, skele i ostalu mehanizaciju. Prilikom najma, redovno se proveravaju radni sati, nosivost i atesti za bezbedan rad na gradilištu.`;
      case 'placevi': return `Proverite status katastarske parcele, koeficijent izgrađenosti, uknjiženost (vlasnik 1/1) i da li se radi o industrijskoj zoni pre donošenja investicione odluke.`;
      case 'smestaj': return `Potražnja za radničkim smeštajem raste sa intenziviranjem sezonskih radova. Ključni faktori pri odabiru su blizina gradilišta, obezbeđen parking za mehanizaciju i dostupnost kapaciteta za veće grupe.`;
      case 'ketering': return `Standardi ishrane na gradilištu podrazumevaju poštovanje HACCP standarda i obezbeđivanje nutritivno vrednih toplih obroka. Pravovremena dostava i fleksibilnost u broju porcija su ključni za produktivnost.`;
      case 'alat-i-oprema': return `Tržište najma i prodaje alata zahteva brzinu i pouzdanost. Redovan servis i dostupnost rezervnih delova za profesionalnu opremu su kritični faktori koji minimizuju zastoje u radu na terenu.`;
      default: return null;
    }
  };
  const marketInsights = getMarketInsights();

  const getLSIKeywords = () => {
     switch (type) {
        case 'poslovi':
        case 'firme': return 'pib, ugovori, zaštita na radu, licenca, izvođački projekat, sigurnost';
        case 'masine':
        case 'alat-i-oprema': return 'radni sati, nosivost, atesti, redovan servis, bager, kran, hitne isporuke';
        case 'placevi': return 'katastarska parcela, koeficijent izgrađenosti, front, uknjiženo, vlasnik 1/1, industrijska zona, dozvole';
        case 'smestaj': return 'kapacitet kreveta, radnički obroci, parking za mehanizaciju, topla voda 24/7, dnevni odmor';
        case 'ketering': return 'HACCP, topli obroci, lanč paketi, dostava na gradilište, nutritivna vrednost, menza';
        default: return 'kvalitet, pouzdanost, građevina Srbija, brza saradnja, direktan kontakt';
     }
  };

  const relatedCategories = useMemo(() => {
    switch (type) {
      case 'poslovi':
      case 'majstori':
      case 'firme': return Object.values(PROFESSIONS).flat().filter(p => p.slug !== zanimanje && p.slug !== 'sve').slice(0, 24);
      case 'masine': return MACHINE_CATEGORIES.filter(c => c.id !== zanimanje).slice(0, 24);
      case 'alat-i-oprema': return MARKETPLACE_CATEGORIES.filter(c => c.slug !== zanimanje).slice(0, 24);
      case 'smestaj': return ACCOMMODATION_TYPES.filter(c => c.slug !== zanimanje).slice(0, 24);
      case 'ketering': return KITCHEN_TYPES.filter(c => c.id !== zanimanje).slice(0, 24);
      case 'placevi': return REAL_ESTATE_PURPOSES.filter(c => c.slug !== zanimanje).slice(0, 24);
      default: return [];
    }
  }, [type, zanimanje]);

    const nearbyLocations = useMemo(() => {
      return LOCATIONS.filter(l => l.slug !== 'all' && l.slug !== actualGrad).slice(0, 24);
    }, [actualGrad]);

  const getModuleUrl = (modulePath: string, loc?: string, cat?: string) => {
    let url = `/${modulePath}`;
    if (modulePath === 'gradjevinske-masine') url = '/masine';
    if (modulePath === 'berza') url = '/alat-i-oprema';
    const mType = url.replace('/', '');
    const actualCat = (!cat || cat === 'all' || cat === 'SVE') ? undefined : cat;
    const actualLoc = (!loc || loc === 'all' || loc === 'SVE') ? undefined : loc;

    if (mType === 'firme' || mType === 'ketering') {
      const parts = [url];
      if (actualLoc) parts.push(actualLoc);
      let finalUrl = parts.join('/');
      if (actualCat) finalUrl += `?${mType === 'firme' ? 'cat' : 'type'}=${actualCat}`;
      return finalUrl;
    }

    if (actualCat && actualLoc) return `${url}/${actualCat}/${actualLoc}`;
    if (actualCat) return `${url}/${actualCat}`;
    if (actualLoc) {
      if (['smestaj', 'alat-i-oprema', 'placevi'].includes(mType)) return `${url}/lokacija/${actualLoc}`;
      return `${url}/${actualLoc}`;
    }
    return url;
  };

  const getFaqs = () => {
    const term = zanimanjeName || (
      type === 'poslovi' ? 'građevinski poslovi' :
      type === 'majstori' ? 'majstori' :
      type === 'firme' ? 'građevinske firme' :
      type === 'masine' ? 'građevinske mašine' :
      type === 'smestaj' ? 'smeštaj za radnike' :
      type === 'ketering' ? 'radnički ketering' :
      type === 'placevi' ? 'placevi i zemljište' :
      type === 'alat-i-oprema' ? 'alat i oprema' :
      'građevinske usluge'
    );
    const loc = gradName ? `u mestu ${gradName}` : 'u Srbiji';
    
    return [
      {
        question: `Gde mogu naći najbolje ponude za ${term.toLowerCase()} ${loc.toLowerCase()}?`,
        answer: `Svet Građevine nudi najveću i najbrže rastuću bazu proverenih ponuda za ${term.toLowerCase()} ${loc}. Preko naše pametne pretrage obezbedite direktan kontakt sa pravim profesionalcima i kompanijama bez posrednika.`
      },
      {
        question: `Da li se korišćenje platforme naplaćuje?`,
        answer: `Pretraga ponuda, pregled profila i direktan kontakt sa oglašivačima su potpuno besplatni. Naplaćuju se isključivo premium paketi za isticanje oglasa i dodatne funkcionalnosti za profesionalce.`
      },
      {
        question: `Da li su profili provereni i na osnovu čega se rangiraju?`,
        answer: `Da, platforma se oslanja na transparentan sistem ocena i verifikaciju osnovnih podataka. Uvek savetujemo da proverite referentnu listu i dostupnu galeriju radova za najbezbedniju saradnju.`
      },
      {
        question: `Kako da budem siguran u kvalitet usluge?`,
        answer: `Savetujemo da pre dogovora uvek pregledate portfolije, pročitate iskustva drugih korisnika na profilu, proverite galeriju završenih radova i komunicirate transparentno oko detalja projekta.`
      },
      {
        question: `Kako najlakše oglasiti i predstaviti svoju ponudu ${loc.toLowerCase()}?`,
        answer: `Korišćenjem opcije "Postavi Oglas" možete kreirati detaljan profil sa opisom usluga, vizuelnim materijalima i celokupnim iskustvom. Aktivni oglasi imaju visoku prioritetnu vidljivost ${loc} i donose visoko kvalifikovane upite.`
      }
    ];
  };

  const faqs = getFaqs();

  const seoArticle = useMemo(() => {
    const term = zanimanjeName || type;
    const loc = gradName || 'Srbiji';
    return `Svet Građevine je vodeći digitalni resurs za građevinsko tržište na celokupnoj teritoriji. Bilo da se traže profesionalne preporuke, direktan angažman ili logistička podrška poput iznajmljivanja opreme, mašina i radničkog smeštaja — napredni algoritmi filtriranja izdvajaju relevantne informacije. Kada tražite ${term.toLowerCase()} u ${loc}, ključno je osloniti se na ažurne, nezavisno verifikovane ocene da biste maksimizovali efikasnost budžeta i osigurali vremenske okvire vašeg projekta.`;
  }, [type, gradName, zanimanjeName]);

  const termForTitle = zanimanjeName || (type.charAt(0).toUpperCase() + type.slice(1));
  const locForTitle = gradName ? `u mestu ${gradName}` : 'u Srbiji';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 w-full py-12 lg:py-20 relative z-10">
      {/* FAQ Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Naslovna",
                "item": APP_CONFIG.BASE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": type.charAt(0).toUpperCase() + type.slice(1),
                "item": `${APP_CONFIG.BASE_URL}/${type}`
              },
              (zanimanjeName || gradName) ? {
                "@type": "ListItem",
                "position": 3,
                "name": zanimanjeName || gradName,
                "item": `${APP_CONFIG.BASE_URL}${getModuleUrl(type, locationSlug, zanimanje)}`
              } : null
            ].filter(Boolean)
          }
        ])}
      </script>

      <div className="bg-[#050A0F]/80 border border-white/10 rounded-2xl px-6 py-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative">
        <div className="absolute top-4 right-6 flex items-center gap-2">
          <time dateTime={new Date().toISOString()} className="text-xs text-white/60 uppercase font-mono">
            OSVEŽENO: {new Date().toLocaleDateString('sr-RS')}
          </time>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        </div>

        <div className="space-y-16">
          
          {/* SEO Text Block Intro (Always Visible) */}
          <article className="max-w-5xl mx-auto">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-12">
                <h2 className="text-xl md:text-3xl font-bold text-white uppercase tracking-wide leading-tight m-0">
                  {type.replace('-', ' ')} {gradName ? `u mestu ${gradName}` : 'u Srbiji'}
                </h2>
                <p className="text-lg md:text-xl text-white/60 font-medium leading-relaxed m-0">
                  {getIntro()}
                  {itemCount !== undefined && itemCount > 0 && (
                    <span className="inline-block ml-3 px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-secondary/20" data-status="live">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary mr-2 animate-pulse" />
                      {itemCount} AKTIVNIH OGLASA
                    </span>
                  )}
                </p>
              </div>
            </div>
          </article>

          {/* Collapsible Container */}
          <Accordion title="Više informacija">
            <div className="space-y-16">
              {/* Detailed SEO Article */}
              <article className="max-w-5xl mx-auto">
                <div className="prose prose-invert max-w-none">
                  <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 mt-6 items-stretch">
                    {marketInsights && (
                      <div className="lg:w-1/2 py-10 px-8 bg-white/[0.03] border-t-2 border-secondary rounded-b-xl rounded-tr-xl shadow-2xl relative group flex flex-col justify-center">
                        <div className="absolute -top-3 -left-3 w-7 h-7 bg-secondary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,183,0,0.5)]">
                          <BarChart3 className="w-4 h-4 text-[#050A0F]" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                            <h4 className="text-xs font-black text-secondary uppercase tracking-[0.2em] leading-none">Analitika Tržišta</h4>
                          </div>
                          <p className="text-base text-white/70 leading-relaxed m-0 font-sans italic">
                            {marketInsights.split(' ').map((word, i) => {
                              const highlights = [
                                'raspon', 'plata', 'potražnja', 'visoka', 'PIB', 'licence', 'atesti', 
                                'katastarske', 'uknjiženost', 'visoka,', 'HACCP', 'dnevnice', 'portfolio', 
                                'kapaciteta', 'servis', 'nutritivno', 'izvođača', 'vlasnik', 'najma', 'prodaje'
                              ];
                              const cleanWord = word.replace(/[.,-]/g, '').replace('HACCP-a', 'HACCP');
                              if (highlights.some(h => cleanWord.toLowerCase() === h.toLowerCase())) {
                                return <span key={i} className="text-secondary font-bold">{word} </span>;
                              }
                              return word + ' ';
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className={`text-base text-white/60 leading-relaxed font-body flex items-center m-0 ${marketInsights ? 'lg:w-1/2' : 'w-full'}`}>
                      {seoArticle}
                    </p>
                  </div>
                </div>
              </article>

              {/* Centered Trust Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full py-6 md:py-12">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-10 flex flex-col items-center text-center group hover:bg-white/[0.05] transition-all hover:border-secondary/20">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-7 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-[30px] h-[30px] text-secondary" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-widest mb-2">PROVERENI OGLAŠIVAČI</span>
                  <p className="text-[11px] text-white/40 leading-tight uppercase font-bold">Sigurnost na prvom mestu</p>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-10 flex flex-col items-center text-center group hover:bg-white/[0.05] transition-all hover:border-secondary/20">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-7 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-[30px] h-[30px] text-secondary" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-widest mb-2">DIREKTAN KONTAKT</span>
                  <p className="text-[11px] text-white/40 leading-tight uppercase font-bold">Bez posrednika i provizije</p>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-10 flex flex-col items-center text-center group hover:bg-white/[0.05] transition-all hover:border-secondary/20">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-7 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-[30px] h-[30px] text-secondary" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-widest mb-2">MAKSIMALAN DOSEG</span>
                  <p className="text-[11px] text-white/40 leading-tight uppercase font-bold">Vidljivost u celoj Srbiji</p>
                </div>
              </div>

              {/* FAQ Section */}
              <section className="pt-4" aria-labelledby="faq-heading">
                <div className="flex items-center gap-3 mb-14">
                  <div className="w-10 h-10 rounded-xl bg-secondary/5 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-white m-0">Često postavljana pitanja</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                  {faqs.map((faq, index) => (
                    <article key={index} className="space-y-4 group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <div className="flex items-start gap-4">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary/40 group-hover:bg-secondary transition-colors" />
                        <h3 className="text-base font-semibold text-white/80 leading-snug tracking-tight m-0" itemProp="name">{faq.question}</h3>
                      </div>
                      <div className="pl-5.5" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="text-sm text-white/50 leading-relaxed m-0" itemProp="text">{faq.answer}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Semantic Tags at the very bottom */}
              <div className="pt-12 border-t border-white/5 opacity-50">
                <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono">
                  <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest mr-2">INDEX_ENTITIES:</span>
                  {getLSIKeywords().split(',').map((tag, i) => (
                    <span key={i} className="text-[10px] text-white/30 uppercase hover:text-white/60 transition-colors">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Related Categories Navigation */}
              <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pt-16 border-t border-white/10" aria-label="Sekundarna navigacija za pretragu">
                <div className="space-y-6 lg:col-span-3">
                  <h3 className="font-bold text-secondary uppercase text-[12px] tracking-[0.1em]">Povezane lokacije</h3>
                  <ul className="flex flex-wrap gap-2">
                    {nearbyLocations.map(loc => (
                      <li key={loc.slug}>
                        <Link to={getModuleUrl(type, loc.slug, zanimanje)} title={`${termForTitle} ${loc.name}`} className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">
                          {loc.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-6 lg:col-span-5">
                  <h3 className="font-bold text-secondary uppercase text-[12px] tracking-[0.1em]">Srodne kategorije</h3>
                  <ul className="flex flex-wrap gap-2">
                    {relatedCategories.map((cat: any) => (
                      <li key={cat.slug || cat.id}>
                        <Link to={getModuleUrl(type, actualGrad, cat.slug || cat.id)} title={`${cat.name} ${locForTitle}`} className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6 lg:col-span-4">
                  <h3 className="font-bold text-secondary uppercase text-[12px] tracking-[0.1em]">Glavne sekcije</h3>
                  <ul className="flex flex-wrap gap-2">
                    <li><Link to="/" title="Naslovna strana Svet Građevine" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Naslovna</Link></li>
                    <li><Link to="/poslovi" title="Poslovi u građevinarstvu" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Poslovi</Link></li>
                    <li><Link to="/majstori" title="Baza građevinskih majstora" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Majstori</Link></li>
                    <li><Link to="/firme" title="Baza građevinskih firmi" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Firme</Link></li>
                    <li><Link to="/smestaj" title="Smeštaj za radnike" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Smeštaj</Link></li>
                    <li><Link to="/ketering" title="Radnički ketering" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Ketering</Link></li>
                    <li><Link to="/alat-i-oprema" title="Berza i prodaja alata i opreme" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Alat i oprema</Link></li>
                    <li><Link to="/masine" title="Najam i prodaja građevinskih mašina" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Mašine</Link></li>
                    <li><Link to="/placevi" title="Gradjevinski placevi i zemljišta" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Placevi</Link></li>
                    <li><Link to="/plate" title="Plate u građevini" className="px-4 py-2 bg-white/[0.03] rounded-lg text-[13px] font-medium text-white/40 hover:text-secondary hover:bg-secondary/10 transition-all block text-center">Plate</Link></li>
                  </ul>
                </div>
              </nav>
            </div>
          </Accordion>

          {/* Toggle Button for Mobile */}
          
        </div>
      </div>
    </section>
  );
}
