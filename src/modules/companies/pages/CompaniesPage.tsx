import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Building2 } from 'lucide-react';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import NoResults from '@/src/components/ui/NoResults';
import Spinner from '@/src/components/ui/Spinner';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import DynamicSEO from '@/src/components/DynamicSEO';
import { COMPANY_MAIN_CATEGORIES } from '@/src/constants/companyTaxonomy';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useCompaniesList } from '@/src/modules/companies/hooks/useCompanies';
import withSEOAndFilters from '@/src/hoc/withSEOAndFilters';
import { usePrefetch } from '@/src/hooks/usePrefetch';
import { AiSearchBar } from '@/src/components/AiSearchBar';
import { resolveRouteFilters } from '@/src/lib/routeFilters';
import { generateCompanyListSchema } from '@/src/lib/seoSchema';
import { APP_CONFIG } from '@/src/constants/config';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { useCount, useCollectionStats, useFilteredCount } from '@/src/hooks/useCollectionStats';

function CompaniesPage() {
  const prefetch = usePrefetch();
  const params = useParams();

  const resolved = resolveRouteFilters('firme', params);
  const grad = resolved.locationSlug;
  const { data: companyCount } = useCount('companies');
  const { data: premiumCount } = useFilteredCount('companies', [{ field: 'isPremiumPartner', op: '==', value: true }]);
  const { data: companyStats } = useCollectionStats('companies');

  const activeFilters = useMemo(() => ({
    location: grad && grad !== 'all' ? grad : undefined,
  }), [grad]);

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useCompaniesList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const companies = useMemo(() => data?.pages.flatMap(page => page?.items || []) || [], [data]);

  const locName = grad ? LOCATIONS.find(l => l.slug === grad)?.name : '';
  const itemListSchema = useMemo(() => generateCompanyListSchema(
    companies.slice(0, 20).map((company: any) => ({
      name: company.name,
      url: `${APP_CONFIG.BASE_URL}/firma/${company.id}`,
      description: company.description,
      image: company.logo || company.coverImage
    })),
    {
      name: `Građevinske firme ${locName ? `u mestu ${locName}` : ''}`,
      description: `Katalog verifikovanih građevinskih firmi i partnera ${locName ? `iz mesta ${locName}` : 'u Srbiji'}.`,
      url: `${APP_CONFIG.BASE_URL}/firme${grad ? `/${grad}` : ''}`,
    }
  ), [locName, grad, companies]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <DynamicSEO
        type="firme"
        grad={grad ?? undefined}
        jsonLd={[itemListSchema]}
      />
      <StandardPageHero
        badge="BAZA GRAĐEVINSKIH FIRMI"
        title="GRAĐEVINSKE"
        titleAccent="KOMPANIJE"
        subtitle="Baza verifikovanih firmi, inženjerskih biroa i specijalizovanih izvođača radova u Srbiji."
        stats={[
          { label: "Verifikovanih firmi", value: companyCount?.toLocaleString() || "840", icon: "verified" },
          { label: "Novi partneri", value: `+${companyStats?.today?.toLocaleString() || "10"}`, icon: "add_business" },
          { label: "Premium", value: premiumCount?.toLocaleString() || "45", icon: "category" }
        ]}
      >
        <div className="mt-8 flex flex-col gap-4 max-w-4xl w-full">
          <AiSearchBar vertical="companies" />
        </div>
      </StandardPageHero>

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading && companies.length === 0 ? (
          <ListingSkeleton count={8} viewMode="grid" />
        ) : companies.length === 0 ? (
          <NoResults message="Nije pronađena nijedna firma." icon="business_center" />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {companies.map((company: any, idx: number) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group relative flex flex-col h-full bg-gradient-to-br from-[#111A22] to-[#050B10] border border-white/5 rounded-lg overflow-hidden transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_15px_40px_-10px_rgba(254,191,13,0.15)] hover:-translate-y-1"
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    {company.coverImage ? (
                      <OptimizedImage src={company.coverImage} alt={company.name} className="w-full h-full object-cover transition-transform duration-700 scale-105 group-hover:scale-110" containerClassName="w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#0F1720] to-[#182330]"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050B10] via-[#050B10]/40 to-transparent opacity-90"></div>
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      {company.isVerified && (
                        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 backdrop-blur-md px-2 py-0.5 rounded shadow-lg">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]"></span>
                          <span className="text-[8px] font-black tracking-widest uppercase text-green-400">Verifikovan</span>
                        </div>
                      )}
                      {(company as any).isPremiumPartner && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-secondary to-yellow-400 !text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(254,191,13,0.3)] transform transition-transform group-hover:scale-105">
                          <span className="material-symbols-outlined text-[10px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          PREMIUM
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative px-4 pb-4 flex-grow flex flex-col z-10">
                    <div className="flex items-center gap-4 mb-3 mt-2">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.5)] border-4 border-[#050B10] group-hover:border-secondary/20 transition-all duration-500 shrink-0 relative overflow-hidden">
                        {company.logo ? (
                          <OptimizedImage src={company.logo} alt="Logo" className="w-full h-full object-contain" containerClassName="w-full h-full" />
                        ) : (
                          <span className="!text-black font-black text-2xl opacity-20">{company.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link onMouseEnter={() => prefetch('company', company.id)} to={`/firma/${company.id}`} className="block group/link">
                          <h3 className="text-base font-black font-headline text-white uppercase tracking-tight group-hover/link:text-secondary transition-colors truncate">{company.name}</h3>
                        </Link>
                      </div>
                    </div>
                    <p className="text-white/50 text-[11px] mb-3 line-clamp-2 leading-relaxed font-medium flex-grow">{company.description}</p>
                    <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(company.mainCategories) && company.mainCategories.slice(0, 2).map((catId: string) => (
                          <span key={catId} className="bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-[0.12em]">
                            {COMPANY_MAIN_CATEGORIES.find(c => c.id === catId)?.name || 'INŽENJERING'}
                          </span>
                        ))}
                      </div>
                      <Link onMouseEnter={() => prefetch('company', company.id)} to={`/firma/${company.id}`} className="w-full bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-secondary hover:to-yellow-400 text-secondary hover:!text-black border border-secondary/20 hover:border-secondary transition-all px-4 py-2.5 rounded font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group/btn">
                        <span>Pogledaj profil</span>
                        <span className="material-symbols-outlined text-[12px] transition-transform duration-300 group-hover/btn:translate-x-1">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col justify-center mt-12 gap-4 items-center">
              {isDeepPagingLimitReached && (
                <div className="w-full">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg mx-auto">
                    <p className="text-xs text-red-400 font-bold">
                      Dosegli ste limit listanja.
                    </p>
                  </div>
                </div>
              )}
              {hasMore && (
                <button onClick={() => loadMore()} disabled={loading} className="bg-secondary flex items-center gap-2 !text-black font-black px-8 py-4 rounded-[10px] text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50">
                  {loading && <Spinner className="w-4 h-4" />}
                  {loading ? 'UČITAVANJE...' : 'Učitaj još'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-16">
          <VerticalCTA title="PREDSTAVITE SVOJU FIRMU?" description="UVRSTITE VAŠU KOMPANIJU U BAZU I OSTVARITE NOVE B2B SARADNJE SA INVESTITORIMA ŠIROM SRBIJE." buttonText="DODAJ FIRMU" buttonLink="/postavi-oglas" icon={Building2} />
        </div>
      </section>

      <SeoContentBlock type="firme" grad={grad ?? undefined} />
    </div>
  );
}

export default withSEOAndFilters(CompaniesPage, 'firme');
