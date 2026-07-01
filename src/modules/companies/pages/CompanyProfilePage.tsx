import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RelatedSEO } from '@/src/components/RelatedSEO';
import SeoHead from '@/src/components/SeoHead';
import ThemeToggle from '@/src/components/ThemeToggle';
import { COMPANY_EMPLOYEE_RANGES } from '@/src/constants/companyTaxonomy';
import { MACHINE_CATEGORIES } from '@/src/constants/machineTaxonomy';
import { KITCHEN_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useTrackView } from '@/src/hooks/useTrackView';

import { useCompanyDetails, useCompanyAdMutations } from '@/src/modules/companies/hooks/useCompanies';
import { useJobs } from '@/src/modules/jobs';
import { useMachinesList } from '@/src/modules/machines';
import { useAccommodationsList } from '@/src/modules/accommodations';
import { useCateringList } from '@/src/modules/catering';
import { useRealEstateList } from '@/src/modules/real_estate';
import { useAuthorCounts } from '@/src/hooks/useCollectionStats';

type ProfileTab = 'info' | 'jobs' | 'machines' | 'accommodations' | 'catering' | 'realestate';

import { generateLocalBusinessSchema, generateBreadcrumbSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import {
  getAccommodationLink,
  getCateringLink,
  getJobLink,
  getMachineLink,
  getPlotLink,
  getUserLink
} from '@/src/lib/routeFilters';
import { CompanyHeroSection } from '@/src/modules/companies/components/company/CompanyHeroSection';
import { CompanyInfoTab } from '@/src/modules/companies/components/company/CompanyInfoTab';
import { CompanyAdsTabsContent } from '@/src/modules/companies/components/company/CompanyAdsTabsContent';
import { CompanySidebar } from '@/src/modules/companies/components/company/CompanySidebar';
import { CompanyNavigationTabs } from '@/src/modules/companies/components/company/CompanyNavigationTabs';

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading: companyLoading } = useCompanyDetails(id);
  
  const { user } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { updateCompanyAd } = useCompanyAdMutations();

  const { data: authorCounts } = useAuthorCounts(company?.authorId, id);

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
        <div className="bg-slate-900 border-b border-white/10 p-3 relative z-50">
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
        <CompanyHeroSection company={company} isTrackedInSession={isTrackedInSession} />

        {/* PAGE CONTENT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16">
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* MAIN CONTENT COLUMN (8 cols) */}
            <article className="lg:col-span-8 space-y-12" aria-labelledby="company-title">
              <CompanyInfoTab company={company} />

              {(activeJobs.length > 0 || jobsLoading) && (
                 <CompanyAdsTabsContent 
                   activeTab="jobs"
                   activeJobs={activeJobs}
                   activeMachines={activeMachines}
                   activeAccommodations={activeAccommodations}
                   activeCaterings={activeCaterings}
                   activePlots={activePlots}
                   isLoadingCurrentTab={jobsLoading}
                 />
              )}

              {(activeMachines.length > 0 || machinesLoading) && (
                 <CompanyAdsTabsContent 
                   activeTab="machines"
                   activeJobs={activeJobs}
                   activeMachines={activeMachines}
                   activeAccommodations={activeAccommodations}
                   activeCaterings={activeCaterings}
                   activePlots={activePlots}
                   isLoadingCurrentTab={machinesLoading}
                 />
              )}

              {(activeAccommodations.length > 0 || accLoading) && (
                 <CompanyAdsTabsContent 
                   activeTab="accommodations"
                   activeJobs={activeJobs}
                   activeMachines={activeMachines}
                   activeAccommodations={activeAccommodations}
                   activeCaterings={activeCaterings}
                   activePlots={activePlots}
                   isLoadingCurrentTab={accLoading}
                 />
              )}

              {(activeCaterings.length > 0 || catLoading) && (
                 <CompanyAdsTabsContent 
                   activeTab="catering"
                   activeJobs={activeJobs}
                   activeMachines={activeMachines}
                   activeAccommodations={activeAccommodations}
                   activeCaterings={activeCaterings}
                   activePlots={activePlots}
                   isLoadingCurrentTab={catLoading}
                 />
              )}

              {(activePlots.length > 0 || plotsLoading) && (
                 <CompanyAdsTabsContent 
                   activeTab="realestate"
                   activeJobs={activeJobs}
                   activeMachines={activeMachines}
                   activeAccommodations={activeAccommodations}
                   activeCaterings={activeCaterings}
                   activePlots={activePlots}
                   isLoadingCurrentTab={plotsLoading}
                 />
              )}
            </article>

            {/* SIDEBAR COLUMN (4 cols) */}
            <aside className="lg:col-span-4" aria-label="Company Details Sidebar">
              <CompanySidebar company={company} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
