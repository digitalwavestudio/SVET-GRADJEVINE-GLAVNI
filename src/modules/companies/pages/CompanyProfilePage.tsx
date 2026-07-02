import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import SeoHead from '@/src/components/SeoHead';
import { useAuth } from '@/src/context/AuthContext';
import { useTrackView } from '@/src/hooks/useTrackView';
import { OptimizedImage } from '@/src/components/OptimizedImage';

import { useCompanyDetails, useCompanyAdMutations } from '@/src/modules/companies/hooks/useCompanies';
import { useJobs } from '@/src/modules/jobs';
import { useMachinesList } from '@/src/modules/machines';
import { useAccommodationsList } from '@/src/modules/accommodations';
import { useCateringList } from '@/src/modules/catering';
import { useRealEstateList } from '@/src/modules/real_estate';

import { generateLocalBusinessSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { CompanyHeroSection } from '@/src/modules/companies/components/company/CompanyHeroSection';
import { CompanyInfoTab } from '@/src/modules/companies/components/company/CompanyInfoTab';
import { CompanyAdsTabsContent } from '@/src/modules/companies/components/company/CompanyAdsTabsContent';
import { CompanySidebar } from '@/src/modules/companies/components/company/CompanySidebar';


export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading: companyLoading } = useCompanyDetails(id);
  
  const { user } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { updateCompanyAd } = useCompanyAdMutations();

  const { data: jobsData, isLoading: jobsLoading } = useJobs({ authorId: company?.authorId }, { enabled: !!company?.authorId });
  const { data: machinesData, isLoading: machinesLoading } = useMachinesList({ authorId: company?.authorId }, { enabled: !!company?.authorId });
  const { data: accData, isLoading: accLoading } = useAccommodationsList({ authorId: company?.authorId }, { enabled: !!company?.authorId });
  const { data: catData, isLoading: catLoading } = useCateringList({ authorId: company?.authorId }, { enabled: !!company?.authorId });
  const { data: plotsData, isLoading: plotsLoading } = useRealEstateList({ authorId: company?.authorId }, { enabled: !!company?.authorId });

  const activeJobs = jobsData?.pages.flatMap(p => p?.items || []) || [];
  const activeMachines = machinesData?.pages.flatMap(p => p?.items || []) || [];
  const activeAccommodations = accData?.pages.flatMap(p => p?.items || []) || [];
  const activeCaterings = catData?.pages.flatMap(p => p?.items || []) || [];
  const activePlots = plotsData?.pages.flatMap(p => p?.items || []) || [];

  const isLoadingCurrentTab = jobsLoading || machinesLoading || accLoading || catLoading || plotsLoading || false;

  const { isTrackedInSession } = useTrackView(company?.id, 'companies', company?.id);

  const isAdmin = Boolean(user?.email && (user.role === 'admin' || user.isAdmin));

  const handleAdminAction = async (action: 'approve' | 'premium' | 'delete') => {
    if (!isAdmin || !company) return;
    setIsUpdatingStatus(true);
    try {
      const updates: any = {};
      
      if (action === 'approve') updates.status = 'active';
      if (action === 'premium') updates.isPremium = !company.isPremium;
      if (action === 'delete') updates.status = 'deleted';
      
      await updateCompanyAd({ id: company.id as string, data: updates });
      alert("Akcija uspešno izvršena!");
      window.location.reload(); // Refresh to get context updates or it won't reflect since it uses context
    } catch (error) {
      console.error("Admin action error:", error);
      alert("Greška pri izvršavanju akcije.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  if (companyLoading) return null;
  if (!company) return (
    <div className="min-h-screen bg-[#0F1923] pt-40 flex flex-col items-center">
       <h1 className="text-4xl font-black text-white/20 uppercase tracking-widest">Firma nije pronađena</h1>
       <Link to="/firme" className="text-secondary mt-8 uppercase font-black hover:underline">Povratak na katalog</Link>
    </div>
  );

  const orgSchema = generateLocalBusinessSchema(company);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Početna", url: `${APP_CONFIG.BASE_URL}/` },
    { name: "Firme", url: `${APP_CONFIG.BASE_URL}/firme` },
    { name: company.name, url: window.location.href }
  ]);

  return (
    <div className="bg-[#0F1923] text-white font-body selection:bg-secondary selection:!text-black min-h-screen">
      <SeoHead 
        title={`${company.name} | Profil Firme | Svet Građevine`}
        description={company.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 160) || "Detaljan profil firme na platformi Svet Građevine."}
        image={company.coverImage || company.logo}
        type="website"
        jsonLd={[orgSchema, breadcrumbSchema]}
      />
      
      {isAdmin && company && (
        <div className="bg-slate-900 border-b border-white/10 p-3 relative z-50 mt-24">
          <div className="max-w-7xl mx-auto px-8 flex flex-wrap items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Moderacija Firme</span>
              <span className="text-white font-bold text-xs uppercase tracking-widest">STATUS: {company.status?.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleAdminAction('approve')}
                disabled={isUpdatingStatus || company.status === 'active'}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-white px-6 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                ODOBRI
              </button>
              <button 
                onClick={() => handleAdminAction('premium')}
                disabled={isUpdatingStatus}
                className={`${company.isPremiumPartner ? 'bg-secondary !text-black font-bold' : 'bg-white/10 text-secondary border border-secondary/30'} hover:scale-105 px-6 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all`}
              >
                {company.isPremiumPartner ? '★ PREMIUM' : 'POSTAVI PREMIUM'}
              </button>
              <button 
                onClick={() => handleAdminAction('delete')}
                disabled={isUpdatingStatus || company.status === 'deleted'}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                UKLONI
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-[1920px] mx-auto min-h-screen">
        <CompanyHeroSection company={company} />

        {/* Logo overlap - pola u heroju */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="-mt-36 md:-mt-24 mb-4 md:mb-6">
            <div className="relative w-fit">
              <div className="w-24 h-24 md:w-52 md:h-52 bg-white p-2 md:p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#0a111a] flex items-center justify-center overflow-hidden group">
                {company.logo ? (
                  <img width="800" height="600" decoding="async" src={company.logo} alt="Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                ) : (
                  <span className="text-3xl md:text-7xl font-black text-gray-200">{company.name?.charAt(0) || 'C'}</span>
                )}
              </div>
              {company.isPremiumPartner && (
                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-secondary to-yellow-500 rounded-full border-4 border-[#0a111a] flex items-center justify-center shadow-[0_0_20px_rgba(254,191,13,0.4)]" title="Premium Partner">
                  <span className="material-symbols-outlined !text-black font-black text-sm md:text-lg">stars</span>
                </div>
              )}
            </div>
          </div>

            <div className="mb-4 md:mb-6">
            <h1 id="company-title" className="text-3xl md:text-6xl lg:text-7xl font-black font-headline tracking-tight uppercase leading-none text-white">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {company.isVerified ? (
                <span className="px-4 py-1.5 bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/25 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verifikovan Partner
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  Profil u obradi
                </span>
              )}
              <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {LOCATIONS.find(l => l.slug === company.locationSlug)?.name || 'Srbija'}, Srbija
              </span>
            </div>
            {company.website && (
              <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                 target="_blank" rel="noreferrer"
                 className="block mt-3 text-blue-400 hover:text-blue-300 text-base md:text-lg font-bold transition-colors">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="block mt-1 text-white/70 hover:text-white text-sm md:text-base font-medium transition-colors">
                {company.email}
              </a>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {company.facebook && (
                <a href={company.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>globe</span>
                  Facebook
                </a>
              )}
              {company.instagram && (
                <a href={company.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm font-bold transition-colors">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>globe</span>
                  Instagram
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 mt-4 text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">
              <span className="material-symbols-outlined text-[#38bdf8] text-base">visibility</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Pregleda: <span className="text-white">{(company.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}</span></span>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-2 lg:py-8">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-16">
            
            {/* MAIN CONTENT COLUMN (8 cols) */}
            <article className="lg:col-span-8 space-y-12" aria-labelledby="company-title">
              <CompanyInfoTab company={company} />
            </article>

            {/* SIDEBAR COLUMN (4 cols) */}
            <aside className="lg:col-span-4" aria-label="Company Details Sidebar">
              <CompanySidebar company={company} />
            </aside>
          </div>

          {/* Portfolio - full width */}
          {(() => {
            const pfImages = (company as any).portfolioImages || (company as any).companyPortfolioImages || [];
            return (
              <section className="mt-10 md:mt-16 space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-600 font-headline">Portfolio</h2>
                   <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
                </div>
                {pfImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {pfImages.map((img: string, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="group relative aspect-square rounded-[10px] overflow-hidden border border-white/10 shadow-2xl"
                      >
                        <OptimizedImage
                          src={img}
                          fallbackType="company"
                          alt={`Portfolio slika ${idx + 1}`}
                          className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110"
                          containerClassName="w-full h-full"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[200px] md:min-h-[350px]">
                    <span className="material-symbols-outlined text-white/10 text-4xl md:text-6xl mb-3 md:mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>photo_library</span>
                    <h3 className="font-black text-lg md:text-2xl text-white/50 mb-2 uppercase tracking-tighter">Firma nije postavila slike svojih radova.</h3>
                  </div>
                )}
              </section>
            );
          })()}

          {/* Svi oglasi - full width */}
          <div className="mt-10 md:mt-16">
            <CompanyAdsTabsContent
              activeJobs={activeJobs}
              activeMachines={activeMachines}
              activeAccommodations={activeAccommodations}
              activeCaterings={activeCaterings}
              activePlots={activePlots}
              isLoading={isLoadingCurrentTab}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
