import { motion } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import SeoHead from '@/src/components/SeoHead';
import { generateMachineSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import {
  DYNAMIC_MACHINE_FIELDS,
  MACHINE_CATEGORIES,
  MACHINE_SUBCATEGORIES
} from '@/src/constants/machineTaxonomy';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { useMachineDetails, useMachineMutations } from '@/src/modules/machines/hooks/useMachines';
import { db } from '@/src/lib/firebase';

import { 
  Calendar, 
  Timer, 
  Zap, 
  CheckCircle2, 
  Weight, 
  Maximize, 
  ArrowDown, 
  Move,
  Settings,
  Truck,
  Fuel,
  Heart,
  Building2,
  MapPin,
  Flag,
  PenSquare
} from 'lucide-react';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import PropertyGrid from '@/src/modules/core/components/details/PropertyGrid';
import StickyContactCard from '@/src/modules/core/components/details/StickyContactCard';
import { StickyDetailCTABar } from '@/src/components/layout/StickyDetailCTABar';
import AdminActionToolbar from '@/src/modules/dashboard/components/details/AdminActionToolbar';


export default function MachineDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: machineData, isLoading: loading } = useMachineDetails(id || '');
  const machine = machineData as any;
  const { updateMachine } = useMachineMutations();
  const { user } = useAuth();
  const { startConversation } = useMessages();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { isTrackedInSession } = useTrackView(id, 'listings', machine?.authorId);

  const isAdmin = Boolean(user?.email && (user.role === 'admin' || user.isAdmin));
  const isOwner = Boolean(user?.id && machine?.authorId && user.id === machine.authorId);
  const handleAdminAction = async (action: 'approve' | 'premium' | 'urgent' | 'delete') => {
    if (!isAdmin || !machine || !id) return;
    setIsUpdatingStatus(true);
    try {
      const updates: any = {};
      
      if (action === 'approve') updates.status = 'active';
      if (action === 'premium') updates.isPremium = !machine.isPremium;
      if (action === 'urgent') updates.isUrgent = !machine.isUrgent;
      if (action === 'delete') updates.status = 'deleted';
      
      await updateMachine({ id, updates });
      alert("Mašina uspešno ažurirana!");
    } catch (error) {
      console.error("Admin action error:", error);
      alert("Greška pri ažuriranju mašine.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartChat = async (customMsg?: string) => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    if (user.id === machine?.authorId) {
      alert("Ne možete započeti prepisku sa samim sobom.");
      return;
    }

    try {
      const convId = await startConversation(
        machine!.authorId,
        { id: machine!.id, type: 'machine', title: machine!.adTitle },
        customMsg || `Zdravo, pišem Vam u vezi oglasa za mašinu: ${machine!.adTitle}`
      );
      navigate(`/poruke?id=${convId}`);
    } catch (err: unknown) {
      alert((err instanceof Error) ? err.message : "Greška pri pokretanju prepiske.");
    }
  };

  const mCategory = machine ? (MACHINE_CATEGORIES.find(c => c.id === machine.categoryId)?.name || machine.categoryId) : "";
  const mSubCategory = machine ? (MACHINE_SUBCATEGORIES[machine.categoryId]?.find(s => s.id === machine.subcategoryId)?.name || machine.subcategoryId) : "";

  const machineSchema = useMemo(() => {
    if (!machine) return null;
    return generateMachineSchema(
      machine, 
      LOCATIONS.find(l => l.slug === machine.locationSlug)?.name || "", 
      mCategory, 
      `${APP_CONFIG.BASE_URL}/gradjevinske-masine/${machine.id}`
    );
  }, [machine, mCategory]);

  const breadcrumbSchema = useMemo(() => {
    if (!machine) return null;
    return generateBreadcrumbSchema([
      { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
      { name: "Mašine", url: `${APP_CONFIG.BASE_URL}/gradjevinske-masine` },
      { name: machine.adTitle, url: `${APP_CONFIG.BASE_URL}/gradjevinske-masine/${machine.id}` }
    ]);
  }, [machine]);

  if (loading) return (
    <div className="min-h-screen bg-[#050f19] flex items-center justify-center">
      <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span>
    </div>
  );
  if (!machine) return (
    <div className="min-h-screen bg-[#050f19] pt-40 flex flex-col items-center">
       <h1 className="text-4xl font-black text-white/20 uppercase tracking-widest">Mašina nije pronađena</h1>
       <Link to="/gradjevinske-masine" className="text-[#ffad3a] mt-8 uppercase font-black hover:underline">Povratak na Mašine</Link>
    </div>
  );

  // Priprema dinamičkih labela
  const dynamicLabels: Record<string, string> = {
    'weight': 'Težina (t)',
    'bucketVolume': 'Zapremina kašike (m³)',
    'digDepth': 'Dubina kopanja (m)',
    'capacity': 'Nosivost (kg/t)',
    'liftHeight': 'Visina dizanja (m)',
    'rollerType': 'Tip valjka'
  };

  const currentDynamicFields = DYNAMIC_MACHINE_FIELDS[machine.subcategoryId] || [];

  return (
    <div className="min-h-screen bg-[#050f19] text-[#dce6f5] font-body selection:bg-secondary selection:!text-black">
      <SeoHead 
        title={`${machine.adTitle} | Građevinske Mašine`}
        description={`Detalji za: ${machine.adTitle}. ${mCategory} - ${mSubCategory}. Lokacija: ${LOCATIONS.find(l => l.slug === machine.locationSlug)?.name}. ${machine.adType === 'prodaja' ? `Cena: ${machine.price}€` : machine.pricePerDay ? `Cena: ${machine.pricePerDay}€ / dan` : ''}`}
        image={machine.images?.[0]}
        url={`${APP_CONFIG.BASE_URL}/gradjevinske-masine/${machine.id}`}
        jsonLd={[machineSchema, breadcrumbSchema]}
      />

      <div className={`hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-8`}>
        <Breadcrumbs items={[
          { label: 'Mašine', path: '/gradjevinske-masine' },
          { label: LOCATIONS.find(l => l.slug === machine.locationSlug)?.name || 'Srbija', path: `/gradjevinske-masine?grad=${machine.locationSlug}` },
          { label: machine.adTitle }
        ]} />
      </div>

      {/* Admin Logic Toolbar */}
      {isAdmin && (
        <AdminActionToolbar 
          views={(machine.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
          isPremium={machine.isPremium}
          onEdit={() => navigate(`/postavi-oglas?edit=${machine.id}&category=machines`)}
          onDelete={() => handleAdminAction('delete')}
          onTogglePremium={() => handleAdminAction('premium')}
        />
      )}

      {/* Modern Header Hero */}
      <div className={`max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mb-12 mt-24 md:mt-0`}>
        <div className="relative border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-4 sm:p-8 lg:p-12 overflow-hidden shadow-2xl">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="space-y-6 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {machine.isPremium && (
                  <span className="bg-gradient-to-r from-secondary/20 to-yellow-600/20 text-secondary border border-secondary/20 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(254,191,13,0.15)]">
                    <Zap size={14} className="fill-secondary" /> PLAĆENI OGLAS
                  </span>
                )}
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${machine.adType === 'prodaja' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-secondary/10 text-secondary border-secondary/30'}`}>
                  <Settings size={14} /> {machine.adType === 'prodaja' ? 'PRODAJA' : 'IZNAJMLJIVANJE'}
                </span>
                {machine.condition === 'novo' && (
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    NOVO
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="space-y-4 max-w-4xl">
                <h1 id="machine-title" className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase">
                  {machine.adTitle || machine.title || "GRAĐEVINSKA MAŠINA"}
                </h1>
                
                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-white/50 font-medium text-sm uppercase tracking-widest text-[10px]">
                  <span className="flex items-center gap-2">
                    <Building2 size={16} />
                    <span>{machine.companyName || machine.comp || machine.authorName || 'Privatni Oglašivač'}</span>
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{LOCATIONS.find(l => l.slug === machine.locationSlug)?.name || 'Srbija'}</span>
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>{(machine.viewsCount || 0) + (isTrackedInSession ? 1 : 0)} PREGLEDA</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
              {isOwner && (
                <button
                  onClick={() => navigate(`/postavi-oglas?edit=${machine.id}&category=machines`)}
                  className="flex-1 lg:flex-none h-12 px-6 rounded-xl flex items-center justify-center gap-2 border bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all font-semibold text-sm shadow-sm"
                >
                  <PenSquare size={18} />
                  <span>UREDI OGLAS</span>
                </button>
              )}
              
              <button
                className="flex-1 lg:flex-none h-12 px-6 rounded-xl flex items-center justify-center gap-2 border transition-all duration-300 font-semibold text-sm shadow-sm bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
              >
                <Heart fill="none" size={18} />
                <span>SAČUVAJ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">
        <article className="lg:col-span-8 space-y-8" aria-labelledby="machine-title">
          <MediaGallery images={machine.images || []} title={machine.adTitle} imageStatus={machine.imageStatus} />

          {/* Unified Stats Grid (Same as Jobs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#0B0F19] p-5 md:p-6 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Calendar size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Godište</span>
              </div>
              <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-600">
                {machine.year || 'N/A'}
              </span>
            </div>
            
            <div className="bg-[#0B0F19] p-5 md:p-6 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Timer size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Radni Sati</span>
              </div>
              <span className="text-sm font-bold text-white">
                {machine.workingHours ? `${machine.workingHours} h` : 'N/A'}
              </span>
            </div>

            <div className="bg-[#0B0F19] p-5 md:p-6 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Fuel size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Gorivo</span>
              </div>
              <span className="text-sm font-bold text-white uppercase">
                {machine.machFuel || machine.fuelType || 'N/A'}
              </span>
            </div>

            <div className="bg-[#0B0F19] p-5 md:p-6 flex flex-col justify-center hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-white/40 mb-2">
                <Zap size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Snaga</span>
              </div>
              <span className="text-sm font-bold text-white uppercase">
                {machine.powerKw ? `${machine.powerKw} kW` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Description Section */}
          <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 lg:p-10 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                <Settings size={20} />
              </div>
              Opis Mašine
            </h2>
            <div className="text-base text-white/70 leading-relaxed whitespace-pre-wrap font-medium break-words [overflow-wrap:anywhere]">
              {machine.opis || "Nema dodatnog opisa za ovaj oglas."}
            </div>
          </section>

          {/* Technical Specs Section (Glassmorphism layout like Benefits) */}
          <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <Settings size={20} />
              </div>
              Tehničke Specifikacije
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 auto-rows-fr">
              {/* Težina */}
              {(machine.weightKg || machine.weight) && (
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-center justify-between text-secondary hover:bg-secondary/10 transition-colors h-full min-h-[72px]">
                  <div className="flex items-center gap-3">
                    <Weight size={22} />
                    <span className="font-semibold text-sm text-white/60 uppercase tracking-widest text-[10px]">Težina</span>
                  </div>
                  <span className="font-black text-white">{machine.weightKg || machine.weight} kg</span>
                </div>
              )}
              
              {/* Transportne dimenzije (combined) */}
              {(machine.lengthMm || machine.widthMm || machine.heightMm) && (
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-center justify-between text-secondary hover:bg-secondary/10 transition-colors h-full min-h-[72px]">
                  <div className="flex items-center gap-3">
                    <Truck size={22} />
                    <span className="font-semibold text-sm text-white/60 uppercase tracking-widest text-[10px]">Dimenzije (D×Š×V)</span>
                  </div>
                  <span className="font-black text-white">
                    {machine.lengthMm || '-'}/{machine.widthMm || '-'}/{machine.heightMm || '-'} mm
                  </span>
                </div>
              )}

              {/* Nosivost */}
              {(machine.loadCapacityKg || machine.capacity) && (
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-center justify-between text-secondary hover:bg-secondary/10 transition-colors h-full min-h-[72px]">
                  <div className="flex items-center gap-3">
                    <Move size={22} />
                    <span className="font-semibold text-sm text-white/60 uppercase tracking-widest text-[10px]">Nosivost</span>
                  </div>
                  <span className="font-black text-white">{machine.loadCapacityKg || machine.capacity} kg</span>
                </div>
              )}

              {/* Zapremina Kašike */}
              {(machine.bucketCapacityM3 || machine.bucketVolume) && (
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-center justify-between text-secondary hover:bg-secondary/10 transition-colors h-full min-h-[72px]">
                  <div className="flex items-center gap-3">
                    <Maximize size={22} />
                    <span className="font-semibold text-sm text-white/60 uppercase tracking-widest text-[10px]">Zapremina Kašike</span>
                  </div>
                  <span className="font-black text-white">{machine.bucketCapacityM3 || machine.bucketVolume} m³</span>
                </div>
              )}
              
              {/* Dubina Kopanja */}
              {(machine.maxDigDepthMm || machine.digDepth) && (
                <div className="p-4 rounded-xl border border-secondary/20 bg-secondary/5 flex items-center justify-between text-secondary hover:bg-secondary/10 transition-colors h-full min-h-[72px]">
                  <div className="flex items-center gap-3">
                    <ArrowDown size={22} />
                    <span className="font-semibold text-sm text-white/60 uppercase tracking-widest text-[10px]">Dubina Kopanja</span>
                  </div>
                  <span className="font-black text-white">{machine.maxDigDepthMm || machine.digDepth} mm</span>
                </div>
              )}
            </div>
          </section>



        </article>

        {/* Sidebar Section */}
        <aside className="lg:col-span-4" aria-label="Kontakt informacije">
          <StickyContactCard 
            phone={machine.phone || machine.telefon || machine.phoneNumber}
            email={machine.email}
            authorName={machine.companyName || machine.comp || machine.authorName || "Anonimni Korisnik"}
            isVerified={Boolean(machine.isCompanyVerified || machine.isVerified)}
            price={machine.price || machine.pricePerDay || machine.pricePerHour}
            currency="EUR"
            avatar={machine.companyLogo || machine.logo || machine.authorAvatar}
            onMessage={handleStartChat}
          />
        </aside>
      </main>

      <StickyDetailCTABar
        phone={machine.phone || machine.telefon || machine.phoneNumber || ''}
        onMessage={handleStartChat}
        price={machine.price || machine.pricePerDay || machine.pricePerHour}
        currency="EUR"
        priceLabel={machine.adType === 'prodaja' ? "CENA" : "CENA / DAN"}
      />
    </div>
  );
}

