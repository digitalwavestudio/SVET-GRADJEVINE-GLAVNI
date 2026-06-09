import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import SeoHead from '@/src/components/SeoHead';
import { generateFoodEstablishmentSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import { KITCHEN_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { useCateringDetails, useCateringMutations } from '@/src/modules/catering/hooks/useCatering';
import { CateringOffer } from '@/src/modules/catering/services/cateringService';
import { 
  Utensils, 
  MapPin, 
  Users, 
  Truck, 
  Info, 
  ShieldCheck, 
  Package, 
  Receipt, 
  Star,
  Flame,
  ArrowLeft,
  UtensilsCrossed,
  ChefHat
} from 'lucide-react';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import PropertyGrid from '@/src/modules/core/components/details/PropertyGrid';
import StickyContactCard from '@/src/modules/core/components/details/StickyContactCard';
import AdminActionToolbar from '@/src/modules/dashboard/components/details/AdminActionToolbar';

export default function CateringDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cateringData, isLoading: loading} = useCateringDetails(id || '');
  const catering = cateringData as CateringOffer | null;
  const { updateCatering } = useCateringMutations();
  const { user } = useAuth();
  const { startConversation } = useMessages();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { isTrackedInSession } = useTrackView(id, 'listings', catering?.authorId);

  const isAdmin = Boolean(user?.email && (user.role === 'admin' || user.isAdmin || user.email === 'mancoresolution@gmail.com' || user.email === 'mika.iz.pavlovaca@gmail.com'));

  const handleStartChat = useCallback(async () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    if (!catering) return;
    if (user.id === catering.authorId) {
      alert("Ne možete započeti prepisku sa samim sobom.");
      return;
    }

    try {
      const convId = await startConversation(
        catering.authorId || '',
        { id: catering.id || '', type: 'catering', title: catering.title },
        `Zdravo, pišem Vam u vezi servisa za ketering: ${catering.title}`
      );
      navigate(`/poruke?id=${convId}`);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Greška pri pokretanju prepiske.");
    }
  }, [user, navigate, catering, startConversation]);

  const handleAdminAction = useCallback(async (action: 'approve' | 'premium' | 'urgent' | 'delete') => {
    if (!isAdmin || !catering || !id) return;
    setIsUpdatingStatus(true);
    try {
      const updates: Partial<CateringOffer> = {};
      
      if (action === 'approve') updates.status = 'active';
      if (action === 'premium') updates.isPremium = !catering.isPremium;
      if (action === 'urgent') updates.isUrgent = !catering.isUrgent;
      if (action === 'delete') updates.status = 'deleted';
      
      await updateCatering({ id, updates });
    } catch (error) {
      console.error("Admin action error:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [isAdmin, catering, id, updateCatering]);


  if (loading) return (
    <div className="min-h-screen bg-[#050f19] flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-[#ffad3a] border-t-transparent rounded-full"></div>
    </div>
  );

  if (!catering) return (
    <div className="min-h-screen bg-[#050f19] pt-40 flex flex-col items-center">
       <h1 className="text-4xl font-black text-white/20 uppercase tracking-widest">Ketering nije pronađen</h1>
       <Link to="/ketering" className="text-[#ffad3a] mt-8 uppercase font-black hover:underline">Nazad na ponude</Link>
    </div>
  );

  const locationName = LOCATIONS.find(l => l.slug === catering.locationSlug)?.name || catering.locationSlug || 'Srbija';
  const kitchenTypeName = KITCHEN_TYPES.find(k => k.slug === catering.kitchenType || k.id === catering.kitchenType)?.name || 'Domaća, Internacionalna';

  const b2bProps = [
    { label: 'Min. porudžbina', value: `${catering.minOrder || 0} obroka`, icon: Users },
    { label: 'Dnevni kapacitet', value: catering.dailyCapacityMeals ? `${catering.dailyCapacityMeals} obr.` : 'Po upitu', icon: ChefHat },
    { label: 'Faktura (Plaćanje)', value: catering.invoiceAvailable ? 'Dostupno' : 'Samo gotovina', icon: Receipt },
    { label: 'Dostava', value: catering.deliveryZone || 'Po dogovoru', icon: Truck },
  ];

  const certificatesProps = [
    { label: 'HACCP Standard', value: catering.haccpCertified ? 'Sertifikovan' : 'Nema', icon: ShieldCheck },
    { label: 'Ambalaža', value: catering.packagingIncluded ? 'Uračunata' : 'Dodatno', icon: Package },
    { label: 'Kuhinja', value: kitchenTypeName, icon: UtensilsCrossed },
  ];

  const foodSchema = useMemo(() => {
    return generateFoodEstablishmentSchema(catering, locationName, `${APP_CONFIG.BASE_URL}/ketering/${catering.id}`);
  }, [catering, locationName]);

  const breadcrumbSchema = useMemo(() => {
    return generateBreadcrumbSchema([
      { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
      { name: "Ketering", url: `${APP_CONFIG.BASE_URL}/ketering` },
      { name: catering.title, url: `${APP_CONFIG.BASE_URL}/ketering/${catering.id}` }
    ]);
  }, [catering]);

  return (
    <div className="min-h-screen bg-[#050f19] text-[#dce6f5] pb-24">
      <AdminActionToolbar 
        views={(catering.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
        isPremium={catering.isPremium}
        onEdit={() => navigate(`/postavi-oglas?edit=${catering.id}&category=catering`)}
        onDelete={() => handleAdminAction('delete')}
        onTogglePremium={() => handleAdminAction('premium')}
      />

      <SeoHead 
        title={`${catering.title} | Ketering za Radnike | Svet Građevine`}
        description={catering.description?.substring(0, 160) || `Ketering usluge za radnike u mestu ${locationName}.`}
        image={catering.images?.[0]}
        jsonLd={[foodSchema, breadcrumbSchema]}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32">
        <Breadcrumbs items={[
          { label: 'Ketering', path: '/ketering' },
          { label: locationName, path: `/ketering?grad=${catering.locationSlug}` },
          { label: catering.title }
        ]} />

        <div className="mt-8 mb-12">
          <Link to="/ketering" className="inline-flex items-center gap-2 text-[#a2acb9] hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-6">
             <ArrowLeft size={14} />
             Nazad na listu
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-white/10">
             <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  <span className="bg-[#ffad3a]/10 text-[#ffad3a] border border-[#ffad3a]/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                    KETERING SERVIS
                  </span>
                  {catering.isPremium && (
                    <span className="bg-[#ffad3a] text-slate-950 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> PREMIUM
                    </span>
                  )}
                  {catering.isUrgent && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                      <Flame size={10} fill="currentColor" /> HITNO
                    </span>
                  )}
                </div>
                <h1 id="catering-title" className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-white">
                  {catering.title}
                </h1>
                <p className="text-sm font-bold uppercase tracking-widest text-[#a2acb9] mt-6 flex items-center gap-2">
                   <MapPin size={16} className="text-[#ffad3a]" />
                   {catering.locationSlug || locationName}
                </p>
             </div>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12">
          <article className="lg:col-span-8 flex flex-col gap-12" aria-labelledby="catering-title">
            <MediaGallery images={catering.images || []} title={catering.title} imageStatus={catering.imageStatus} />

            <section aria-labelledby="section-b2b">
              <h2 id="section-b2b" className="text-xs font-black uppercase tracking-[0.2em] text-[#a2acb9] mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#ffad3a]"></span>
                B2B Saradnja i Dostava
              </h2>
              <PropertyGrid items={b2bProps} />
            </section>

            <section aria-labelledby="section-about" className="bg-white/5 p-8 md:p-12 rounded-[10px] border border-white/5">
              <h2 id="section-about" className="text-xs font-black uppercase tracking-[0.2em] text-[#a2acb9] mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#ffad3a]"></span>
                O Ketering Servisu
              </h2>
              <div className="text-white/80 leading-loose font-medium text-lg whitespace-pre-wrap">
                {catering.description || 'Nema detaljnog opisa.'}
              </div>
            </section>

            <section aria-labelledby="section-certs">
              <h2 id="section-certs" className="text-xs font-black uppercase tracking-[0.2em] text-[#a2acb9] mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#ffad3a]"></span>
                Standardi i Sertifikati
              </h2>
              <PropertyGrid items={certificatesProps} />
            </section>

            {catering.menuItems && catering.menuItems.length > 0 && (
              <section className="space-y-8" aria-labelledby="section-menu">
                <h2 id="section-menu" className="text-xs font-black uppercase tracking-[0.2em] text-[#a2acb9] mb-8 flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-[#ffad3a]"></span>
                  Izdvojeno iz Menija
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {catering.menuItems.map((item: string, index: number) => (
                    <div key={index} className="bg-white/5 border border-white/5 rounded-[10px] p-6 flex items-start gap-6 hover:border-[#ffad3a]/30 transition-all group relative overflow-hidden">
                       <div className="w-16 h-16 rounded-[10px] bg-[#ffad3a]/10 flex items-center justify-center shrink-0 border border-[#ffad3a]/20">
                         <Utensils size={24} className="text-[#ffad3a]" />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                             <h3 className="text-xl font-bold text-white group-hover:text-[#ffad3a] transition-colors">{item}</h3>
                             <span className="text-[#ffad3a] font-black">{catering.pricePerMeal} RSD</span>
                          </div>
                          <p className="text-[#a2acb9] text-sm leading-relaxed">
                            Specijalitet kuće pripremljen po tradicionalnoj recepturi.
                          </p>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="lg:col-span-4" aria-label="Kontakt menadžer">
            <StickyContactCard 
              price={catering.pricePerMeal}
              currency="RSD"
              phone={catering.phone || catering.contact?.phone || ''}
              email={catering.email || catering.contact?.email}
              authorName={catering.authorName || 'Ketering Servis'}
              isVerified={catering.isCompanyVerified}
              avatar={catering.companyLogo}
              onMessage={handleStartChat}
            />
          </aside>
        </div>

        <RelatedSEO locationSlug={catering.locationSlug} currentType="catering" />
      </main>
    </div>
  );
}
