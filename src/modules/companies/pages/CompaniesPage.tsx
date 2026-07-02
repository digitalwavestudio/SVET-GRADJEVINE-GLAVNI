import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Button } from '@/src/components/ui/Button';
import { Building2 } from 'lucide-react';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { AnimatePresence, motion } from 'motion/react';
import { VirtuosoGrid } from 'react-virtuoso';
import { useEffect, useMemo, useState, useCallback, forwardRef, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import LoadingState from '@/src/components/LoadingState';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import NoResults from '@/src/components/ui/NoResults';
import Spinner from '@/src/components/ui/Spinner';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';
import DynamicSEO from '@/src/components/DynamicSEO';
import { COMPANY_MAIN_CATEGORIES } from '@/src/constants/companyTaxonomy';
import { FilterSidebar, FilterClearButton, FilterSection, FilterRadio, FilterSelect, FilterCTA, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { APP_CONFIG } from '@/src/constants/config';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useCompaniesList } from '@/src/modules/companies/hooks/useCompanies';
import withSEOAndFilters from '@/src/hoc/withSEOAndFilters';
import { useDebounce } from '@/src/hooks/useDebounce';
import { usePrefetch } from '@/src/hooks/usePrefetch';
import { getOptimizedImageUrl } from '@/src/lib/imageOptimization';
import { resolveRouteFilters } from '@/src/lib/routeFilters';
import { generateCompanyListSchema } from '@/src/lib/seoSchema';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { AiSearchBar } from '@/src/components/AiSearchBar';
import { useCollectionStats, useCount, useFilteredCount } from '@/src/hooks/useCollectionStats';

function CompaniesPage() {
  const prefetch = usePrefetch();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Resolve routing ambiguity using central utility
  const resolved = resolveRouteFilters('firme', params);
  const grad = resolved.locationSlug;
  const { data: companyCount } = useCount('companies');
  const { data: premiumCount } = useFilteredCount('companies', [{ field: 'isPremiumPartner', op: '==', value: true }]);
  const { data: companyStats } = useCollectionStats('companies');

  // URL State as Single Source of Truth
  const activeFilters = useMemo(() => {
    return {
      location: grad && grad !== 'all' ? grad : null,
      radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined,
      mainCategory: searchParams.get('cat') || null,
      isPremiumPartner: searchParams.get('premium') === 'true' || undefined,
      isVerified: searchParams.get('verified') === 'true' || undefined
    };
  }, [grad, searchParams]);

  const activeFiltersKey = JSON.stringify(activeFilters);

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useCompaniesList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const companies = useMemo(() => data?.pages.flatMap(page => page?.items || []) || [], [data]);

  const [sortBy, setSortBy] = useState<'all' | 'premium'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Local filter states for inputs
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [selectedMainCat, setSelectedMainCat] = useState<string | null>(searchParams.get('cat'));
  const [selectedLocation, setSelectedLocation] = useState<string>(grad || 'all');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const debouncedRadius = useDebounce(filterRadius, 500);

  useEffect(() => {
    if (grad && selectedLocation !== grad) {
      setSelectedLocation(grad);
    }
  }, [grad]);

  const filteredCompanies = useMemo(() => {
    let result = companies;
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }

    if (sortBy === 'premium') {
      result = [...result].sort((a, b) => (b.isPremiumPartner ? 1 : 0) - (a.isPremiumPartner ? 1 : 0));
    }

    return result;
  }, [companies, debouncedSearchQuery, sortBy]);

  const isNavigatingRef = useRef(false);

  // Apply filters handler - Move up to avoid hoisting issues in useEffect
  const handleApplyFilters = useCallback(() => {
    const desiredLoc = selectedLocation || 'all';
    const newParams = new URLSearchParams();
    if (selectedMainCat) newParams.set('cat', selectedMainCat);
    if (filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    if (activeFilters.isPremiumPartner) newParams.set('premium', 'true');
    if (verifiedOnly) newParams.set('verified', 'true');

    const locPath = desiredLoc === 'all' ? '/firme' : `/firme/${desiredLoc}`;
    const currentPath = window.location.pathname;
    const currentParams = searchParams.toString();
    const targetParams = newParams.toString();

    // STRICT NAVIGATION GUARD
    if (currentPath !== locPath || currentParams !== targetParams) {
      if (currentPath !== locPath) {
        navigate(`${locPath}?${targetParams}`, { preventScrollReset: true });
      } else {
        setSearchParams(newParams, { preventScrollReset: true });
      }
    }
  }, [selectedLocation, selectedMainCat, filterRadius, activeFilters.isPremiumPartner, searchParams, navigate, setSearchParams]);

  // Auto apply filters - strictly guarded to prevent loops
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentLoc = grad || 'all';
    const currentCat = searchParams.get('cat') || '';
    const currentRadius = searchParams.get('radius') || '50';
    const currentPremium = searchParams.get('premium') === 'true';
    const currentVerified = searchParams.get('verified') === 'true';

    // Premium is pulled from activeFilters to avoid stale state
    const isPremiumActive = !!activeFilters.isPremiumPartner;

    const hasChanged = 
      selectedLocation !== currentLoc ||
      selectedMainCat !== (currentCat || null) ||
      debouncedRadius !== currentRadius ||
      isPremiumActive !== currentPremium ||
      verifiedOnly !== currentVerified;

    if (hasChanged) {
      isNavigatingRef.current = true;
      handleApplyFilters();
      setTimeout(() => { isNavigatingRef.current = false; }, 50);
    }
  }, [
    selectedMainCat, 
    selectedLocation, 
    debouncedRadius, 
    activeFilters.isPremiumPartner, 
    verifiedOnly,
    grad,
    searchParams,
    handleApplyFilters
  ]);

  // Sync state with URL when searchParams/slugs change (back/forward)
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const loc = grad || 'all';
    const cat = searchParams.get('cat') || null;
    const rad = searchParams.get('radius') || '50';
    const ver = searchParams.get('verified') === 'true';

    if (loc !== selectedLocation) setSelectedLocation(loc);
    if (cat !== selectedMainCat) setSelectedMainCat(cat);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (ver !== verifiedOnly) setVerifiedOnly(ver);
  }, [searchParams, grad]);

  const locName = grad ? LOCATIONS.find(l => l.slug === grad)?.name : '';
  const itemListSchema = useMemo(() => generateCompanyListSchema(
    filteredCompanies.slice(0, 20).map((company) => ({
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
  ), [locName, grad, filteredCompanies]);

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
 
      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col-reverse lg:flex-row-reverse gap-12">
          {/* Sidebar Filters */}
          <FilterSidebar>
            <MarketStatsWidget 
              stats={{ 
                total: companyCount || 0, 
                trend: "4", 
                category: "FIRMI" 
              }} 
            />
            {/* Lokacija - Prva na vrhu */}
            <FilterSection title="LOKACIJA">
              <div className="space-y-4">
                <LocationCombobox 
                  selectedLocation={selectedLocation && selectedLocation !== 'all' ? selectedLocation : null}
                  onChange={(slug) => setSelectedLocation(slug || 'all')}
                />
                
                {selectedLocation && selectedLocation !== 'all' && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-white/60">Radijus pretrage:</label>
                      <span className="text-xs font-bold text-secondary">+{filterRadius} km</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={filterRadius}
                      onChange={(e) => setFilterRadius(e.target.value)}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[10px] text-white/40">Samo grad</span>
                      <span className="text-[10px] text-white/40">+100 km</span>
                    </div>
                  </div>
                )}
              </div>
            </FilterSection>

            {/* Clear All Button */}
            {(selectedMainCat || (selectedLocation && selectedLocation !== 'all') || filterRadius !== '50' || verifiedOnly) && (
              <FilterClearButton 
                onClick={() => {
                  setSelectedMainCat(null);
                  setSelectedLocation('all');
                  setFilterRadius('50');
                  setVerifiedOnly(false);
                  setSearchParams(new URLSearchParams(), { preventScrollReset: true });
                }}
              />
            )}

            <FilterSection title="POVERENJE & BEZBEDNOST">
              <label className="flex items-center gap-3 cursor-pointer group bg-green-500/5 hover:bg-green-500/10 border border-green-500/20 p-4 rounded-[10px] transition-colors">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded-[4px] border-green-500/40 bg-transparent text-green-500 focus:ring-green-500/20 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-green-400 uppercase tracking-widest leading-none mb-1 shadow-[0_0_10px_rgba(34,197,94,0.3)] flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></span>
                    SAMO VERIFIKOVANI IZVOĐAČI
                  </span>
                  <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Trgovina sa 100% garancijom</span>
                </div>
              </label>
            </FilterSection>

            {/* Sektor */}
            <FilterSection title="GLAVNI SEKTOR">
              <div className="space-y-3">
                <FilterRadio 
                  name="sector" 
                  label="Svi Sektori" 
                  checked={selectedMainCat === null} 
                  onChange={() => setSelectedMainCat(null)} 
                />
                {COMPANY_MAIN_CATEGORIES.map((cat) => (
                  <FilterRadio 
                    key={cat.id} 
                    name="sector" 
                    label={cat.name} 
                    checked={selectedMainCat === cat.id} 
                    onChange={() => setSelectedMainCat(selectedMainCat === cat.id ? null : cat.id)} 
                  />
                ))}
              </div>
            </FilterSection>



            


            
            <FilterCTA 
              title="DODAJTE VAŠU FIRMU"
              description="POSTANITE DEO NAJVEĆE MREŽE GRAĐEVINSKIH PARTNERA I OSTVARITE NOVE B2B SARADNJE."
              buttonText="DODAJ FIRMU"
              onClick={() => navigate('/postavi-oglas')}
              icon="apartment"
            />
          </FilterSidebar>

          {/* Grid Content */}
          <div className="flex-1 space-y-10">
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-[8px] h-16 bg-secondary mt-1"></div>
              <div>
                <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter">
                  Aktivna <br /> <span className="text-secondary">Ponuda</span>
                </h3>
                <p className="text-[12px] font-black mt-2 tracking-widest uppercase">
                  <span className="text-white/40">ukupno:</span> <span className="text-secondary">{filteredCompanies.length} oglasa u opticaju</span>
                </p>
              </div>
            </div>
              <div className="flex items-center gap-6">
                <div className="flex bg-[#13212e]/60 backdrop-blur-md border border-white/5 rounded-lg p-1 gap-1">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'grid' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'list' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">view_list</span>
                  </button>
                </div>
              </div>
            </div>

            <SortingBar 
              currentSort={sortBy}
              options={[
                { value: 'all', label: 'SVE FIRME' },
                { value: 'premium', label: 'SAMO PREMIUM' }
              ]}
              onChange={(val) => setSortBy(val as any)}
            />

            {loading && filteredCompanies.length === 0 ? (
              <ListingSkeleton count={viewMode === 'grid' ? 6 : 4} viewMode={viewMode} />
            ) : filteredCompanies.length === 0 ? (
              <NoResults message="Nije pronađena nijedna firma sa izabranim kriterijumima." icon="business_center" />
            ) : (
              <div className="space-y-8">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col gap-6"}>
                  {filteredCompanies.map((company: any, index: number) => (
                      <div
                        key={company.id}
                        className="group relative flex flex-col h-full bg-gradient-to-br from-[#111A22] to-[#050B10] border border-white/5 rounded-xl overflow-hidden transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_15px_40px_-10px_rgba(254,191,13,0.15)] hover:-translate-y-1"
                      >
                        {/* Cover Image Module */}
                        <div className="relative h-44 w-full overflow-hidden">
                          {company.coverImage ? (
                            <OptimizedImage 
                              src={company.coverImage} 
                              alt={company.name} 
                              className="w-full h-full object-cover transition-transform duration-700 scale-105 group-hover:scale-110" 
                              containerClassName="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-[#0F1720] to-[#182330]"></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050B10] via-[#050B10]/40 to-transparent opacity-90"></div>
                          
                          {/* Badges */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                            {company.isVerified && (
                              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 backdrop-blur-md px-2.5 py-1 rounded-md shadow-lg">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                                <span className="text-[9px] font-black tracking-widest uppercase text-green-400">Verifikovan</span>
                              </div>
                            )}
                            {(company as any).isPremiumPartner && (
                              <div className="flex items-center gap-1 bg-gradient-to-r from-secondary to-yellow-400 !text-black px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(254,191,13,0.3)] transform transition-transform group-hover:scale-105">
                                <span className="material-symbols-outlined text-[12px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                PREMIUM
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content Module */}
                        <div className="relative px-6 pb-6 flex-grow flex flex-col -mt-10 z-10">
                          <div className="flex items-end gap-4 mb-5">
                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-2.5 shadow-[0_8px_25px_rgba(0,0,0,0.5)] border-4 border-[#050B10] group-hover:border-secondary/20 transition-all duration-500 shrink-0 relative overflow-hidden">
                              {company.logo ? (
                                <OptimizedImage src={company.logo} alt="Logo" className="w-full h-full object-contain" containerClassName="w-full h-full" />
                              ) : (
                                <span className="!text-black font-black text-3xl opacity-20">{company.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <Link onMouseEnter={() => prefetch('company', company.id)} to={`/firma/${company.id}`} className="block group/link">
                                <h3 className="text-xl font-black font-headline text-white uppercase tracking-tight group-hover/link:text-secondary transition-colors line-clamp-1">{company.name}</h3>
                              </Link>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">
                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                {LOCATIONS.find(l => l.slug === company.locationSlug)?.name || 'Srbija'}
                              </div>
                            </div>
                          </div>

                          <p className="text-white/60 text-xs mb-6 line-clamp-2 leading-relaxed font-medium">{company.description}</p>

                          {/* Action Module */}
                          <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(company.mainCategories) && company.mainCategories.slice(0, 2).map((catId: string) => (
                                <span key={catId} className="bg-secondary/10 border border-secondary/20 text-secondary px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-[0.15em]">
                                  {COMPANY_MAIN_CATEGORIES.find(c => c.id === catId)?.name || 'INŽENJERING'}
                                </span>
                              ))}
                            </div>
                            <Link 
                              onMouseEnter={() => prefetch('company', company.id)} 
                              to={`/firma/${company.id}`} 
                              className="text-white bg-white/5 hover:bg-secondary hover:text-black transition-colors px-4 py-2 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                              PROFIL <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
                  <div className="flex flex-col justify-center mt-12 gap-4 items-center">
                    {isDeepPagingLimitReached && (
                      <div className="w-full">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg mx-auto">
                          <p className="text-xs text-red-400 font-bold">
                            Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
                          </p>
                        </div>
                      </div>
                    )}
                    {hasMore && (
                      <button
                        onClick={() => loadMore()}
                        disabled={loading}
                        className="bg-secondary flex items-center gap-2 !text-black font-black px-8 py-4 rounded-[10px] text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50"
                      >
                        {loading && <Spinner className="w-4 h-4" />}
                        {loading ? 'UČITAVANJE...' : 'Učitaj još'}
                      </button>
                    )}
                  </div>
                </div>
            )}

            <div className="mt-4">
              <VerticalCTA 
                title="PREDSTAVITE SVOJU FIRMU?"
                description="UVRSTITE VAŠU KOMPANIJU U BAZU I OSTVARITE NOVE B2B SARADNJE SA INVESTITORIMA ŠIROM SRBIJE."
                buttonText="DODAJ FIRMU"
                buttonLink="/postavi-oglas"
                icon={Building2}
              />
            </div>


          </div>
        </div>
      </section>

      <CrossVerticalHub 
        gradSlug={!grad || grad === 'all' ? undefined : grad} 
        zanimanjeSlug={!searchParams.get('cat') || searchParams.get('cat') === 'SVE' ? undefined : searchParams.get('cat')!} 
        currentVertical="firme" 
      />

      <SeoContentBlock
        type="firme"
        grad={grad ?? undefined}
        zanimanje={searchParams.get('cat') || undefined}
      />
    </div>
  );
}

export default withSEOAndFilters(CompaniesPage, 'firme');
