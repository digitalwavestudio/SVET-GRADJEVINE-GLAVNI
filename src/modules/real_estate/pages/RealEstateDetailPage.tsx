import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import SeoHead from '@/src/components/SeoHead';
import { generateRealEstateSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import { ACCESS_ROAD_TYPES, LOCATIONS, REAL_ESTATE_PURPOSES } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { useRealEstateDetails, useRealEstateMutations } from '@/src/modules/real_estate/hooks/useRealEstate';
import { RealEstatePlot } from '@/src/modules/real_estate/services/realEstateService';
import { useFavoriteIds } from '@/src/modules/dashboard/hooks/useFavorites';
import { db } from '@/src/firebase-db';

import { 
  Maximize, 
  MapPin, 
  Route, 
  Zap, 
  FileText, 
  ArrowDown, 
  Factory,
  Globe,
  Waves,
  Wifi,
  Construction,
  Heart
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import PropertyGrid from '@/src/modules/core/components/details/PropertyGrid';
import StickyContactCard from '@/src/modules/core/components/details/StickyContactCard';
import AdminActionToolbar from '@/src/modules/dashboard/components/details/AdminActionToolbar';

export default function RealEstateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plot, isLoading: loading } = useRealEstateDetails(id || '');
  const { user, toggleSavedAd } = useAuth();
  const { startConversation } = useMessages();
  
  const { data: favoriteIds } = useFavoriteIds(user?.id);
  const isSaved = favoriteIds?.ads?.includes(id || '') || false;

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    await toggleSavedAd?.(id || '', 'plot');
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    if (!plot) return;
    if (user.id === plot.authorId) {
      alert("Ne možete započeti prepisku sa samim sobom.");
      return;
    }

    try {
      const convId = await startConversation(
        plot.authorId || '',
        { id: plot.id || '', type: 'plot', title: plot.title },
        `Zdravo, pišem Vam u vezi oglasa za plac: ${plot.title}`
      );
      navigate(`/poruke?id=${convId}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Greška pri pokretanju prepiske.");
    }
  };

  const { updatePlot } = useRealEstateMutations();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { isTrackedInSession } = useTrackView(id, 'listings', plot?.authorId);

  const isAdmin = Boolean(user?.email && (user.role === 'admin' || user.isAdmin || user.email === 'mancoresolution@gmail.com'));

  const handleAdminAction = async (action: 'approve' | 'premium' | 'urgent' | 'delete') => {
    if (!isAdmin || !plot || !id) return;
    setIsUpdatingStatus(true);
    try {
      const updates: Partial<RealEstatePlot> = {};
      
      if (action === 'approve') updates.status = 'active';
      if (action === 'premium') updates.isPremium = !plot.isPremium;
      if (action === 'urgent') updates.isUrgent = !plot.isUrgent;
      if (action === 'delete') updates.status = 'deleted';
      
      await updatePlot({ id, updates });
      alert("Plac uspešno ažuriran!");
    } catch (error) {
      console.error("Admin action error:", error);
      alert("Greška pri ažuriranju placa.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  const infra = useMemo(() => {
    if (!plot?.infrastructure) return {} as any;
    if (Array.isArray(plot.infrastructure)) {
      return {
        struja: plot.infrastructure.includes('struja') || plot.infrastructure.includes('electricity'),
        voda: plot.infrastructure.includes('voda') || plot.infrastructure.includes('water'),
        kanalizacija: plot.infrastructure.includes('kanalizacija') || plot.infrastructure.includes('sewer'),
        gas: plot.infrastructure.includes('gas'),
        optika: plot.infrastructure.includes('optika') || plot.infrastructure.includes('internet'),
      };
    }
    return plot.infrastructure;
  }, [plot]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-white">
      <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-transparent rounded-full"></div>
    </div>
  );

  if (!plot) return (
    <div className="min-h-screen bg-surface pt-40 flex flex-col items-center">
       <h1 className="text-4xl font-black text-white/20 uppercase tracking-widest">Plac nije pronađen</h1>
       <Link to="/placevi" className="text-secondary mt-8 uppercase font-black hover:underline">Svi Placevi</Link>
    </div>
  );

  const locationName = LOCATIONS.find(l => l.slug === plot.locationSlug)?.name || plot.location || 'Srbija';
  const purposeName = REAL_ESTATE_PURPOSES.find(p => p.slug === plot.purpose || p.id === plot.purpose)?.name || plot.purpose || 'PLAC';
  const accessRoadName = ACCESS_ROAD_TYPES.find(a => a.slug === plot.accessRoad || a.id === plot.accessRoad)?.name || plot.accessRoad || 'N/A';

  const realEstateSchema = useMemo(() => {
    return generateRealEstateSchema(plot, locationName, purposeName, `${APP_CONFIG.BASE_URL}/nekretnine/${plot.id}`);
  }, [plot, locationName, purposeName]);

  const breadcrumbSchema = useMemo(() => {
    return generateBreadcrumbSchema([
      { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
      { name: "Placevi", url: `${APP_CONFIG.BASE_URL}/placevi` },
      { name: plot.title, url: `${APP_CONFIG.BASE_URL}/nekretnine/${plot.id}` }
    ]);
  }, [plot]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body pb-32">
       <AdminActionToolbar 
          views={(plot.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
          isPremium={plot.isPremium}
          onEdit={() => navigate(`/postavi-oglas?edit=${plot.id}&category=plot`)}
          onDelete={() => handleAdminAction('delete')}
          onTogglePremium={() => handleAdminAction('premium')}
        />
      <SeoHead 
        title={`${plot.title} | ${purposeName} | Svet Građevine`}
        description={plot.description || `${purposeName} plac u mestu ${locationName}. Površina: ${plot.area} ${plot.areaUnit}. Pogledajte detalje i dokumentaciju.`}
        image={plot.images?.[0]}
        url={`${APP_CONFIG.BASE_URL}/nekretnine/${plot.id}`}
        type="website"
        jsonLd={[realEstateSchema, breadcrumbSchema]}
      />
      
      <main className="max-w-7xl mx-auto px-6">
        <Breadcrumbs items={[
          { label: 'Placevi', path: '/placevi' },
          { label: LOCATIONS.find(l => l.slug === plot.locationSlug)?.name || 'Srbija', path: `/placevi?grad=${plot.locationSlug}` },
          { label: plot.title }
        ]} />
        
        <div className="mb-10">
          <Link to="/placevi" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-8">
             <span className="material-symbols-outlined text-sm">arrow_back</span>
             Nazad na placeve
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-white/10">
             <div className="flex-1">
                <div className="flex items-center flex-wrap gap-3 mb-4">
                  <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                    {purposeName}
                  </span>
                  <span className="bg-white/5 text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 border border-white/10">
                    <span className="material-symbols-outlined text-[10px]">visibility</span>
                    {(plot.viewsCount || 0) + (isTrackedInSession ? 1 : 0)} pregleda
                  </span>
                  {plot.isPremium && (
                    <span className="bg-secondary text-slate-950 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">star</span> PREMIUM
                    </span>
                  )}
                  {plot.isUrgent && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">local_fire_department</span> HITNO
                    </span>
                  )}
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h1 id="real-estate-title" className="text-4xl md:text-5xl lg:text-6xl font-black font-headline tracking-tighter uppercase leading-[1.1] text-white">
                    {plot.title}
                  </h1>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleFavorite}
                    className={`shrink-0 w-16 h-16 rounded-[10px] flex items-center justify-center border transition-all duration-300 ${
                      isSaved 
                        ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/20' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isSaved ? 'saved' : 'unsaved'}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 500,
                          damping: 15
                        }}
                      >
                        <Heart fill={isSaved ? "currentColor" : "none"} size={28} />
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mt-6 flex items-center gap-2">
                   <span className="material-symbols-outlined text-secondary">location_on</span>
                   {plot.location}
                </p>
             </div>
             <div className="bg-gradient-to-br from-surface-container-highest to-surface-container-high p-8 rounded-[10px] border border-white/10 text-right md:min-w-[300px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2">Vrednost investicije</p>
                  <div className="text-5xl font-black text-secondary tracking-tight">
                    {plot.price ? `€${plot.price.toLocaleString()}` : 'NA UPIT'}
                  </div>
                </div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/10 blur-[50px] rounded-full pointer-events-none"></div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 flex flex-col gap-12">
            {/* Premium Gallery */}
            <div className="flex flex-col gap-4">
              <div className="rounded-[10px] overflow-hidden border border-white/10 bg-surface-container-low aspect-[21/9] relative group">
                {plot.imageStatus === 'processing' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-high animate-pulse">
                    <span className="material-symbols-outlined text-6xl text-secondary mb-4 animate-spin">sync</span>
                    <span className="text-white/40 font-bold tracking-widest text-xs uppercase">Slike se obrađuju...</span>
                  </div>
                ) : plot.images && plot.images.length > 0 ? (
                  <OptimizedImage src={plot.images[0]} fallbackType="real_estate" alt={plot.title || "Slika nekretnine"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-high">
                    <span className="material-symbols-outlined text-6xl text-white/5 mb-4">landscape</span>
                    <span className="text-white/20 font-bold tracking-widest text-xs uppercase">Nema slike</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              </div>
              
              {plot.imageStatus !== 'processing' && plot.images && plot.images.length > 1 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {plot.images.slice(1, 5).map((img: string, idx: number) => (
                    <div key={idx} className="rounded-[10px] overflow-hidden border border-white/5 aspect-video relative group cursor-pointer">
                      <OptimizedImage src={img} fallbackType="real_estate" alt="Slika" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {idx === 3 && plot.images?.length && plot.images.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all group-hover:bg-black/40">
                          <span className="text-white font-black text-xl">+{plot.images.length - 5}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Features Overview */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-high p-6 rounded-[10px] border border-white/5 flex flex-col items-start gap-4 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined">aspect_ratio</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Ukupna Površina</p>
                  <p className="text-xl font-black text-white">{plot.area} {plot.areaUnit}</p>
                </div>
              </div>
              <div className="bg-surface-container-high p-6 rounded-[10px] border border-white/5 flex flex-col items-start gap-4 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined">category</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Tip Zemljišta</p>
                  <p className="text-lg font-black text-white uppercase">{purposeName}</p>
                </div>
              </div>
              <div className="bg-surface-container-high p-6 rounded-[10px] border border-white/5 flex flex-col items-start gap-4 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined">route</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Pristup / Put</p>
                  <p className="text-lg font-black text-white uppercase">{accessRoadName}</p>
                </div>
              </div>
              <div className="bg-surface-container-high p-6 rounded-[10px] border border-white/5 flex flex-col items-start gap-4 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div>
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Infrastruktura</p>
                  <p className="text-sm font-bold text-white uppercase">
                    {[
                      infra?.struja && 'Struja',
                      infra?.voda && 'Voda',
                      infra?.gas && 'Gas'
                    ].filter(Boolean).slice(0,2).join(', ') || 'Delimična'}
                    {(infra?.struja && infra?.voda && infra?.gas) && '+'}
                  </p>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="bg-surface-container-low p-8 md:p-12 rounded-[10px] border border-white/5">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-secondary"></span>
                PREDMET PRODAJE / ZAKUPA
              </h2>
              <div className="text-white/80 leading-loose font-medium text-lg whitespace-pre-wrap">
                {plot.description || 'Detaljan opis nije unet.'}
              </div>
            </section>

            {/* Deep Specs: Infrastructure & Urbanism */}
            <section className="flex flex-col gap-6">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-3">
                <span className="w-8 h-[2px] bg-secondary"></span>
                DETALJNI TEHNIČKI PODACI
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">settings_input_component</span>
                    INFRASTRUKTURNA OPREMLJENOST
                  </h3>
                  <div className="flex flex-col gap-4">
                    {[
                      { id: 'struja', label: 'Električna energija', icon: 'bolt', condition: infra?.struja },
                      { id: 'voda', label: 'Vodovodna mreža', icon: 'water_drop', condition: infra?.voda },
                      { id: 'kanalizacija', label: 'Kanalizacija', icon: 'waves', condition: infra?.kanalizacija },
                      { id: 'gas', label: 'Gasna infrastruktura', icon: 'mode_fan', condition: infra?.gas },
                      { id: 'optika', label: 'Optički internet', icon: 'wifi', condition: infra?.optika },
                      { id: 'heating', label: 'Grejanje / Daljinsko', icon: 'heat', condition: plot.heating },
                      { id: 'telephone', label: 'Telekomunikacije', icon: 'call', condition: plot.telephone },
                      { id: 'technicalWater', label: 'Tehnička voda', icon: 'water_damage', condition: plot.technicalWater },
                      { id: 'drinkingWater', label: 'Pijaća voda (izvor/bunar)', icon: 'water_drop', condition: plot.drinkingWater },
                    ].filter(inf => inf.condition || ['struja', 'voda', 'kanalizacija', 'gas', 'optika'].includes(inf.id)).map(inf => {
                      const hasIt = inf.condition;
                      return (
                        <div key={inf.id} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-4 text-on-surface-variant">
                            <span className="material-symbols-outlined text-base bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">{inf.icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest">{inf.label}</span>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-[10px] ${hasIt ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                            {hasIt ? 'DOSTUPNO' : 'NIJE DOSTUPNO'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {(plot.cadastralNumber || plot.cadastralMunicipality || plot.parcelNumbers) && (
                    <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">map</span>
                        KATASTARSKE INFORMACIJE
                      </h3>
                      <dl className="flex flex-col gap-4">
                        {plot.cadastralNumber && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Glavni broj parcele</dt>
                            <dd className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-[10px]">{plot.cadastralNumber}</dd>
                          </div>
                        )}
                        {plot.parcelNumbers && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Sve parcele</dt>
                            <dd className="text-xs font-bold text-white max-w-[200px] text-right truncate" title={plot.parcelNumbers}>{plot.parcelNumbers}</dd>
                          </div>
                        )}
                        {plot.cadastralMunicipality && (
                          <div className="flex justify-between items-center">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">K.O. (Opština)</dt>
                            <dd className="text-sm font-bold text-white uppercase">{plot.cadastralMunicipality}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {(plot.occupancy || plot.buildabilityIndex || plot.maxFloors || plot.plannedPurpose || plot.buildingHeight) && (
                    <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">architecture</span>
                        URBANISTIČKI PARAMETRI
                      </h3>
                      <dl className="flex flex-col gap-4">
                        {plot.plannedPurpose && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Namena / Urban. plan</dt>
                            <dd className="text-xs font-black text-white max-w-[150px] text-right truncate" title={plot.plannedPurpose}>{plot.plannedPurpose}</dd>
                          </div>
                        )}
                        {plot.occupancy && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Zauzetost (%)</dt>
                            <dd className="text-sm font-black text-white">{plot.occupancy}%</dd>
                          </div>
                        )}
                        {plot.buildabilityIndex && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Indeks izgrađenosti</dt>
                            <dd className="text-sm font-black text-white">{plot.buildabilityIndex}</dd>
                          </div>
                        )}
                        {plot.buildingHeight && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Maks. visina objekta</dt>
                            <dd className="text-sm font-black text-white">{plot.buildingHeight}m</dd>
                          </div>
                        )}
                        {plot.maxFloors && (
                          <div className="flex justify-between items-center">
                            <dt className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Maksimalna spratnost</dt>
                            <dd className="text-sm font-black text-white uppercase">P + {Math.max(0, plot.maxFloors - 1)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>

              {/* Infrastructure & Access */}
              {(plot.railAccess || plot.highwayAccess || plot.airportAccess || (plot.accessRoad && plot.accessRoad !== 'zemlja')) && (
                <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">location_on</span>
                    PRISTUP LOKACIJI I INFRASTRUKTURA
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { id: 'road', label: `${accessRoadName}`, icon: 'route', active: !!plot.accessRoad },
                       { id: 'railAccess', label: 'Železnički priključak', icon: 'train', active: plot.railAccess },
                       { id: 'highwayAccess', label: 'Pristup autoputu', icon: 'add_road', active: plot.highwayAccess },
                       { id: 'airportAccess', label: 'Blizina aerodroma', icon: 'flight_takeoff', active: plot.airportAccess },
                     ].filter(i => i.active).map(item => (
                       <div key={item.id} className="flex flex-col items-center justify-center text-center p-4 rounded-[10px] border border-secondary/20 bg-secondary/5">
                         <span className="material-symbols-outlined text-3xl text-secondary mb-2">{item.icon}</span>
                         <span className="text-[9px] font-black uppercase tracking-widest text-white">{item.label}</span>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* Economic / Investment Data */}
              {(plot.municipalityName || plot.averageSalary || plot.marketValueEstimate || plot.developmentFeeBusiness || plot.developmentFeeResidential || plot.freeZone || plot.greenEnergySuitable) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">account_balance</span>
                      LOKALNA SAMOUPRAVA I EKONOMIJA
                    </h3>
                    <div className="flex flex-col gap-4">
                      {plot.municipalityName && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Pripadajuća opština</span>
                          <span className="text-xs font-black text-white">{plot.municipalityName}</span>
                        </div>
                      )}
                      {plot.populationEstimate && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Procenjen br. stanovnika</span>
                          <span className="text-xs font-black text-white">{plot.populationEstimate.toLocaleString()}</span>
                        </div>
                      )}
                      {plot.averageSalary && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Prosečna zarada</span>
                          <span className="text-xs font-black text-white">{plot.averageSalary.toLocaleString()} RSD</span>
                        </div>
                      )}
                      {plot.developmentFeeBusiness && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Naknada (Poslovni obj.)</span>
                          <span className="text-xs font-black text-white">{plot.developmentFeeBusiness}</span>
                        </div>
                      )}
                      {plot.developmentFeeResidential && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Naknada (Stambeni obj.)</span>
                          <span className="text-xs font-black text-white">{plot.developmentFeeResidential}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">monitoring</span>
                      INVESTICIONI POKAZATELJI
                    </h3>
                    <div className="flex flex-col gap-4">
                      {plot.marketValueEstimate && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tržišna procena</span>
                          <span className="text-xs font-black text-white bg-white/5 px-3 py-1 rounded-[10px]">{plot.marketValueEstimate}</span>
                        </div>
                      )}
                      {plot.parkingStandard && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Parking (Poslovni)</span>
                          <span className="text-xs font-black text-white">{plot.parkingStandard}</span>
                        </div>
                      )}
                      {plot.productionParkingStandard && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Parking (Proizvodnja)</span>
                          <span className="text-xs font-black text-white">{plot.productionParkingStandard}</span>
                        </div>
                      )}
                      {plot.freeZone && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Režim Slobodne Zone</span>
                          <span className="text-xs font-black uppercase px-2 py-1 bg-green-500/20 text-green-400 rounded">Da</span>
                        </div>
                      )}
                      {plot.greenEnergySuitable && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Solarni Potencijal</span>
                          <span className="text-xs font-black uppercase px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">Pogodno</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Documents & Notes */}
            {( (plot.docs && plot.docs.length > 0) || plot.notes) && (
               <section className="flex flex-col gap-6">
                 <h2 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-3">
                   <span className="w-8 h-[2px] bg-secondary"></span>
                   DODATNI RESURSI
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {plot.docs && plot.docs.length > 0 && (
                     <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5">
                       <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                         <span className="material-symbols-outlined text-secondary">folder_open</span>
                         DOKUMENTACIJA
                       </h3>
                       <div className="flex flex-col gap-3">
                         {plot.docs.map((doc: { label: string; url: string }, idx: number) => (
                           <a 
                             key={idx} 
                             href={doc.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-between bg-white/5 p-4 rounded-[10px] border border-white/5 hover:bg-white/10 hover:border-secondary/30 transition-all group"
                           >
                             <div className="flex items-center gap-4">
                               <span className="material-symbols-outlined text-secondary">description</span>
                               <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-secondary transition-colors truncate max-w-[150px] sm:max-w-[200px]">{doc.label || 'Preuzmi dokument'}</span>
                             </div>
                             <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition-colors">download</span>
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                   {plot.notes && (
                     <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5">
                       <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                         <span className="material-symbols-outlined text-secondary">sticky_note_2</span>
                         NAPOMENE
                       </h3>
                       <div className="text-on-surface-variant text-sm font-medium leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-[10px] border border-white/5">
                         {plot.notes}
                       </div>
                     </div>
                   )}
                 </div>
               </section>
            )}
          </div>

          <aside className="lg:col-span-4">
            <StickyContactCard 
              phone={plot.contact?.phone || ''}
              email={plot.contact?.email}
              authorName={plot.contact?.person}
              isVerified={true}
              avatar={plot.companyLogo}
              price={plot.price}
              currency="EUR"
              onMessage={handleStartChat}
            />
          </aside>
        </div>
        <RelatedSEO locationSlug={plot.locationSlug} currentType="plots" />
      </main>
    </div>
  );
}
