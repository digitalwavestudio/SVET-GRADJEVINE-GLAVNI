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
import { db } from '@/src/firebase-db';

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
  Fuel
} from 'lucide-react';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import PropertyGrid from '@/src/modules/core/components/details/PropertyGrid';
import StickyContactCard from '@/src/modules/core/components/details/StickyContactCard';
import { StickyDetailCTABar } from '@/src/components/layout/StickyDetailCTABar';
import AdminActionToolbar from '@/src/modules/dashboard/components/details/AdminActionToolbar';
import { AvailabilityCalendar } from '@/src/modules/core/components/calendar/AvailabilityCalendar';

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
    if (user.id === machine.authorId) {
      alert("Ne možete započeti prepisku sa samim sobom.");
      return;
    }

    try {
      const convId = await startConversation(
        machine.authorId,
        { id: machine.id, type: 'machine', title: machine.adTitle },
        customMsg || `Zdravo, pišem Vam u vezi oglasa za mašinu: ${machine.adTitle}`
      );
      navigate(`/poruke?id=${convId}`);
    } catch (err: unknown) {
      alert((err instanceof Error) ? err.message : "Greška pri pokretanju prepiske.");
    }
  };


  if (loading) return (
    <div className="min-h-screen bg-[#050f19] flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-[#ffad3a] border-t-transparent rounded-full"></div>
    </div>
  );
  if (!machine) return (
    <div className="min-h-screen bg-[#050f19] pt-40 flex flex-col items-center">
       <h1 className="text-4xl font-black text-white/20 uppercase tracking-widest">Mašina nije pronađena</h1>
       <Link to="/gradjevinske-masine" className="text-[#ffad3a] mt-8 uppercase font-black hover:underline">Povratak na Mašine</Link>
    </div>
  );

  const mCategory = MACHINE_CATEGORIES.find(c => c.id === machine.categoryId)?.name || machine.categoryId;
  const mSubCategory = MACHINE_SUBCATEGORIES[machine.categoryId]?.find(s => s.id === machine.subcategoryId)?.name || machine.subcategoryId;

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

  const machineSchema = useMemo(() => {
    return generateMachineSchema(
      machine, 
      LOCATIONS.find(l => l.slug === machine.locationSlug)?.name || "", 
      mCategory, 
      `${APP_CONFIG.BASE_URL}/gradjevinske-masine/${machine.id}`
    );
  }, [machine, mCategory]);

  const breadcrumbSchema = useMemo(() => {
    return generateBreadcrumbSchema([
      { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
      { name: "Mašine", url: `${APP_CONFIG.BASE_URL}/gradjevinske-masine` },
      { name: machine.adTitle, url: `${APP_CONFIG.BASE_URL}/gradjevinske-masine/${machine.id}` }
    ]);
  }, [machine]);

  return (
    <div className="min-h-screen bg-[#050f19] text-[#dce6f5] font-body selection:bg-secondary selection:text-slate-950">
      <SeoHead 
        title={`${machine.adTitle} | Građevinske Mašine`}
        description={`Detalji za: ${machine.adTitle}. ${mCategory} - ${mSubCategory}. Lokacija: ${LOCATIONS.find(l => l.slug === machine.locationSlug)?.name}. ${machine.adType === 'prodaja' ? `Cena: ${machine.price}€` : machine.pricePerDay ? `Cena: ${machine.pricePerDay}€ / dan` : ''}`}
        image={machine.images?.[0]}
        url={`${APP_CONFIG.BASE_URL}/gradjevinske-masine/${machine.id}`}
        jsonLd={[machineSchema, breadcrumbSchema]}
      />

      <main className="pt-24 lg:pt-32 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { label: 'Mašine', path: '/gradjevinske-masine' },
          { label: LOCATIONS.find(l => l.slug === machine.locationSlug)?.name || 'Srbija', path: `/gradjevinske-masine?grad=${machine.locationSlug}` },
          { label: machine.adTitle }
        ]} />

        {/* Admin Logic Toolbar */}
          <AdminActionToolbar 
            views={(machine.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
            isPremium={machine.isPremium}
            onEdit={() => navigate(`/postavi-oglas?edit=${machine.id}&category=machines`)}
            onDelete={() => handleAdminAction('delete')}
            onTogglePremium={() => handleAdminAction('premium')}
          />
        
        {/* Header Bento */}
        <div className="mt-8 mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {machine.isPremium && (
                <span className="bg-secondary text-slate-950 px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-secondary/20">
                  ★ PREMIUM OGLAS
                </span>
              )}
              <span className={`px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest border ${machine.adType === 'prodaja' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-secondary/10 text-secondary border-secondary/30'}`}>
                {machine.adType === 'prodaja' ? 'PRODAJA' : 'IZNAJMLJIVANJE'}
              </span>
            </div>

            <div className="space-y-4">
              <h1 id="machine-title" className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-white max-w-4xl">
                {machine.adTitle}
              </h1>
              <div className="flex items-center gap-4 text-secondary font-bold text-xs uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="p-1.5 bg-secondary/10 rounded-[10px]"><Settings size={14} /></span>
                  {mCategory} • {mSubCategory}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 lg:gap-16">
          <article className="lg:col-span-8 space-y-12 lg:space-y-16" aria-labelledby="machine-title">
            {/* Gallery Section */}
            <MediaGallery images={machine.images || []} title={machine.adTitle} imageStatus={machine.imageStatus} />

            {/* Quick Metrics Grid */}
            <PropertyGrid 
              items={[
                { icon: Calendar, label: 'Godište', value: machine.year, highlight: true },
                { icon: Timer, label: 'Radni Sati', value: machine.workingHours ? `${machine.workingHours} h` : '-' },
                { icon: Fuel, label: 'Gorivo', value: machine.machFuel || machine.fuelType },
                { icon: Zap, label: 'Snaga', value: machine.powerKw ? `${machine.powerKw} kW` : '-' },
                { icon: Weight, label: 'Težina', value: machine.weightKg || machine.weight },
                { icon: CheckCircle2, label: 'Stanje', value: machine.condition === 'novo' ? 'Novo' : 'Polovno' }
              ]}
            />

            {/* Technical Specs Bento - LLM FACT SHEET (Table format for better AI Extraction) */}
            <section id="ai-facts-table" className="space-y-8 bg-surface-container-highest/20 border border-outline-variant/10 rounded-[10px] p-8 md:p-12 overflow-hidden">
               <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                Specifikacije Mehanizacije
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary flex items-center gap-2">
                    <Truck size={14} /> Transportne Dimenzije
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sr-only">
                        <tr>
                          <th scope="col">Karakteristika</th>
                          <th scope="col">Vrednost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { label: 'Dužina', value: machine.lengthMm ? `${machine.lengthMm} mm` : '-' },
                          { label: 'Širina', value: machine.widthMm ? `${machine.widthMm} mm` : '-' },
                          { label: 'Visina', value: machine.heightMm ? `${machine.heightMm} mm` : '-' }
                        ].map((item, i) => (
                          <tr key={i} className="group hover:bg-white/5 transition-colors">
                            <th scope="row" className="py-3 text-[10px] font-black uppercase tracking-widest text-white/30 font-normal">
                              {item.label}
                            </th>
                            <td className="py-3 text-sm font-bold text-white uppercase text-right">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary flex items-center gap-2">
                    <Maximize size={14} /> Radni Kapaciteti
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sr-only">
                        <tr>
                          <th scope="col">Karakteristika</th>
                          <th scope="col">Vrednost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { label: 'Nosivost', value: machine.loadCapacityKg ? `${machine.loadCapacityKg} kg` : machine.capacity },
                          { label: 'Zapremina Kašike', value: machine.bucketCapacityM3 ? `${machine.bucketCapacityM3} m³` : machine.bucketVolume },
                          { label: 'Dubina Kopanja', value: machine.maxDigDepthMm ? `${machine.maxDigDepthMm} mm` : machine.digDepth }
                        ].map((item, i) => (
                          <tr key={i} className="group hover:bg-white/5 transition-colors">
                            <th scope="row" className="py-3 text-[10px] font-black uppercase tracking-widest text-white/30 font-normal">
                              {item.label}
                            </th>
                            <td className="py-3 text-sm font-bold text-white uppercase text-right">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Description Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary">
                  <ArrowDown size={20} />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Opis i Detalji</h2>
              </div>
              <div className="text-lg text-white/60 leading-relaxed font-medium whitespace-pre-wrap bg-white/5 p-10 rounded-[10px] border border-white/5">
                {machine.opis || "Nema dodatnog opisa za ovaj oglas."}
              </div>
            </section>

            {/* Availability Calendar */}
            <section className="space-y-8 pt-6">
               <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                Zauzeće i Rezervacije
              </h2>
              <AvailabilityCalendar 
                mode="view"
                events={(machine as any).events || []}
                onBookRequest={(start, end) => {
                  const msg = `Poštovani, interesuje me rezervacija mašine "${machine.adTitle}" za period od ${start.toLocaleDateString()} do ${end.toLocaleDateString()}. Da li ste slobodni u ovom terminu?`;
                  handleStartChat(msg);
                }}
              />
            </section>
          </article>

          {/* Sidebar Section */}
          <aside className="lg:col-span-4 translate-y-0 lg:translate-y-[-100px]" aria-label="Kontakt informacije">
            <StickyContactCard 
              phone={machine.phone}
              email={machine.email}
              authorName={machine.authorName}
              isVerified={true}
              price={machine.price || machine.pricePerDay || machine.pricePerHour}
              currency="EUR"
              avatar={machine.companyLogo}
              onMessage={handleStartChat}
            />
          </aside>
        </div>

        <div className="mt-32">
          <RelatedSEO locationSlug={machine.locationSlug} currentType="machines" />
        </div>
      </main>

      <StickyDetailCTABar
        phone={machine.phone || ''}
        onMessage={handleStartChat}
        price={machine.price || machine.pricePerDay || machine.pricePerHour}
        currency="EUR"
        priceLabel={machine.adType === 'prodaja' ? "CENA" : "CENA / DAN"}
      />
    </div>
  );
}
