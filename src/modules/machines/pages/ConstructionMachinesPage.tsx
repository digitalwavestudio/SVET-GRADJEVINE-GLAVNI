import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Tractor } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import DynamicSEO from '@/src/components/DynamicSEO';
import { generateProductListSchema } from '@/src/lib/seoSchema';
import LoadingState from '@/src/components/LoadingState';
import NoResults from '@/src/components/ui/NoResults';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { APP_CONFIG } from '@/src/constants/config';
import { FilterSidebar, FilterClearButton, FilterSection, FilterToggle, FilterRadio, FilterSelect, FilterInput, FilterCTA, ActiveFilterChips, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import {
  FUEL_TYPES,
  MACHINE_CATEGORIES,
  MACHINE_SUBCATEGORIES
} from '@/src/constants/machineTaxonomy';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { useMachinesList } from '@/src/modules/machines/hooks/useMachines';
import { useDebounce } from '@/src/hooks/useDebounce';
import { usePrefetch } from '@/src/hooks/usePrefetch';
import { resolveRouteFilters } from '@/src/lib/routeFilters';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import { useCollectionStats, useCount, useFilteredCount } from '@/src/hooks/useCollectionStats';
import { AnalyticsDashboardUI } from '@/src/components/AnalyticsDashboardUI';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';

export default function ConstructionMachinesPage() {
  const params = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Resolve routing ambiguity using central utility
  const resolved = resolveRouteFilters('masine', params);
  const { locationSlug: gradSlug, categorySlug: kategorijaSlug } = resolved;
  const searchParamsStr = searchParams.toString();

  // URL State as Single Source of Truth
  const activeFilters = useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const minW = currentParams.get('minWeight');
    const maxW = currentParams.get('maxWeight');

    return {
      location: gradSlug || undefined,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      categoryId: kategorijaSlug || undefined,
      adType: currentParams.get('type') && currentParams.get('type') !== 'all' ? currentParams.get('type') : null,
      fuelType: currentParams.get('fuel') && currentParams.get('fuel') !== 'all' ? currentParams.get('fuel') : null,
      minWeightKg: minW ? Number(minW) : null,
      maxWeightKg: maxW ? Number(maxW) : null,
      searchQuery: currentParams.get('q') || undefined
    };
  }, [gradSlug, kategorijaSlug, searchParamsStr]);

  const activeFiltersKey = JSON.stringify(activeFilters);
  
  const { data: machineStats } = useCollectionStats('machines');
  const { data: rentalCount } = useFilteredCount('machines', [{ field: 'priceType', op: 'in', value: ['daily', 'monthly'] }]);
  const { data: partnerCount } = useCount('companies');
  
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useMachinesList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const machines = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);
  const isEmptyFilter = !activeFilters || Object.keys(activeFilters).length === 0 || (Object.keys(activeFilters).length === 1 && (activeFilters as any).status === 'approved');
  const totalMachinesCount = (data?.pages[0] as any)?.totalHits ?? (isEmptyFilter ? machineStats?.total : machines.length) ?? machines.length;

  const machinesToDisplay = useMemo(() => {
    let result = [...machines].map(m => ({
      ...m,
      adTitle: m.adTitle || m.title,
      year: m.year || m.machYear,
      workingHours: m.workingHours || m.machHours,
      price: m.price || m.machPrice,
      pricePerDay: m.pricePerDay || m.machPricePerDay,
      pricePerHour: m.pricePerHour || m.machPricePerHour,
      adType: m.adType || m.machAdType,
      fuelType: m.fuelType || m.machFuel,
      categoryId: m.categoryId || m.machCategory || m.machSubCategory,
      condition: m.condition || 'polovno',
    }));
    
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => {
        const p1 = Number(a.price || a.pricePerDay || a.pricePerHour || 0);
        const p2 = Number(b.price || b.pricePerDay || b.pricePerHour || 0);
        return p1 - p2;
      });
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => {
        const p1 = Number(a.price || a.pricePerDay || a.pricePerHour || 0);
        const p2 = Number(b.price || b.pricePerDay || b.pricePerHour || 0);
        return p2 - p1;
      });
    }

    return result;
  }, [data, sortBy]);
  
  const prefetch = usePrefetch();
  
  // Local filter states handling
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [filterCategory, setFilterCategory] = useState<string | null>(kategorijaSlug ?? null);
  const [filterSubcategory, setFilterSubcategory] = useState<string | null>(searchParams.get('subcategory') || null);
  const [filterLocation, setFilterLocation] = useState(gradSlug || 'all');
  const [filterOperator, setFilterOperator] = useState(searchParams.get('op') === 'true');
  const [filterFuel, setFilterFuel] = useState(searchParams.get('fuel') || 'all');
  const [minWeight, setMinWeight] = useState(searchParams.get('minWeight') || '');
  const [maxWeight, setMaxWeight] = useState(searchParams.get('maxWeight') || '');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');

  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedMinWeight = useDebounce(minWeight, 500);
  const debouncedMaxWeight = useDebounce(maxWeight, 500);
  const debouncedRadius = useDebounce(filterRadius, 500);
  const currentSubcategories = useMemo(() => 
    filterCategory ? MACHINE_SUBCATEGORIES[filterCategory] || [] : []
  , [filterCategory]);

  // Active Filter Chips Logic
  const filterChips = useMemo(() => {
    const list: { id: string; label: string; value: unknown }[] = [];
    
    if (searchQuery) list.push({ id: 'search', label: 'PRETRAGA', value: searchQuery });
    if (filterType !== 'all') list.push({ id: 'type', label: 'TIP', value: filterType === 'prodaja' ? 'PRODAJA' : 'NAJAM' });
    if (filterCategory) {
      const cat = MACHINE_CATEGORIES.find(c => c.id === filterCategory);
      if (cat) list.push({ id: 'category', label: 'KATEGORIJA', value: cat.name });
    }
    if (filterSubcategory) {
      const sub = currentSubcategories.find(s => s.id === filterSubcategory);
      if (sub) list.push({ id: 'subcategory', label: 'PODKATEGORIJA', value: sub.name });
    }
    if (filterLocation !== 'all') {
      const loc = LOCATIONS.find(l => l.slug === filterLocation);
      if (loc) list.push({ id: 'location', label: 'LOKACIJA', value: loc.name });
    }
    if (filterFuel !== 'all') {
      const fuel = FUEL_TYPES.find(f => f.id === filterFuel);
      if (fuel) list.push({ id: 'fuel', label: 'POGON', value: fuel.name });
    }
    if (minWeight || maxWeight) {
      list.push({ id: 'weight', label: 'TEŽINA', value: `${minWeight || 0}kg - ${maxWeight || '∞'}kg` });
    }
    if (filterOperator) list.push({ id: 'operator', label: 'USLUGA', value: 'SA RUKOVAOCEM' });

    return list;
  }, [searchQuery, filterType, filterCategory, filterSubcategory, filterLocation, filterFuel, minWeight, maxWeight, filterOperator, currentSubcategories]);

  const removeFilterChip = (id: string) => {
    if (id === 'search') setSearchQuery('');
    else if (id === 'type') setFilterType('all');
    else if (id === 'category') { setFilterCategory(null); setFilterSubcategory(null); }
    else if (id === 'subcategory') setFilterSubcategory(null);
    else if (id === 'location') setFilterLocation('all');
    else if (id === 'fuel') setFilterFuel('all');
    else if (id === 'weight') { setMinWeight(''); setMaxWeight(''); }
    else if (id === 'operator') setFilterOperator(false);
  };

  // Main filter application logic
  const handleApplyFilters = useCallback(() => {
    const loc = filterLocation !== 'all' ? filterLocation : null;
    const cat = filterCategory !== 'all' ? filterCategory : null;
    
    let newPath = '/masine';
    if (loc) {
      newPath = cat ? `/masine/${cat}/${loc}` : `/masine/${loc}`;
    } else if (cat) {
      newPath = `/masine/${cat}`;
    }

    const newParams = new URLSearchParams();
    if (filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    if (searchQuery.trim()) newParams.set('q', searchQuery.trim());
    if (filterType && filterType !== 'all') newParams.set('type', filterType);
    if (filterFuel && filterFuel !== 'all') newParams.set('fuel', filterFuel);
    if (debouncedMinWeight) newParams.set('minWeight', debouncedMinWeight);
    if (debouncedMaxWeight) newParams.set('maxWeight', debouncedMaxWeight);
    if (filterOperator) newParams.set('op', 'true');
    if (filterSubcategory) newParams.set('subcategory', filterSubcategory!);

    const currentPath = location.pathname;
    const currentParams = searchParamsStr;
    const targetParams = newParams.toString();

    // STRICT NAVIGATION GUARD
    if (currentPath !== newPath || currentParams !== targetParams) {
      if (currentPath !== newPath) {
        navigate(`${newPath}?${targetParams}`, { preventScrollReset: true });
      } else {
        setSearchParams(newParams, { preventScrollReset: true });
      }
    }
  }, [filterLocation, filterCategory, filterRadius, searchQuery, filterType, filterFuel, debouncedMinWeight, debouncedMaxWeight, filterOperator, filterSubcategory, navigate, setSearchParams, searchParamsStr]);

  // Auto apply filters - strictly guarded to prevent loops
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const currentQ = currentParams.get('q') || '';
    const currentType = currentParams.get('type') || 'all';
    const currentLoc = gradSlug || 'all';
    const currentCat = kategorijaSlug || 'all';
    const currentSub = currentParams.get('subcategory') || '';
    const currentOp = currentParams.get('op') === 'true';
    const currentFuel = currentParams.get('fuel') || 'all';
    const currentMinW = currentParams.get('minWeight') || '';
    const currentMaxW = currentParams.get('maxWeight') || '';
    const currentRadius = currentParams.get('radius') || '50';

    const hasChanged = 
      debouncedSearch !== currentQ ||
      filterType !== currentType ||
      debouncedRadius !== currentRadius ||
      filterCategory !== (currentCat === 'all' ? null : currentCat) ||
      filterSubcategory !== (currentSub || null) ||
      filterLocation !== currentLoc ||
      filterOperator !== currentOp ||
      filterFuel !== currentFuel ||
      debouncedMinWeight !== currentMinW ||
      debouncedMaxWeight !== currentMaxW;

    if (hasChanged) {
      handleApplyFilters();
    }
  }, [
    debouncedSearch, 
    filterType, 
    filterCategory, 
    filterSubcategory, 
    debouncedRadius, 
    filterLocation, 
    filterOperator, 
    filterFuel, 
    debouncedMinWeight, 
    debouncedMaxWeight, 
    handleApplyFilters, 
    searchParamsStr, 
    gradSlug, 
    kategorijaSlug
  ]);

  // Sync state with URL when searchParams change (handling back/forward)
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const q = currentParams.get('q') || '';
    const type = currentParams.get('type') || 'all';
    const sub = currentParams.get('subcategory') || null;
    const fuel = currentParams.get('fuel') || 'all';
    const minW = currentParams.get('minWeight') || '';
    const maxW = currentParams.get('maxWeight') || '';
    const op = currentParams.get('op') === 'true';
    const loc = gradSlug || 'all';
    const cat = kategorijaSlug || null;
    const rad = currentParams.get('radius') || '50';

    if (q !== searchQuery) setSearchQuery(q);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (type !== filterType) setFilterType(type);
    if (sub !== filterSubcategory) setFilterSubcategory(sub);
    if (fuel !== filterFuel) setFilterFuel(fuel);
    if (minW !== minWeight) setMinWeight(minW);
    if (maxW !== maxWeight) setMaxWeight(maxW);
    if (op !== filterOperator) setFilterOperator(op);
    if (loc !== filterLocation) setFilterLocation(loc);
    if (cat !== filterCategory) setFilterCategory(cat);
  }, [searchParamsStr, gradSlug, kategorijaSlug]);

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterCategory(null);
    setFilterSubcategory(null);
    setFilterLocation('all');
    setFilterRadius('50');
    setFilterOperator(false);
    setFilterFuel('all');
    setMinWeight('');
    setMaxWeight('');
    setSearchQuery('');
    navigate('/masine');
  };

  const seoSchema = useMemo(() => generateProductListSchema(
    machinesToDisplay.slice(0, 20).map((machine: any) => ({
      name: machine.title || machine.adTitle,
      url: `${APP_CONFIG.BASE_URL}/gradjevinske-masine/${gradSlug || 'srbija'}/${kategorijaSlug || machine.category || 'ostalo'}/${machine.id}`,
      description: machine.description || machine.opis,
      image: machine.images?.[0]
    })),
    {
      name: "Građevinske Mašine - Prodaja i Iznajmljivanje | Svet Građevine",
      description: "Najveća baza građevinskih mašina u regiji. Bageri, valjci, dizalice, utovarivači na jednom mestu.",
      url: `${APP_CONFIG.BASE_URL}/gradjevinske-masine${gradSlug ? `/${gradSlug}` : ''}${kategorijaSlug ? `/${kategorijaSlug}` : ''}`,
    }
  ), [machinesToDisplay, gradSlug, kategorijaSlug]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <DynamicSEO type="masine" grad={gradSlug ?? undefined} zanimanje={kategorijaSlug ?? undefined} jsonLd={[seoSchema]} itemCount={totalMachinesCount} />

      <StandardPageHero
        badge="GRAĐEVINSKE MAŠINE"
        title="GRAĐEVINSKE"
        titleAccent="MAŠINE"
        subtitle="Prodaja i najam građevinske mehanizacije. Optimizovana pretraga po tonaži, pogonu i nameni."
        stats={[
          { label: "Oglasa Danas", value: machineStats?.today?.toLocaleString() || "40", icon: "precision_manufacturing" },
          { label: "Najam Dostupan", value: rentalCount?.toLocaleString() || "120", icon: "forklift" },
          { label: "Partneri", value: partnerCount?.toLocaleString() || "80", icon: "verified" }
        ]}
      >
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl w-full">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:scale-110 transition-transform">manage_search</span>
            <input 
              aria-label="Pretraga mašina po modelu ili proizvođaču" 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Model mašine, proizvođač..." 
              className="w-full bg-transparent outline-none border-none text-white px-3 md:px-6 py-4 md:py-5 font-black uppercase tracking-[0.2em] placeholder:text-white/20 text-[10px]" 
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </div>
          <Link to="/postavi-oglas" className="w-full md:w-auto bg-secondary text-slate-950 font-black uppercase tracking-[0.2em] px-12 h-16 rounded-[10px] hover:bg-white transition-all shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0 text-[10px]">
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span>OGLASI MAŠINU</span>
          </Link>
        </div>
      </StandardPageHero>

      {/* Main Content Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col-reverse lg:flex-row-reverse gap-12">
        
        {/* Sidebar Filters - Redesigned for B2B */}
        <FilterSidebar>
          <MarketStatsWidget 
            stats={{ 
              total: machineStats?.total || 0, 
              trend: machineStats?.today?.toString() || "8", 
              category: "MAŠINA" 
            }} 
          />
          {/* Lokacija - Prva na vrhu */}
          <FilterSection title="LOKACIJA">
            <div className="space-y-4">
              <LocationCombobox 
                selectedLocation={filterLocation && filterLocation !== 'all' ? filterLocation : null}
                onChange={(slug) => setFilterLocation(slug || 'all')}
              />
              
              {filterLocation !== 'all' && (
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

          <FilterSection title="TEŽINA (kg)">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase ml-1">Min</label>
                <FilterInput 
                  placeholder="Npr. 2000" 
                  type="number"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase ml-1">Max</label>
                <FilterInput 
                  placeholder="Npr. 15000" 
                  type="number"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </FilterSection>

          {/* Clear All Button */}
          {(filterType !== 'all' || filterLocation !== 'all' || filterCategory || filterSubcategory || filterFuel !== 'all' || minWeight || maxWeight || filterOperator || filterRadius !== '50') && (
            <FilterClearButton onClick={handleResetFilters} />
          )}

          <FilterSection title="KOMERCIJALNI PARAMETRI">
            <div className="space-y-4">
              <div className="space-y-3">
                <FilterRadio 
                  name="mtype" 
                  label="Sve" 
                  checked={filterType === 'all'} 
                  onChange={() => setFilterType('all')} 
                />
                <FilterRadio 
                  name="mtype" 
                  label="Najam" 
                  checked={filterType === 'iznajmljivanje'} 
                  onChange={() => setFilterType('iznajmljivanje')} 
                />
                <FilterRadio 
                  name="mtype" 
                  label="Prodaja" 
                  checked={filterType === 'prodaja'} 
                  onChange={() => setFilterType('prodaja')} 
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Tehničke Specifikacije">
            <div className="space-y-4">
              <FilterSelect value={filterCategory || ''} onChange={(e) => { setFilterCategory(e.target.value || null); setFilterSubcategory(null); }}>
                <option value="" className="bg-[#111a22]">Sve kategorije</option>
                {MACHINE_CATEGORIES.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111a22]">{c.name}</option>)}
              </FilterSelect>

              {filterCategory && (
                <FilterSelect value={filterSubcategory || ''} onChange={(e) => setFilterSubcategory(e.target.value || null)}>
                  <option value="" className="bg-[#111a22]">Sve podkategorije</option>
                  {currentSubcategories.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111a22]">{c.name}</option>)}
                </FilterSelect>
              )}

              <FilterSelect value={filterFuel} onChange={(e) => setFilterFuel(e.target.value)}>
                <option value="all" className="bg-[#111a22]">Tip pogona (Svi)</option>
                {FUEL_TYPES.map(fuel => <option key={fuel.id} value={fuel.id} className="bg-[#111a22]">{fuel.name}</option>)}
              </FilterSelect>
            </div>
          </FilterSection>

          <FilterSection title="Dodatne Usluge">
            <div className="space-y-4">
              <FilterToggle 
                label="Sa rukovaocem" 
                checked={filterOperator} 
                onChange={setFilterOperator} 
              />
            </div>
          </FilterSection>

            


          
          <FilterCTA 
            title="PRODAJTE ILI IZNAJMITE MAŠINU"
            description="IZLOŽITE SVOJU MEHANIZACIJU NAJVEĆEM BROJU PROFESIONALNIH IZVOĐAČA RADOVA."
            buttonText="POSTAVI OGLAS"
            onClick={() => navigate('/postavi-oglas')}
            icon="forklift"
          />
        </FilterSidebar>

        {/* Listing Results */}
        <div className="flex-1 flex flex-col">
          <ActiveFilterChips 
            filters={filterChips} 
            onRemove={removeFilterChip} 
            onClearAll={handleResetFilters} 
          />

          {/* FACT-SHEET P-SEO DASHBOARD */}
          {((gradSlug && gradSlug !== 'all') || (kategorijaSlug && kategorijaSlug !== 'all')) && (
            <div className="mb-8" aria-labelledby="pseo-insights-title">
              <AnalyticsDashboardUI 
                type="machines" 
                zanimanjeSlug={!kategorijaSlug || kategorijaSlug === 'all' ? undefined : kategorijaSlug} 
                gradSlug={!gradSlug || gradSlug !== 'all' ? undefined : gradSlug} 
              />
            </div>
          )}

          <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
            <div className="flex items-start gap-4">
                <div className="w-[8px] h-16 bg-secondary mt-1"></div>
                <div>
                  <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter italic">
                    Aktivna <br /> <span className="text-secondary">Ponuda</span>
                  </h3>
                  <p className="text-[10px] font-black mt-2 tracking-[0.3em] uppercase">
                    <span className="text-white/40">UKUPNO PRONAĐENO:</span> <span className="text-secondary">{totalMachinesCount} OGLASA</span>
                  </p>
                </div>
              </div>
             <div className="flex items-center gap-6">
                <div className="flex bg-[#13212e]/60 backdrop-blur-md border border-white/5 rounded-lg p-1 gap-1">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'grid' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    title="Mrežni prikaz"
                  >
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'list' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    title="Lista"
                  >
                    <span className="material-symbols-outlined text-[20px]">view_list</span>
                  </button>
                </div>
             </div>
          </div>

          <SortingBar 
            currentSort={sortBy}
            options={[
              { value: 'newest', label: 'NAJNOVIJE' },
              { value: 'price-asc', label: 'NAJNIŽA CENA' },
              { value: 'price-desc', label: 'NAJVIŠA CENA' }
            ]}
            onChange={(val) => setSortBy(val as any)}
          />

          {loading && machinesToDisplay.length === 0 ? (
             <ListingSkeleton viewMode={viewMode} />
          ) : machinesToDisplay.length === 0 ? (
              <NoResults message="Pokušajte da proširite parametre filtera ili pretražite po opštijoj kategoriji." />
          ) : (
            <div className="w-full">
             <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" : "flex flex-col gap-6"}>
              {machinesToDisplay.map((machine: any, index: number) => {
                  const mCategory = MACHINE_CATEGORIES.find(c => c.id === machine.categoryId)?.name || machine.categoryId;
                  return (
                    <div 
                      key={machine.id}
                      className={`group relative h-full bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 flex flex-col overflow-hidden ${machine.isPremium ? 'border-secondary/30 bg-secondary/[0.02] shadow-[0_0_40px_rgba(254,191,13,0.08)]' : ''}`}
                    >
                      {/* Premium Aura */}
                      {machine.isPremium && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[60px] pointer-events-none" />
                      )}

                      {/* Image Module */}
                      <div className="h-52 relative overflow-hidden">
                        <Link onMouseEnter={() => prefetch('machine', machine.id)} to={`/gradjevinske-masine/${machine.id}?ref=algolia`} className="block h-full">
                          {machine.images?.[0] ? (
                            <OptimizedImage
                              src={machine.images?.[0]}
                              placeholder={machine.imagePlaceholders?.[0]}
                              alt={machine.adTitle || 'Mašina'}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                              containerClassName="h-full w-full"
                              isProcessing={machine.imageStatus === 'processing'}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#050f19] flex items-center justify-center">
                              <span className="material-symbols-outlined text-4xl text-white/5 italic">construction</span>
                            </div>
                          )}
                        </Link>
                        
                        {/* Overlay Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                           <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${machine.adType === 'prodaja' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-secondary/20 text-secondary border-secondary/30'}`}>
                             {machine.adType === 'prodaja' ? 'PRODAJA' : 'NAJAM'}
                           </span>
                           {machine.isUrgent && (
                             <span className="bg-orange-500 text-white px-2 py-0.5 rounded-sm text-[8px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg shadow-orange-500/30">
                               <span className="material-symbols-outlined text-[10px]">bolt</span> HITNO
                             </span>
                           )}
                        </div>

                        {/* Top Right Signals */}
                        <div className="absolute top-3 right-3 flex gap-1.5">
                           {machine.condition === 'novo' && (
                             <span className="px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest bg-green-500 text-white shadow-lg">
                                NOVO
                             </span>
                           )}
                           {machine.isServiced && (
                             <div className="bg-white/10 backdrop-blur-md w-6 h-6 rounded-sm flex items-center justify-center border border-white/20 shadow-lg" title="Servisirano">
                               <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                             </div>
                           )}
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111a22] to-transparent pointer-events-none"></div>
                      </div>

                       {/* Card Content Module */}
                       <div className="p-5 pt-3 flex-1 flex flex-col">
                         <div className="flex items-center gap-3 mb-4">
                           <div className="relative shrink-0 z-20">
                            {machine.companyLogo ? (
                              <OptimizedImage 
                                src={machine.companyLogo} 
                                fallbackType="company" 
                                alt={machine.companyName || "Logo kompanije"} 
                                className="w-full h-full object-cover" 
                                containerClassName="w-6 h-6 rounded-sm overflow-hidden border border-white/5" 
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-sm bg-white/5 flex items-center justify-center font-black text-white/20 uppercase text-[8px] border border-white/5">
                                {machine.companyName?.charAt(0) || 'M'}
                              </div>
                            )}
                            {machine.isCompanyVerified && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-[#111a22] shadow-md">
                                <span className="material-symbols-outlined text-white text-[6px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                              </div>
                            )}
                           </div>
                           <div className="flex flex-col">
                             <div className="flex items-center gap-1">
                               <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">{machine.companyName || 'SAMOSTALNI OGLAŠIVAČ'}</span>
                               {machine.isCompanyVerified && (
                                 <span className="hidden md:inline-block material-symbols-outlined text-blue-400 text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                               )}
                             </div>
                           </div>
                         </div>

                         <div className="mb-4">
                           <Link onMouseEnter={() => prefetch('machine', machine.id)} to={`/gradjevinske-masine/${machine.id}?ref=algolia`} className="block after:absolute after:inset-0">
                              <h3 className="text-xl font-black font-headline tracking-tight uppercase leading-tight group-hover:text-secondary transition-all line-clamp-2 italic">{machine.adTitle}</h3>
                           </Link>
                           <p className="text-secondary text-[8px] font-black uppercase tracking-widest mt-1 opacity-60 italic">{mCategory}</p>
                         </div>

                         {/* Professional Specs Grid */}
                         <div className="hidden md:grid grid-cols-2 gap-2 mb-6">
                            <div className="bg-[#050f19] p-2.5 rounded-sm border border-white/5 flex flex-col justify-center">
                              <span className="block text-[6px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-1 leading-none">
                                <span className="material-symbols-outlined text-[8px]">calendar_month</span> GODIŠTE
                              </span>
                              <span className="block text-[10px] font-black uppercase text-white font-mono">{machine.year || 'N/A'}</span>
                            </div>
                            <div className="bg-[#050f19] p-2.5 rounded-sm border border-white/5 flex flex-col justify-center">
                              <span className="block text-[6px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-1 leading-none">
                                <span className="material-symbols-outlined text-[8px]">timer</span> RADNI SATI
                              </span>
                              <span className="block text-[10px] font-black uppercase text-white font-mono">{machine.workingHours ? `${machine.workingHours} h` : 'N/A'}</span>
                            </div>
                         </div>

                         {/* Card CTA / Price Module */}
                         <div className="flex flex-col pt-4 border-t border-white/5 mt-auto">
                            <div className="flex justify-between items-end">
                               <div>
                                 <span className="block text-[7px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">{machine.adType === 'prodaja' ? 'PRODAJA' : 'NAJAM OD'}</span>
                                 {machine.isNegotiable && !machine.price && !machine.pricePerDay ? (
                                   <div className="text-lg font-black text-white uppercase tracking-tighter italic">NA UPIT</div>
                                 ) : (
                                   <div className="text-xl font-black text-white flex items-baseline gap-0.5 tracking-tighter font-mono">
                                     <span className="text-[10px] text-secondary font-black">€</span>
                                     {machine.price ? Number(machine.price).toLocaleString() : Number(machine.pricePerDay || machine.pricePerHour).toLocaleString()}
                                     {machine.adType === 'iznajmljivanje' && <span className="text-[7px] text-white/30 tracking-widest uppercase ml-1 font-sans font-black">/dan</span>}
                                   </div>
                                 )}
                               </div>
                               <Link onMouseEnter={() => prefetch('machine', machine.id)} to={`/gradjevinske-masine/${machine.id}?ref=algolia`} className="hidden md:flex text-secondary font-black text-[9px] items-center gap-1 hover:underline uppercase tracking-widest relative z-20">
                                 DETALJI <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                               </Link>
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
             </div>
             {isDeepPagingLimitReached && machinesToDisplay.length > 0 && (
               <div className="mt-12 flex justify-center w-full">
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
                   <p className="text-xs text-red-400 font-bold">
                     Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
                   </p>
                 </div>
               </div>
             )}

             {hasMore && machinesToDisplay.length > 0 && (
               <div className="mt-12 flex justify-center w-full">
                 <button
                   onClick={() => loadMore()}
                   disabled={loading}
                   className="bg-secondary text-slate-950 px-12 h-14 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all shadow-[0_10px_20px_rgba(254,191,13,0.15)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                 >
                   {loading ? 'UČITAVANJE...' : 'PRIKAŽI JOŠ OGLASA'}
                 </button>
               </div>
             )}
            </div>
          )}

          <div className="mt-4">
            <VerticalCTA 
              title="PRODAJETE ILI IZDAJETE MAŠINU?"
              description="DOSEGNITE DO NAJVEĆEG BROJA PROFESIONALNIH IZVOĐAČA RADOVA I FIRMI KOJIMA JE POTREBNA MEHANIZACIJA ZA PROJEKTE."
              buttonText="POSTAVI OGLAS"
              buttonLink="/postavi-oglas"
              icon={Tractor}
            />
          </div>
        </div>
      </section>

      <CrossVerticalHub 
        gradSlug={!gradSlug || gradSlug === 'all' ? undefined : gradSlug} 
        zanimanjeSlug={!kategorijaSlug || kategorijaSlug === 'all' ? undefined : kategorijaSlug} 
        currentVertical="masine" 
      />

      <SeoContentBlock type="masine" grad={gradSlug ?? undefined} zanimanje={kategorijaSlug ?? undefined} />
    </div>
  );
}
