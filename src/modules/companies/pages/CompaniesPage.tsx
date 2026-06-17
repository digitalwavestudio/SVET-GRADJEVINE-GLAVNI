import { VerticalCTA } from '@/src/components/VerticalCTA';
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
import { COMPANY_EMPLOYEE_RANGES, COMPANY_MAIN_CATEGORIES } from '@/src/constants/companyTaxonomy';
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
      employeeCount: searchParams.get('size') || null,
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
  const [selectedSize, setSelectedSize] = useState<string | null>(searchParams.get('size'));
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
    if (selectedSize) newParams.set('size', selectedSize);
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
  }, [selectedLocation, selectedMainCat, selectedSize, filterRadius, activeFilters.isPremiumPartner, searchParams, navigate, setSearchParams]);

  // Auto apply filters - strictly guarded to prevent loops
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentLoc = grad || 'all';
    const currentCat = searchParams.get('cat') || '';
    const currentSize = searchParams.get('size') || '';
    const currentRadius = searchParams.get('radius') || '50';
    const currentPremium = searchParams.get('premium') === 'true';
    const currentVerified = searchParams.get('verified') === 'true';

    // Premium is pulled from activeFilters to avoid stale state
    const isPremiumActive = !!activeFilters.isPremiumPartner;

    const hasChanged = 
      selectedLocation !== currentLoc ||
      selectedMainCat !== (currentCat || null) ||
      debouncedRadius !== currentRadius ||
      selectedSize !== (currentSize || null) ||
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
    selectedSize, 
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
    const size = searchParams.get('size') || null;
    const rad = searchParams.get('radius') || '50';
    const ver = searchParams.get('verified') === 'true';

    if (loc !== selectedLocation) setSelectedLocation(loc);
    if (cat !== selectedMainCat) setSelectedMainCat(cat);
    if (size !== selectedSize) setSelectedSize(size);
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
         <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl w-full">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="PRETRAŽI FIRME..."
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-4 md:px-6" 
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </div>
          <button 
            onClick={handleApplyFilters}
            className="w-full md:w-auto bg-secondary text-slate-950 px-12 h-16 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-xl">search</span>
            <span>PRETRAŽI</span>
          </button>
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
            {(selectedMainCat || (selectedLocation && selectedLocation !== 'all') || selectedSize || filterRadius !== '50' || verifiedOnly) && (
              <FilterClearButton 
                onClick={() => {
                  setSelectedMainCat(null);
                  setSelectedLocation('all');
                  setFilterRadius('50');
                  setSelectedSize(null);
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

            {/* Company Size */}
            <FilterSection title="Broj Zaposlenih">
              <FilterSelect
                value={selectedSize || ''}
                onChange={(e) => setSelectedSize(e.target.value || null)}
              >
                <option value="" className="bg-[#111a22]">Svi kapaciteti</option>
                {COMPANY_EMPLOYEE_RANGES.map(range => <option key={range.id} value={range.id} className="bg-[#111a22]">{range.name}</option>)}
              </FilterSelect>
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
                        className="group relative h-full bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 flex flex-col overflow-hidden"
                      >
                        {/* Cover Image Module */}
                        <div className="relative h-40 w-full overflow-hidden">
                          {company.coverImage ? (
                            <OptimizedImage 
                              src={company.coverImage} 
                              alt={company.name} 
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105" 
                              containerClassName="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#050f19]"></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111a22] via-[#111a22]/60 to-transparent"></div>

                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border border-green-500/30 backdrop-blur-md">
                              PIB PROVEREN
                            </div>
                            {(company as any).isPremiumPartner && (
                              <div className="flex items-center gap-1 bg-secondary text-slate-950 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest shadow-lg shadow-secondary/20">
                                <span className="material-symbols-outlined text-[12px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                PREMIUM
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content Module */}
                        <div className="relative px-5 pb-5 flex flex-col flex-grow -mt-8 z-10">
                          <div className="flex items-end gap-4 mb-4">
                            <div className="w-16 h-16 bg-white rounded-sm flex items-center justify-center p-2 border-4 border-[#111a22] shadow-2xl group-hover:border-secondary/30 transition-all duration-500 overflow-hidden shrink-0">
                              {company.logo ? (
                                <OptimizedImage src={company.logo} alt="Logo" className="w-full h-full object-contain" containerClassName="w-full h-full" />
                              ) : (
                                <span className="text-slate-950 font-black text-xl">{company.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <Link onMouseEnter={() => prefetch('company', company.id)} to={`/firma/${company.id}`} className="block">
                                <h3 className="text-lg font-black font-headline text-white uppercase tracking-tight group-hover:text-secondary transition-colors line-clamp-1 leading-none italic">{company.name}</h3>
                              </Link>
                              
                              {company.isVerified ? (
                                <div className="flex items-center gap-1 bg-[#0A1A0F]/80 border border-green-500/20 backdrop-blur-xl px-1.5 py-0.5 rounded-[4px] w-fit mt-2 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                                  <span className="text-[7.5px] font-black tracking-[0.1em] uppercase text-green-400">Verifikovan</span>
                                </div>
                              ) : (
                                <div className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">
                                  {LOCATIONS.find(l => l.slug === company.locationSlug)?.name}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-white/40 text-[10px] mb-6 line-clamp-2 leading-relaxed font-bold uppercase tracking-wider opacity-60 italic">{company.description}</p>

                          {/* Professional Specs Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-6">
                             <div className="bg-[#050f19] p-3 rounded-sm border border-white/5 flex flex-col justify-center">
                               <span className="block text-[7px] font-black uppercase tracking-widest text-white/20 mb-1.5 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[9px]">public</span> POKRIVENOST
                               </span>
                               <span className="block text-[9px] font-black uppercase text-white font-mono">{company.coverageType === 'national' ? 'SRBIJA' : 'REGIONAL'}</span>
                             </div>
                             <div className="bg-[#050f19] p-3 rounded-sm border border-white/5 flex flex-col justify-center">
                               <span className="block text-[7px] font-black uppercase tracking-widest text-white/20 mb-1.5 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[9px]">group</span> RESURSI
                               </span>
                               <span className="block text-[9px] font-black uppercase text-white font-mono">
                                 {COMPANY_EMPLOYEE_RANGES.find(r => r.id === company.employeeCount)?.name || 'N/A'}
                               </span>
                             </div>
                          </div>

                          {/* Action Module */}
                          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {company.mainCategories.slice(0, 1).map((catId: string) => (
                                <span key={catId} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-[0.2em] text-white/40">
                                  {COMPANY_MAIN_CATEGORIES.find(c => c.id === catId)?.name || 'INŽENJERING'}
                                </span>
                              ))}
                            </div>
                            <Link onMouseEnter={() => prefetch('company', company.id)} to={`/firma/${company.id}`} className="text-secondary font-black text-[9px] flex items-center gap-1 hover:underline uppercase tracking-widest">
                              DETALJI <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
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
                        className="bg-secondary flex items-center gap-2 text-slate-950 font-black px-8 py-4 rounded-[10px] text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50"
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

            {/* AI Assistant Banner */}
            <div className="mt-20 bg-gradient-to-br from-secondary/10 to-transparent p-10 rounded-[10px] border border-secondary/20 flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-secondary/20 rounded-[10px] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-4xl animate-pulse">psychology</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Tražite specifičnu ekipu za vaš projekat?</h4>
                <p className="text-xs text-white/40 font-bold uppercase tracking-[0.1em] leading-relaxed">
                  Pustite naš SmartMatch AI da analizira vaše zahteve i preporuči vam najbolje partnere na osnovu vaših referenci, budžeta i rokova.
                </p>
              </div>
              <button className="px-8 py-4 bg-secondary text-slate-950 font-black rounded-[10px] text-[10px] uppercase tracking-widest">POKRENI SMARTMATCH</button>
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
