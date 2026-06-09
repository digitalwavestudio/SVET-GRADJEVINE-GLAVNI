import { OptimizedImage } from '@/src/components/OptimizedImage';
import { motion } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import SeoHead from '@/src/components/SeoHead';
import { generateLodgingSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import { ACCOMMODATION_AMENITIES, ACCOMMODATION_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { useAccommodationDetails, useAccommodationMutations } from '@/src/modules/accommodations/hooks/useAccommodations';
import { db } from '@/src/firebase-db';

import { 
  Maximize, 
  MapPin, 
  Users, 
  Euro, 
  CheckCircle, 
  Wifi, 
  Wind, 
  Coffee, 
  Car, 
  Truck, 
  Info, 
  MessageSquare,
  Building2,
  Lock,
  Waves
} from 'lucide-react';
import MediaGallery from '@/src/modules/core/components/details/MediaGallery';
import PropertyGrid from '@/src/modules/core/components/details/PropertyGrid';
import StickyContactCard from '@/src/modules/core/components/details/StickyContactCard';
import { StickyDetailCTABar } from '@/src/components/layout/StickyDetailCTABar';
import AdminActionToolbar from '@/src/modules/dashboard/components/details/AdminActionToolbar';

export default function AccommodationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: accommodationData, isLoading: loading } = useAccommodationDetails(id || '');
  const accommodation = accommodationData as any;
  const { updateAccommodation } = useAccommodationMutations();
  const { user } = useAuth();
  const { startConversation } = useMessages();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { isTrackedInSession } = useTrackView(id, 'listings', accommodation?.authorId);

  const isAdmin = Boolean(user?.email && (user.role === 'admin' || user.isAdmin || user.email === 'mancoresolution@gmail.com'));

  const handleAdminAction = async (action: 'approve' | 'premium' | 'urgent' | 'delete') => {
    if (!isAdmin || !accommodation || !id) return;
    setIsUpdatingStatus(true);
    try {
      const updates: any = {};
      
      if (action === 'approve') updates.status = 'active';
      if (action === 'premium') updates.isPremium = !accommodation.isPremium;
      if (action === 'urgent') updates.isUrgent = !accommodation.isUrgent;
      if (action === 'delete') updates.status = 'deleted';
      
      await updateAccommodation({ id, updates });
      alert("Akcija uspešno izvršena!");
    } catch (error) {
      console.error("Admin action error:", error);
      alert("Greška pri izvršavanju akcije.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/prijava');
      return;
    }
    if (user.id === accommodation.authorId) {
      alert("Ne možete započeti prepisku sa samim sobom.");
      return;
    }

    try {
      const convId = await startConversation(
        accommodation.authorId,
        { id: accommodation.id, type: 'accommodation', title: accommodation.title },
        `Zdravo, pišem Vam u vezi oglašaja za smeštaj: ${accommodation.title}`
      );
      navigate(`/poruke?id=${convId}`);
    } catch (err: any) {
      alert(err.message || "Greška pri pokretanju prepiske.");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#050f19] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#ffad3a] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="min-h-screen bg-[#050f19] flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-7xl text-[#ffad3a] mb-6">error</span>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 font-headline text-white">Smeštaj nije pronađen</h1>
        <p className="text-[#a2acb9] text-lg mb-10 max-w-md">Možda je oglas istekao ili je uklonjen.</p>
        <Link to="/smestaj" className="bg-[#192735] text-[#ffad3a] px-8 py-3 rounded-[10px] font-black uppercase tracking-widest border border-[#ffad3a]/30">Nazad na sve objekte</Link>
      </div>
    );
  }

  const locationName = LOCATIONS.find(l => l.slug === accommodation.locationSlug)?.name || 'Nepoznata lokacija';

  const lodgingSchema = useMemo(() => {
    return generateLodgingSchema(accommodation, locationName, `${APP_CONFIG.BASE_URL}/smestaj/${accommodation.id}`, {
      "amenityFeature": (accommodation.amenities || []).map((slug: string) => ({
        "@type": "LocationFeatureSpecification",
        "name": ACCOMMODATION_AMENITIES.find(a => a.slug === slug)?.name || slug,
        "value": "true"
      }))
    });
  }, [accommodation, locationName]);

  const breadcrumbSchema = useMemo(() => {
    return generateBreadcrumbSchema([
      { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
      { name: "Smeštaj", url: `${APP_CONFIG.BASE_URL}/smestaj` },
      { name: accommodation.title, url: `${APP_CONFIG.BASE_URL}/smestaj/${accommodation.id}` }
    ]);
  }, [accommodation]);

  return (
    <div className="bg-[#050f19] text-[#dce6f5] font-body selection:bg-[#ffad3a] selection:text-[#543300] min-h-screen">
      <AdminActionToolbar 
        views={(accommodation.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
        isPremium={accommodation.isPremium}
        onEdit={() => navigate(`/postavi-oglas?edit=${accommodation.id}&category=accommodation`)}
        onDelete={() => handleAdminAction('delete')}
        onTogglePremium={() => handleAdminAction('premium')}
      />
      <SeoHead 
        title={`${accommodation.title} | Smeštaj u ${locationName}`}
        description={accommodation.description ? accommodation.description.substring(0, 160) : `Smeštaj za radnike u mestu ${locationName}. Cena: ${accommodation.price}€.`}
        image={accommodation.images?.[0]}
        url={`${APP_CONFIG.BASE_URL}/smestaj/${accommodation.id}`}
        type="website"
        jsonLd={[lodgingSchema, breadcrumbSchema]}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Smeštaj', path: '/smestaj' },
          { label: locationName, path: `/smestaj?grad=${accommodation.locationSlug}` },
          { label: accommodation.title }
        ]} />

        {/* Hero Title & Breadcrumbs */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 id="accommodation-title" className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-headline">{accommodation.title}</h1>
                <span className="bg-white/5 text-[#a2acb9] px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  {(accommodation.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[#a2acb9]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#ffad3a]">location_on</span>
                  <span className="font-medium">{locationName} {accommodation.tacnaLokacija ? `- ${accommodation.tacnaLokacija}` : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#ffad3a]">groups</span>
                  <span className="font-medium">Ukupno: {accommodation.totalBeds} kreveta</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#ffad3a] text-3xl font-black tracking-tighter">{accommodation.price}€ <span className="text-sm font-normal text-[#a2acb9]">/ {accommodation.priceType === 'perPerson' ? 'po osobi' : 'za ceo objekat'}</span></div>
              <div className="text-[#a2acb9] text-xs uppercase tracking-widest mt-1">PDV uključen u cenu</div>
            </div>
          </div>
        </motion.div>

        {/* Gallery Section */}
        <MediaGallery images={accommodation.images || []} title={accommodation.title} imageStatus={accommodation.imageStatus} />

        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 mt-12">
          {/* AI BLUEPRINT: STRUKTURIRANI PODACI ZA LLM / SEO */}
          <article id="ai-blueprint" className="lg:col-span-8 space-y-12" aria-labelledby="accommodation-title" itemScope itemType="https://schema.org/LodgingBusiness">
            
            {/* 1. OPIS & OSNOVNE INFORMACIJE */}
            <section aria-labelledby="section-opis">
              <h2 id="section-opis" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                O Objektu (Fact-Sheet)
              </h2>
              <div className="bg-[#13212e]/50 border border-white/5 rounded-[10px] p-8 mb-8">
                 <p itemProp="description" className="text-[#dce6f5] leading-relaxed text-lg whitespace-pre-wrap mb-8">
                  {accommodation.description}
                </p>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#050f19] rounded-[10px] border border-white/5">
                    <dt className="text-[10px] font-black uppercase text-[#ffad3a] tracking-widest mb-1">Tip objekta</dt>
                    <dd itemProp="additionalType" className="text-white font-bold">{ACCOMMODATION_TYPES.find(t => t.slug === accommodation.typeSlug)?.name || 'N/A'}</dd>
                  </div>
                  <div className="p-4 bg-[#050f19] rounded-[10px] border border-white/5">
                    <dt className="text-[10px] font-black uppercase text-[#ffad3a] tracking-widest mb-1">Status provere</dt>
                    <dd className="text-white font-bold flex items-center gap-2">
                       <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                       Verifikovan vlasnik
                    </dd>
                  </div>
                </dl>
              </div>

              <address className="not-italic bg-[#050f19] p-6 rounded-[10px] border border-white/5">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-white/5">
                      <th className="py-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] w-1/3">Lokacija</th>
                      <td className="py-3 text-sm font-bold text-white uppercase" itemProp="address">{locationName} {accommodation.tacnaLokacija ? `- ${accommodation.tacnaLokacija}` : ''}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <th className="py-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Telefon</th>
                      <td className="py-3 text-sm font-bold text-white uppercase">
                        <a href={`tel:${accommodation.phone || accommodation.contactPhone}`} className="hover:text-secondary transition-colors" itemProp="telephone">
                          {accommodation.phone || accommodation.contactPhone || 'Nije uneto'}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Cena</th>
                      <td className="py-3 text-sm font-bold text-white uppercase" itemProp="priceRange">
                        {accommodation.price}€ / {accommodation.priceType === 'perPerson' ? 'po osobi' : 'za ceo objekat'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </address>
            </section>

            {/* 2. KAPACITET I KREVETI */}
            <section aria-labelledby="section-capacity">
              <h2 id="section-capacity" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                Kapacitet i Kreveti
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0e1b27] border border-white/5 p-6 rounded-[10px] text-center">
                  <span className="material-symbols-outlined text-[#ffad3a] text-3xl mb-2">bed</span>
                  <dt className="text-[10px] font-black uppercase text-[#a2acb9] tracking-widest mb-1">Ukupno kreveta</dt>
                  <dd className="text-2xl font-black text-white">{accommodation.totalBeds}</dd>
                </div>
                <div className="bg-[#0e1b27] border border-white/5 p-6 rounded-[10px] text-center">
                  <span className="material-symbols-outlined text-green-500 text-3xl mb-2">event_available</span>
                  <dt className="text-[10px] font-black uppercase text-[#a2acb9] tracking-widest mb-1">Slobodno kreveta</dt>
                  <dd className="text-2xl font-black text-white">{accommodation.availableBeds || accommodation.totalBeds}</dd>
                </div>
                <div className="bg-[#0e1b27] border border-white/5 p-6 rounded-[10px] text-center">
                  <span className="material-symbols-outlined text-[#ffad3a] text-3xl mb-2">groups</span>
                  <dt className="text-[10px] font-black uppercase text-[#a2acb9] tracking-widest mb-1">Idealno za</dt>
                  <dd className="text-sm font-bold text-white uppercase tracking-tighter">Timove / Grupe</dd>
                </div>
              </dl>
            </section>

            {/* 3. PRISTUP I LOKACIJA */}
            {(accommodation.distanceToSiteKm || accommodation.parkingAvailable || accommodation.truckAccess) && (
              <section aria-labelledby="section-access">
                <h2 id="section-access" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                  <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                  Pristup i Lokacija
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accommodation.distanceToSiteKm > 0 && (
                    <div className="p-5 bg-[#13212e] rounded-[10px] border border-white/5 flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-[10px] bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary">distance</span>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-bold text-[10px] uppercase text-[#a2acb9] tracking-widest">Udaljenost</dt>
                        <dd className="text-white font-black text-sm">{accommodation.distanceToSiteKm} km do radova</dd>
                      </div>
                    </div>
                  )}
                  {accommodation.parkingAvailable && (
                    <div className="p-5 bg-[#13212e] rounded-[10px] border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary">local_parking</span>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-bold text-[10px] uppercase text-[#a2acb9] tracking-widest">Parking</dt>
                        <dd className="text-white font-black text-sm">Obezbeđen za radnike</dd>
                      </div>
                    </div>
                  )}
                  {accommodation.truckAccess && (
                    <div className="p-5 bg-[#13212e] rounded-[10px] border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-orange-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-orange-500">fire_truck</span>
                      </div>
                      <div className="flex flex-col">
                        <dt className="font-bold text-[10px] uppercase text-[#a2acb9] tracking-widest">Prilaz</dt>
                        <dd className="text-white font-black text-sm">Kamionski prilaz</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {/* 4. OPERATIVNE POGODNOSTI */}
            <section aria-labelledby="section-amenities">
              <h2 id="section-amenities" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                Operativne Pogodnosti
              </h2>
              
              {/* B2B Operativa */}
              {(accommodation.laundryAvailable || accommodation.kitchenAvailable || accommodation.wifiAvailable || accommodation.airConditioning) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {accommodation.laundryAvailable && (
                    <div className="bg-[#0e1b27] p-4 rounded-[10px] border border-white/10 flex flex-col items-center text-center gap-2">
                       <span className="material-symbols-outlined text-secondary text-2xl">local_laundry_service</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#dce6f5]">Vešeraj</span>
                    </div>
                  )}
                  {accommodation.kitchenAvailable && (
                    <div className="bg-[#0e1b27] p-4 rounded-[10px] border border-white/10 flex flex-col items-center text-center gap-2">
                       <span className="material-symbols-outlined text-secondary text-2xl">soup_kitchen</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#dce6f5]">Kuhinja</span>
                    </div>
                  )}
                  {accommodation.wifiAvailable && (
                    <div className="bg-[#0e1b27] p-4 rounded-[10px] border border-white/10 flex flex-col items-center text-center gap-2">
                       <span className="material-symbols-outlined text-secondary text-2xl">wifi</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#dce6f5]">Internet</span>
                    </div>
                  )}
                  {accommodation.airConditioning && (
                    <div className="bg-[#0e1b27] p-4 rounded-[10px] border border-white/10 flex flex-col items-center text-center gap-2">
                       <span className="material-symbols-outlined text-secondary text-2xl">ac_unit</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#dce6f5]">Klima</span>
                    </div>
                  )}
                </div>
              )}

              {/* General Amenities */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {accommodation.amenities.map((slug: any, idx: any) => {
                  const am = ACCOMMODATION_AMENITIES.find(a => a.slug === slug);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-[#13212e]/30 rounded-[10px] border border-white/5 group hover:bg-[#1e2d3d] transition-colors">
                      <span className="material-symbols-outlined text-[#ffad3a] text-xl group-hover:scale-110 transition-transform">
                        {am?.icon || 'check_circle'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#a2acb9] line-clamp-1">{am?.name || slug}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. POSLOVNI USLOVI */}
            <section aria-labelledby="section-business">
              <h2 id="section-business" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                Poslovni Uslovi i Plaćanje
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-[#09141f] rounded-[10px] border border-white/5 border-l-4 border-l-secondary">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-[10px] flex items-center justify-center ${accommodation.invoiceAvailable ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-white/20'}`}>
                    <span className="material-symbols-outlined text-3xl">receipt_long</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-white mb-1">Račun / Faktura</h4>
                    <p className="text-xs text-[#a2acb9] leading-relaxed">
                      {accommodation.invoiceAvailable 
                        ? 'Dostupno za firme. Mogućnost plaćanja preko žiro računa sa PDV-om.' 
                        : 'Izdavanje fakture trenutno nije podržano za ovaj objekat.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-4 rounded-[10px] text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">calendar_month</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-white mb-1">Period zakupa</h4>
                    <p className="text-xs text-[#a2acb9] leading-relaxed">
                      Minimalni boravak: <span className="text-white font-bold">{accommodation.minStayDays || 1} {accommodation.minStayDays === 1 ? 'dan' : 'dana'}</span>.
                      Mogućnost dugoročnih ugovora za građevinske timove.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="section-rules">
              <h2 id="section-rules" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                Pravila Boravka
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(accommodation.rules || []).map((rule: any, idx: any) => (
                  <div key={idx} className="flex items-center gap-4 p-5 bg-[#13212e]/50 rounded-[10px] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#ffad3a] text-lg">{rule.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-[10px] uppercase text-white tracking-widest">{rule.title}</h4>
                      <p className="text-[#a2acb9] text-[11px] leading-tight mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            {accommodation.reviews?.length > 0 && (
              <section aria-labelledby="section-reviews">
                <h2 id="section-reviews" className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3 font-headline">
                  <span className="w-1 h-8 bg-[#ffad3a] block"></span>
                  Iskustva Građevinskih Firmi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accommodation.reviews.map((review: any, idx: any) => (
                    <div key={idx} className="p-6 bg-[#192735] rounded-[10px] border border-[#3f4954]/20">
                      <div className="flex gap-1 text-[#ffad3a] mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {i < Math.floor(review.stars) ? 'star' : (review.stars % 1 !== 0 && i === Math.floor(review.stars) ? 'star_half' : 'star_outline')}
                          </span>
                        ))}
                      </div>
                      <p className="italic text-[#dce6f5] mb-4 text-sm leading-relaxed">"{review.text}"</p>
                      <div className="flex items-center gap-3 border-t border-white/5 pt-4 mt-auto">
                        <div className="w-8 h-8 bg-secondary/10 flex items-center justify-center font-bold text-secondary rounded text-xs">{review.initials}</div>
                        <div>
                          <div className="text-xs font-black uppercase text-white tracking-tight">{review.author}</div>
                          <div className="text-[10px] text-[#a2acb9] uppercase font-bold tracking-widest">{review.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="lg:col-span-4" aria-label="Kontakt informacije">
            <StickyContactCard 
              price={accommodation.price}
              currency="EUR"
              phone={accommodation.phone || accommodation.contactPhone || ''}
              email={accommodation.email || accommodation.contactEmail}
              authorName={accommodation.authorName || 'Vlasnik Objekta'}
              isVerified={true}
              avatar={accommodation.companyLogo}
              onMessage={handleStartChat}
            />
          </aside>
        </div>

        {/* Similar Accommodations Section */}
        <section className="mt-24 pb-20" aria-labelledby="section-similar">
          <h2 id="section-similar" className="text-2xl font-bold uppercase tracking-tight mb-8 flex items-center gap-3 font-headline">
            <span className="w-1 h-8 bg-[#ffad3a] block"></span>
            Smeštaj u blizini
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(accommodation.similar || []).map((item: any, idx: any) => (
              <Link key={idx} to={`/smestaj/${idx + 10}`} className="bg-[#0e1b27] rounded-[10px] overflow-hidden group border border-[#3f4954]/10 hover:border-[#ffad3a]/30 transition-all">
                <div className="h-48 relative overflow-hidden">
                  <OptimizedImage 
                    src={item.image} 
                    fallbackType="accommodation" 
                    alt={item.title} 
                    className="w-full h-full object-cover" 
                    containerClassName="w-full h-full"
                  /> 
                    
                  <div className="absolute top-4 right-4 bg-[#ffad3a] text-[#543300] text-xs font-black px-2 py-1 rounded shadow-lg">OD {item.price}</div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-base uppercase mb-2 group-hover:text-[#ffad3a] transition-colors">{item.title}</h4>
                  <div className="flex items-center gap-1 text-[#a2acb9] text-xs mb-4">
                    <span className="material-symbols-outlined text-sm text-[#ffad3a]">location_on</span>
                    {item.location}
                  </div>
                  <div className="flex gap-2">
                    <span className="material-symbols-outlined text-[#a2acb9] text-lg">wifi</span>
                    <span className="material-symbols-outlined text-[#a2acb9] text-lg">local_shipping</span>
                    <span className="material-symbols-outlined text-[#a2acb9] text-lg">local_laundry_service</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <RelatedSEO locationSlug={accommodation.locationSlug} currentType="accommodation" />
      </main>

      <StickyDetailCTABar
        phone={accommodation.phone || accommodation.contactPhone || ''}
        onMessage={handleStartChat}
        price={accommodation.price}
        currency="EUR"
        priceLabel={accommodation.priceType === 'perPerson' ? 'PO OSOBI' : 'ZAKUP'}
      />
    </div>
  );
}
