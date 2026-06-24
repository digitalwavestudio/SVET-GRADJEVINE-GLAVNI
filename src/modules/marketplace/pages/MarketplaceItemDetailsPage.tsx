import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MarketplaceItem } from '@/src/modules/marketplace/types/models';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { sanitizeRichText } from '@/src/lib/sanitize';
import { Button, Card, Badge } from '@svet-gradjevine/ui';
import { 
  MapPin, 
  Clock, 
  Euro, 
  User, 
  Phone, 
  MessageSquare, 
  ChevronLeft,
  Share2,
  Flag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Box,
  Truck,
  Eye
} from 'lucide-react';
import { formatDate } from '@/src/lib/dateUtils';
import { useTrackView } from '@/src/hooks/useTrackView';
import { MARKETPLACE_CATEGORIES } from '@/src/constants/taxonomy';
import { motion } from 'motion/react';
import SeoHead from '@/src/components/SeoHead';
import { generateProductSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';

import { useItemDetails } from '@/src/modules/marketplace/hooks/useMarketplace';

const MarketplaceItemDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading: loading } = useItemDetails(id || '');

  const { isTrackedInSession } = useTrackView(id, 'marketplace', item?.authorId);

  const cleanDescription = useMemo(() => {
    if (!item?.description) return '';
    return item.description.replace(/<[^>]*>?/gm, '');
  }, [item?.description]);

  const seoSchema = useMemo(() => {
    if (!item) return null;
    return generateProductSchema(item, 'berza');
  }, [item]);

  const breadcrumbSchema = useMemo(() => {
    if (!item) return null;
    return generateBreadcrumbSchema([
      { name: "Početna", url: "https://svetgradjevine.com/" },
      { name: "Alat i oprema", url: "https://svetgradjevine.com/alat-i-oprema" },
      { name: item.title, url: `https://svetgradjevine.com/alat-i-oprema/${item.id}` }
    ]);
  }, [item]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1219] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0B1219] flex flex-col items-center justify-center p-4 text-center">
        <Box className="w-20 h-20 text-slate-700 mb-6" />
        <h2 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tight">Oglas nije pronađen</h2>
        <p className="text-slate-400 mb-8 max-w-sm">Moguće je da je oglas istekao ili je obrisan od strane prodavca.</p>
        <Link to="/alat-i-oprema">
          <Button variant="secondary" className="px-12">Nazad na ponudu</Button>
        </Link>
      </div>
    );
  }

  const categoryLabel = MARKETPLACE_CATEGORIES.find(c => c.id === item.categoryId)?.name || item.categoryId;

  return (
    <div className="min-h-screen bg-[#0B1219] pb-20 pt-24 text-white">
      <SeoHead
        title={`${item.title} | Alat i oprema — Svet Građevine`}
        description={cleanDescription.substring(0, 160)}
        image={item.image || "https://svetgradjevine.com/logo.webp"}
        url={`https://svetgradjevine.com/alat-i-oprema/${item.id}`}
        type="website"
        jsonLd={[seoSchema, breadcrumbSchema]}
      />
      {/* Top Navigation Bar */}
      <div className="bg-[#0B1219]/80 backdrop-blur-xl border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/alat-i-oprema" className="flex items-center text-slate-400 hover:text-secondary font-black text-[10px] uppercase tracking-widest transition-colors">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Nazad na ponudu
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white rounded-[10px] h-10 px-4">
              <Share2 className="w-4 h-4 mr-2" />
              Podeli
            </Button>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-400 hover:text-red-500 rounded-[10px] h-10 px-4">
              <Flag className="w-4 h-4 mr-2" />
              Prijavi
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:grid lg:grid-cols-3 gap-12">
        <article className="lg:col-span-2 space-y-12" aria-labelledby="marketplace-title">
          {/* Main Visuals & Title */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      {categoryLabel}
                    </Badge>
                    {item.isUrgent && <Badge variant="warning" className="px-3 py-1 font-black italic">HITNO</Badge>}
                    <span className="bg-white/5 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 border border-white/10">
                      <Eye className="w-3 h-3" />
                      {(item.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
                    </span>
                  </div>
                  <h1 id="marketplace-title" className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[0.9] uppercase italic">
                    {item.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-secondary" />
                      {item.location}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-secondary" />
                      Objavljeno: {formatDate((item.createdAt as any)?.toDate ? (item.createdAt as any).toDate() : item.createdAt)}
                    </span>
                  </div>
               </div>
               <div className="bg-white/5 border border-white/10 px-8 py-6 rounded-[10px] text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cena</p>
                  <div className="text-4xl font-black text-white italic">
                    {item.price} <span className="text-lg text-slate-500 not-italic">EUR</span>
                  </div>
               </div>
            </div>

            <Card className="glass-card overflow-hidden border-none rounded-[10px] p-4 shadow-2xl shadow-black/50">
               <div className="aspect-video bg-slate-900/50 relative rounded-[2.5rem] overflow-hidden group">
                 {item.image ? (
                   <OptimizedImage 
                     src={item.image} 
                     fallbackType="machine" 
                     alt={item.title} 
                     className="w-full h-full object-cover" 
                     containerClassName="w-full h-full"
                     isProcessing={(item as any).imageStatus === 'processing'}
                   /> 
                      
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-800">
                     <Box className="w-32 h-32 opacity-10" />
                   </div>
                 )}
                 {item.isPremium && (
                   <div className="absolute top-8 left-8">
                     <Badge variant="secondary" className="bg-indigo-600 text-white border-none px-6 py-2 text-xs font-black italic shadow-2xl">PREMIUM OGLAS</Badge>
                   </div>
                 )}
               </div>
            </Card>

            <div className="bg-white/5 rounded-[10px] p-10 border border-white/5 space-y-12 shadow-xl">
              <div>
                <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <Zap className="w-4 h-4" />
                  Opis i specifikacija
                </h2>
                <div 
                  className="prose prose-invert prose-slate max-w-none text-slate-300 font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.description) }}
                />
              </div>

              {item.features && item.features.length > 0 && (
                <div className="pt-12 border-t border-white/5" id="ai-facts-list">
                  <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-8">Karakteristike predmeta (Fact-Sheet)</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center text-sm font-bold text-slate-300 bg-white/5 p-4 rounded-[10px] border border-white/5">
                        <ShieldCheck className="w-5 h-5 mr-4 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="flex gap-4 p-6 bg-white/5 rounded-[10px] border border-white/5">
                    <Truck className="w-8 h-8 text-secondary flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-white italic uppercase tracking-tight mb-2">Dostava / Preuzimanje</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Dogovor sa prodavcem oko slanja kurirskom službom ili ličnog preuzimanja na lokaciji.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 p-6 bg-white/5 rounded-[10px] border border-white/5">
                    <ShieldCheck className="w-8 h-8 text-secondary flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-white italic uppercase tracking-tight mb-2">Bezbedna Trgovina</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Svet Građevine preporučuje plaćanje nakon pregleda robe. Budite oprezni.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-8" aria-label="Informacije o prodavcu">
          <Card className="glass-card p-10 border-none shadow-2xl bg-secondary rounded-[10px] !text-black relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <User className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-slate-900/50 uppercase tracking-[0.3em] mb-8 flex items-center ">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Informacije o prodavcu
              </h3>
              
              <div className="mb-8">
                 <p className="text-3xl font-black italic uppercase tracking-tight leading-none mb-2">{item.seller}</p>
                 <Badge variant="outline" className="bg-slate-950/10 !text-black border-slate-950/20 px-3 py-1 font-bold text-[9px] uppercase tracking-widest">
                   PROVEREN PRODAVAC
                 </Badge>
              </div>
              
              <div className="space-y-3">
                {item.phone && (
                  <a href={`tel:${item.phone}`} className="flex items-center justify-center gap-3 bg-slate-950 text-white h-16 rounded-[10px] font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-black/20">
                    <Phone className="w-5 h-5" />
                    POZOVI PRODAVCA
                  </a>
                )}
                {item.whatsapp && (
                  <a href={`https://wa.me/${item.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 bg-emerald-600 text-white h-16 rounded-[10px] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20">
                    <MessageSquare className="w-5 h-5" />
                    PIŠI NA WHATSAPP
                  </a>
                )}
                <Button className="w-full h-16 bg-white/20 hover:bg-white/30 !text-black border-none font-black text-sm uppercase tracking-widest rounded-[10px]">
                  POŠALJI PORUKU
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-950/10">
                 <p className="text-[10px] font-black text-slate-900/50 uppercase tracking-widest text-center">Član od: {formatDate((item.createdAt as any)?.toDate ? (item.createdAt as any).toDate() : item.createdAt)}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-10 bg-white/5 border border-white/5 rounded-[10px] shadow-xl">
            <h3 className="text-sm font-black text-white italic uppercase tracking-tight mb-8 tracking-tight">Korisni saveti</h3>
            <ul className="space-y-6">
              {[
                { title: 'Lična provera', text: 'Uvek pregledajte robu pre plaćanja.' },
                { title: 'Bezbednost', text: 'Ne plaćajte unapred neproverenim osobama.' },
                { title: 'Lokacija', text: 'Sastajte se na javnim, prometnim mestima.' },
                { title: 'Provera cene', text: 'Budite oprezni oko sumnjivo niskih cena.' }
              ].map((tip, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-widest mb-1">{tip.title}</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          
          <Link to="/paketi" className="block p-1 rounded-[3.2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/20 group hover:scale-[1.02] transition-all">
             <div className="bg-[#131B24] rounded-[10px] p-10 text-center group-hover:bg-[#131B24]/90 transition-all">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Euro className="w-10 h-10 text-secondary" />
                </div>
                <h4 className="font-black text-white text-xl mb-2 italic">Izdvoji svoj oglas</h4>
                <p className="text-xs text-slate-500 mb-8 font-medium">Povećaj vidljivost i prodaj brže uz Premium opciju na berzi.</p>
                <div className="inline-flex items-center text-[10px] font-black text-secondary uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                  POGLEDAJ KATEGORIJE <ArrowRight className="w-4 h-4 ml-2" />
                </div>
             </div>
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default MarketplaceItemDetailsPage;
