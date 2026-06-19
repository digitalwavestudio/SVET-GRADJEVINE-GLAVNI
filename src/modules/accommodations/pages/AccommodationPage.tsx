import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Button } from '@/src/components/ui/Button';
import { Home } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { motion } from 'motion/react';
import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { generateLodgingListSchema } from '@/src/lib/seoSchema';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import DynamicSEO from '@/src/components/DynamicSEO';
import LoadingState from '@/src/components/LoadingState';
import NoResults from '@/src/components/ui/NoResults';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { APP_CONFIG } from '@/src/constants/config';
import { ACCOMMODATION_AMENITIES, ACCOMMODATION_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import { FilterSidebar, FilterClearButton, FilterSection, FilterSelect, FilterInput, FilterToggle, FilterCTA, ActiveFilterChips, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useAccommodationsList } from '@/src/modules/accommodations/hooks/useAccommodations';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import { useCollectionStats, useCount } from '@/src/hooks/useCollectionStats';
import { AnalyticsDashboardUI } from '@/src/components/AnalyticsDashboardUI';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';

import { resolveRouteFilters } from '@/src/lib/routeFilters';

export default function AccommodationPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const resolved = resolveRouteFilters('smestaj', params);
  const { locationSlug: gradSlug, typeSlug: tipSlug } = resolved;

  const searchParamsStr = searchParams.toString();

  // URL State as Single Source of Truth for Data Fetching
  const activeFilters = React.useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    return {
      location: gradSlug || null,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      type: tipSlug || currentParams.get('type') || null,
      minBeds: currentParams.get('minBeds') ? Number(currentParams.get('minBeds')) : null,
      invoiceAvailable: currentParams.get('invoiceAvailable') === 'true' || null,
      parkingAvailable: currentParams.get('parkingAvailable') === 'true' || null
    };
  }, [gradSlug, tipSlug, searchParamsStr]);

  const activeFiltersKey = JSON.stringify(activeFilters);
  
  const { data: accStats } = useCollectionStats('accommodations');
  const { data: companyCount } = useCount('companies');
  
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useAccommodationsList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const accommodationsBase = React.useMemo(() => data?.pages.flatMap(page => page?.items || []) || [], [data]);
  const isEmptyFilter = !activeFilters || Object.keys(activeFilters).length === 0 || (Object.keys(activeFilters).length === 1 && (activeFilters as any).status === 'approved');
  const totalAccommodationsCount = data?.pages[0]?.totalHits ?? (isEmptyFilter ? accStats?.total : accommodationsBase.length) ?? accommodationsBase.length;

  const accommodations = React.useMemo(() => {
    let result = [...accommodationsBase];
    
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => (Number(a.price || 0)) - (Number(b.price || 0)));
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => (Number(b.price || 0)) - (Number(a.price || 0)));
    }
    
    return result;
  }, [data, sortBy]);
  
  // Local form states for inputs (synced to URL on Apply)
  const [filterLocation, setFilterLocation] = useState(gradSlug || 'all');
  const [filterType, setFilterType] = useState(tipSlug || searchParams.get('type') || 'all');
  const [minBeds, setMinBeds] = useState(searchParams.get('minBeds') || '');
  const [filterInvoice, setFilterInvoice] = useState(searchParams.get('invoiceAvailable') === 'true');
  const [filterParking, setFilterParking] = useState(searchParams.get('parkingAvailable') === 'true');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');

  const debouncedMinBeds = useDebounce(minBeds, 500);
  const debouncedRadius = useDebounce(filterRadius, 500);

  // Active Filter Chips Logic
  const filterChips = React.useMemo(() => {
    const list: { id: string; label: string; value: any }[] = [];
    
    if (filterType !== 'all') {
      const type = ACCOMMODATION_TYPES.find(t => t.slug === filterType);
      if (type) list.push({ id: 'type', label: 'TIP', value: type.name });
    }
    if (filterLocation !== 'all') {
      const loc = LOCATIONS.find(l => l.slug === filterLocation);
      if (loc) list.push({ id: 'location', label: 'LOKACIJA', value: loc.name });
    }
    if (minBeds) {
      list.push({ id: 'beds', label: 'KREVETI', value: `${minBeds}+ kreveta` });
    }
    if (filterInvoice) list.push({ id: 'invoice', label: 'PLAĆANJE', value: 'FAKTURA' });
    if (filterParking) list.push({ id: 'parking', label: 'PARKING', value: 'TERETNI / KOMBI' });

    return list;
  }, [filterType, filterLocation, minBeds, filterInvoice, filterParking]);

  const removeFilterChip = (id: string) => {
    if (id === 'type') setFilterType('all');
    else if (id === 'location') setFilterLocation('all');
    else if (id === 'beds') setMinBeds('');
    else if (id === 'invoice') setFilterInvoice(false);
    else if (id === 'parking') setFilterParking(false);
  };

  // Auto apply filters - strictly guarded to prevent loops
  React.useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const currentLoc = gradSlug || currentParams.get('loc') || 'all';
    const currentType = tipSlug || currentParams.get('type') || 'all';
    const currentMinBeds = currentParams.get('minBeds') || '';
    const currentInvoice = currentParams.get('invoiceAvailable') === 'true';
    const currentParking = currentParams.get('parkingAvailable') === 'true';
    const currentRadius = currentParams.get('radius') || '50';

    const hasChanged = 
      filterLocation !== currentLoc ||
      filterType !== currentType ||
      debouncedRadius !== currentRadius ||
      debouncedMinBeds !== currentMinBeds ||
      filterInvoice !== currentInvoice ||
      filterParking !== currentParking;

    if (hasChanged) {
      handleApplyFilters();
    }
  }, [
    filterLocation, 
    filterType, 
    debouncedMinBeds, 
    debouncedRadius, 
    filterInvoice, 
    filterParking, 
    gradSlug, 
    tipSlug, 
    searchParamsStr
  ]);

  // Sync state with URL when searchParams/slugs change (back/forward)
  React.useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const loc = gradSlug || currentParams.get('loc') || 'all';
    const type = tipSlug || currentParams.get('type') || 'all';
    const minB = currentParams.get('minBeds') || '';
    const invoice = currentParams.get('invoiceAvailable') === 'true';
    const parking = currentParams.get('parkingAvailable') === 'true';
    const rad = currentParams.get('radius') || '50';

    if (loc !== filterLocation) setFilterLocation(loc);
    if (type !== filterType) setFilterType(type);
    if (minB !== minBeds) setMinBeds(minB);
    if (invoice !== filterInvoice) setFilterInvoice(invoice);
    if (parking !== filterParking) setFilterParking(parking);
    if (rad !== filterRadius) setFilterRadius(rad);
  }, [searchParamsStr, gradSlug, tipSlug]);

  const handleApplyFilters = () => {
    const loc = filterLocation !== 'all' ? filterLocation : null;
    const cat = filterType !== 'all' ? filterType : null;

    const params = new URLSearchParams();
    if (debouncedMinBeds) params.set('minBeds', debouncedMinBeds);
    if (filterInvoice) params.set('invoiceAvailable', 'true');
    if (filterParking) params.set('parkingAvailable', 'true');
    
    let locPath = '/smestaj';
    if (loc) {
      locPath = cat ? `/smestaj/${cat}/${loc}` : `/smestaj/lokacija/${loc}`;
      if (filterRadius && filterRadius !== '50') params.set('radius', filterRadius);
    } else if (cat) {
      locPath = `/smestaj/${cat}`;
    }

    const currentPath = window.location.pathname;
    const currentParams = searchParams.toString();
    const targetParams = params.toString();

    // STRICT NAVIGATION GUARD
    if (currentPath !== locPath || currentParams !== targetParams) {
      if (currentPath !== locPath) {
        navigate({ pathname: locPath, search: targetParams }, { preventScrollReset: true });
      } else {
        setSearchParams(params, { preventScrollReset: true });
      }
    }
  };

  const handleResetFilters = () => {
    setFilterLocation('all');
    setFilterRadius('50');
    setFilterType('all');
    setMinBeds('');
    setFilterInvoice(false);
    setFilterParking(false);
    navigate('/smestaj');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const locName = gradSlug ? LOCATIONS.find(l => l.slug === gradSlug)?.name : '';

  const itemListSchema = useMemo(() => generateLodgingListSchema(
    accommodations.slice(0, 20).map((acc) => ({
      name: acc.title,
      url: `${APP_CONFIG.BASE_URL}/smestaj/oglas/${acc.id}`,
      description: acc.description,
      image: acc.images?.[0]
    })),
    {
      name: `Smeštaj za radnike ${locName ? `u mestu ${locName}` : ''}`,
      description: `Katalog smeštaja za građevinske timove ${locName ? `iz mesta ${locName}` : 'širom Srbije'}.`,
      url: `${APP_CONFIG.BASE_URL}/smestaj${gradSlug ? `/${gradSlug}` : ''}`,
    }
  ), [accommodations, locName, gradSlug]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <DynamicSEO type="smestaj" grad={gradSlug || undefined} zanimanje={tipSlug || undefined} jsonLd={[
        itemListSchema
      ]} itemCount={totalAccommodationsCount} />
      
      <StandardPageHero
        badge="Premium Operativni Smeštaj"
        title="SMEŠTAJ"
        titleAccent="ZA RADNIKE"
        subtitle="Sistemski organizovan smeštaj za građevinske timove. Optimizovan za dugoročni boravak i maksimalnu efikasnost vaših radnika."
        stats={[
          { label: "Dostupni Kreveti", value: "1.5K+", icon: "group" }, // This would need a sum query, for now maybe I'll use a placeholder or total active objects
          { label: "Aktivni Objekti", value: accStats?.total?.toLocaleString() || "85", icon: "apartment" },
          { label: "B2B Klijenti", value: companyCount?.toLocaleString() || "120", icon: "corporate_fare" }
        ]}
      >
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl w-full">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group" onClick={() => document.getElementById('accommodation-search')?.scrollIntoView({ behavior: 'smooth' })}>
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">search</span>
            <input
              type="text"
              placeholder="ISTRAŽI DOSTUPNE LOKACIJE I KAPACITETE..."
              readOnly
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-3 md:px-6 cursor-pointer" 
            />
          </div>
          <Button 
            onClick={() => document.getElementById('accommodation-search')?.scrollIntoView({ behavior: 'smooth' })}
            variant="primary"
            className="w-full md:w-auto px-12 h-16 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none"
            icon="search"
          >
            PRETRAŽI
          </Button>
        </div>
      </StandardPageHero>

      {/* Industrial Filter Bar was here but moved to Sidebar */}

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col-reverse lg:flex-row-reverse gap-12">
        {/* Sidebar Filters */}
        <FilterSidebar>
          <MarketStatsWidget 
            stats={{ 
              total: accStats?.total || 0, 
              trend: "12", 
              category: "SMEŠTAJ" 
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

          {/* Kapacitet - Odmah ispod lokacije */}
          <FilterSection title="KAPACITET">
            <div className="space-y-4">
              <label className="text-[10px] text-white/40 font-black uppercase mb-1 block ml-1 tracking-widest">Min. broj kreveta</label>
              
              <div className="grid grid-cols-5 gap-2">
                {['2', '5', '10', '20', '50'].map(val => (
                  <button 
                    key={val}
                    onClick={() => setMinBeds(minBeds === val ? '' : val)}
                    className={`h-11 rounded-[10px] text-[11px] font-black border transition-all duration-300 flex items-center justify-center ${minBeds === val ? 'bg-secondary border-secondary text-slate-950 shadow-[0_0_20px_rgba(254,191,13,0.3)] scale-105' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:bg-white/10'}`}
                  >
                    {val}+
                  </button>
                ))}
              </div>

              <div className="relative mt-4">
                <FilterInput 
                  aria-label="Prizvoljan broj kreveta"
                  value={minBeds}
                  onChange={(e) => setMinBeds(e.target.value)}
                  placeholder="ILI UPIŠI BROJ..." 
                  type="number"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center text-[10px] font-black uppercase tracking-widest h-12"
                />
                {!minBeds && <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none">group_add</span>}
              </div>
            </div>
          </FilterSection>

          {/* Clear All Button */}
          {(filterLocation !== 'all' || filterType !== 'all' || minBeds !== '' || filterInvoice || filterParking || filterRadius !== '50') && (
            <FilterClearButton onClick={handleResetFilters} />
          )}

          <FilterSection title="TIP OBJEKTA">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setFilterType('all')}
                className={`py-6 px-4 rounded-[12px] border transition-all duration-300 flex flex-col items-center gap-3 text-center ${filterType === 'all' ? 'bg-secondary border-secondary text-slate-950 shadow-xl' : 'bg-[#13212e]/40 border-white/5 text-white/40 hover:border-white/20 hover:bg-[#192735]/60'}`}
              >
                <span className="material-symbols-outlined text-2xl">grid_view</span>
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight">Svi<br/>objekti</span>
              </button>
              {ACCOMMODATION_TYPES.map(type => (
                <button 
                  key={type.id}
                  onClick={() => setFilterType(filterType === type.slug ? 'all' : type.slug)}
                  className={`py-6 px-4 rounded-[12px] border transition-all duration-300 flex flex-col items-center gap-3 text-center ${filterType === type.slug ? 'bg-secondary border-secondary text-slate-950 shadow-xl' : 'bg-[#13212e]/40 border-white/5 text-white/40 hover:border-white/20 hover:bg-[#192735]/60'}`}
                >
                  <span className="material-symbols-outlined text-2xl">{type.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-tight line-clamp-2 h-6 flex items-center justify-center">
                    {type.name.split(' / ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="B2B POGODNOSTI">
            <div className="space-y-4">
              <FilterToggle 
                label="Plaćanje na fakturu" 
                checked={filterInvoice} 
                onChange={setFilterInvoice} 
              />
              <FilterToggle 
                label="Veliki parking (Kombi/Kamion)" 
                checked={filterParking} 
                onChange={setFilterParking} 
              />
            </div>
          </FilterSection>

          


          
          <FilterCTA 
            title="DODAJTE SMEŠTAJ"
            description="IZNAJMITE SVOJE KAPACITETE DIREKTNO GRAĐEVINSKIM FIRMAMA I TERENSKIM EKIPAMA."
            buttonText="REGISTRUJ SMEŠTAJ"
            onClick={() => navigate('/postavi-oglas')}
            icon="hotel"
          />
        </FilterSidebar>

        {/* Results Grid */}
        <div className="flex-1 w-full space-y-4">
          <ActiveFilterChips 
            filters={filterChips} 
            onRemove={removeFilterChip} 
            onClearAll={handleResetFilters} 
          />

          {/* FACT-SHEET P-SEO DASHBOARD */}
          {((gradSlug && gradSlug !== 'all') || (tipSlug && tipSlug !== 'all')) && (
            <div className="mb-8" aria-labelledby="pseo-insights-title">
              <AnalyticsDashboardUI 
                type="accommodations" 
                zanimanjeSlug={!tipSlug || tipSlug === 'all' ? undefined : tipSlug} 
                gradSlug={!gradSlug || gradSlug === 'all' ? undefined : gradSlug} 
              />
            </div>
          )}

          <div className="flex justify-between items-end border-b border-white/5 pb-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-[8px] h-16 bg-secondary mt-1"></div>
              <div>
                <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter italic">
                  Aktivna <br /> <span className="text-secondary">Ponuda</span>
                </h3>
                <p className="text-[10px] font-black mt-2 tracking-[0.3em] uppercase">
                  <span className="text-white/40">UKUPNO PRONAĐENO:</span> <span className="text-secondary">{totalAccommodationsCount} OGLASA</span>
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

          {loading && accommodations.length === 0 ? (
            <ListingSkeleton count={6} viewMode={viewMode} />
          ) : accommodations.length === 0 ? (
            <NoResults />
          ) : (
             <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" : "flex flex-col gap-6"}>
               {accommodations.map((acc: any) => (
                 <AccommodationCard key={acc.id} acc={acc} viewMode={viewMode} />
               ))}
             </div>
          )}

        {/* Load More */}
        {isDeepPagingLimitReached && (
          <div className="mt-12 flex justify-center">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
              <p className="text-xs text-red-400 font-bold">
                Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
              </p>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => loadMore()}
              disabled={loading}
              className={UI_TOKENS.BTN_SECONDARY + " px-12 py-4 h-auto text-sm font-black"}
            >
              {loading ? 'UČITAVANJE...' : 'UČITAJ JOŠ SMEŠTAJA'}
            </button>
          </div>
        )}

          <div className="mt-4">
            <VerticalCTA 
              title="IZDAJETE SMEŠTAJ ZA RADNIKE?"
              description="POPUNITE SVOJE KAPACITETE DIREKTNOM PONUDOM GRAĐEVINSKIM FIRMAMA I IZVOĐAČIMA RADOVA ŠIROM SRBIJE."
              buttonText="REGISTRUJ SMEŠTAJ"
              buttonLink="/postavi-oglas"
              icon={Home}
            />
          </div>
      </div>
    </section>

    {/* Map Integration */}
      <section className="mt-20 bg-[#000000] h-[800px] relative overflow-hidden border-t-4 border-[#13212e]">
        <div className="absolute inset-0 opacity-40 grayscale pointer-events-none">
          <OptimizedImage src={"/assets/workers-accommodation.jpg"} alt="Slika smeštaja za radnike" className="w-full h-full object-cover" loading="lazy" /> 
            
        </div>
        <div className="absolute inset-0 p-16 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-[#192735]/90 backdrop-blur-2xl p-10 border-l-8 border-[#ffad3a] max-w-lg rounded-r-[20px] shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              <h3 className="text-3xl font-black uppercase tracking-tight mb-4 font-headline text-white">INTERAKTIVNA MAPA SRBIJE</h3>
              <p className="text-base text-[#a2acb9] leading-relaxed font-medium mb-6">
                Pregledajte sve dostupne kapacitete širom Srbije. Obezbedite smeštaj radnika u neposrednoj blizini vašeg građevinskog projekta radi veće efikasnosti.
              </p>
              <div className="flex items-center gap-4 text-[#ffad3a] font-black text-xs tracking-widest uppercase">
                <span className="material-symbols-outlined">explore</span>
                Prikazano: 20 strateških lokacija
              </div>
            </motion.div>
            <div className="flex flex-col gap-4">
              {[
                { icon: "add", label: "Zoom In" },
                { icon: "remove", label: "Zoom Out" },
                { icon: "my_location", label: "My Location" },
                { icon: "layers", label: "Layers" }
              ].map(btn => (
                <button key={btn.icon} className="w-16 h-16 bg-[#192735] border border-white/10 flex items-center justify-center hover:bg-[#ffad3a] hover:text-[#543300] transition-all rounded-[10px] shadow-2xl group">
                  <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Map Pins - 20 pins across Serbia */}
          {[
            { top: '15%', left: '48%', label: 'Subotica', icon: 'apartment' },
            { top: '18%', left: '42%', label: 'Sombor', icon: 'home' },
            { top: '22%', left: '55%', label: 'Kikinda', icon: 'business' },
            { top: '30%', left: '48%', label: 'Novi Sad', icon: 'apartment' },
            { top: '32%', left: '53%', label: 'Zrenjanin', icon: 'home' },
            { top: '40%', left: '42%', label: 'Šabac', icon: 'business' },
            { top: '42%', left: '50%', label: 'Beograd', icon: 'apartment' },
            { top: '43%', left: '54%', label: 'Pančevo', icon: 'home' },
            { top: '48%', left: '53%', label: 'Smederevo', icon: 'business' },
            { top: '52%', left: '44%', label: 'Valjevo', icon: 'apartment' },
            { top: '58%', left: '51%', label: 'Kragujevac', icon: 'home' },
            { top: '62%', left: '55%', label: 'Jagodina', icon: 'business' },
            { top: '65%', left: '46%', label: 'Čačak', icon: 'apartment' },
            { top: '70%', left: '50%', label: 'Kraljevo', icon: 'home' },
            { top: '73%', left: '54%', label: 'Kruševac', icon: 'business' },
            { top: '80%', left: '58%', label: 'Niš', icon: 'apartment' },
            { top: '85%', left: '60%', label: 'Leskovac', icon: 'home' },
            { top: '92%', left: '62%', label: 'Vranje', icon: 'business' },
            { top: '82%', left: '45%', label: 'Novi Pazar', icon: 'apartment' },
            { top: '68%', left: '40%', label: 'Užice', icon: 'home' },
          ].map((pin, index) => (
            <motion.div 
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="absolute group cursor-pointer"
              style={{ top: pin.top, left: pin.left }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#ffad3a] rounded-full animate-ping opacity-20"></div>
                <div className="bg-gradient-to-br from-[#ffad3a] to-[#f59e0a] w-8 h-8 rotate-45 border-2 border-white shadow-2xl flex items-center justify-center relative z-10 group-hover:scale-125 transition-transform duration-300">
                  <span className="material-symbols-outlined -rotate-45 text-[#543300] text-base font-bold">{pin.icon}</span>
                </div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block w-max bg-[#192735] px-4 py-2 text-[10px] font-black border-b-2 border-[#ffad3a] rounded-t-lg shadow-2xl uppercase tracking-[0.2em] text-white whitespace-nowrap z-50">
                {pin.label} - Dostupno
              </div>
            </motion.div>
          ))}

          <div className="flex justify-center">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={UI_TOKENS.BTN_PRIMARY + " px-16"}
            >
              OTVORI MAPU PREKO CELOG EKRANA
            </motion.button>
          </div>
        </div>
      </section>

      <CrossVerticalHub 
        gradSlug={!gradSlug || gradSlug === 'all' ? undefined : gradSlug} 
        zanimanjeSlug={!tipSlug || tipSlug === 'all' ? undefined : tipSlug} 
        currentVertical="smestaj" 
      />

      <SeoContentBlock type="smestaj" grad={gradSlug || undefined} zanimanje={tipSlug || undefined} />
    </div>
  );
}

const AccommodationCard = React.memo(({ acc, viewMode }: { acc: any; viewMode: 'grid' | 'list' }) => {
  return (
    <div 
      className={`group relative h-full bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 flex flex-col overflow-hidden ${acc.isPremium ? 'border-secondary/30 bg-secondary/[0.02] shadow-[0_0_40px_rgba(254,191,13,0.08)]' : ''}`}
    >
      <div className="h-52 relative overflow-hidden">
        <OptimizedImage
          src={acc.images?.[0] || ""}
          placeholder={acc.imagePlaceholders?.[0]}
          alt={acc.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          containerClassName="h-full w-full"
          isProcessing={acc.imageStatus === 'processing'}
        /> 
          
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {acc.isUrgent && (
            <span className="bg-red-600 text-white font-black px-2 py-0.5 text-[8px] tracking-widest rounded-sm shadow-lg flex items-center gap-1 w-fit uppercase">
              <span className="material-symbols-outlined text-[10px]">bolt</span> HITNO
            </span>
          )}
          {acc.isPremium && (
            <span className="bg-secondary text-slate-950 font-black px-2 py-0.5 text-[8px] tracking-widest rounded-sm shadow-lg flex items-center gap-1 w-fit uppercase">
              <span className="material-symbols-outlined text-[10px]">star</span> PREMIUM
            </span>
          )}
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10 shadow-2xl transition-transform group-hover:translate-x-1">
           <div className="flex items-baseline gap-0.5 font-mono">
             <span className="text-[10px] text-secondary font-black">€</span>
             <span className="text-lg font-black text-white italic leading-none">{acc.price}</span>
             <span className="text-[7px] text-white/30 tracking-widest uppercase ml-1 font-sans font-black">/ {acc.priceType === 'perPerson' ? 'osobi' : 'dan'}</span>
           </div>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-sm border border-white/5">
            <span className="text-[7px] font-black text-white uppercase tracking-widest">{ACCOMMODATION_TYPES.find(t => t.slug === acc.typeSlug)?.name}</span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111a22] to-transparent pointer-events-none"></div>
      </div>

      <div className="p-5 pt-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
           {acc.companyLogo ? (
             <OptimizedImage 
               src={acc.companyLogo} 
               alt={acc.companyName || "Logo kompanije"} 
               className="w-full h-full object-cover" 
               containerClassName="w-6 h-6 rounded-sm overflow-hidden border border-white/5" 
             />
           ) : (
             <div className="w-6 h-6 rounded-sm bg-white/5 flex items-center justify-center font-black text-white/20 uppercase text-[8px] border border-white/5">
               {acc.companyName?.charAt(0) || 'S'}
             </div>
           )}
           <div className="flex items-center gap-1">
             <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">{acc.companyName || 'SAMOSTALNI OGLAŠIVAČ'}</span>
             {acc.isCompanyVerified && (
               <span className="material-symbols-outlined text-blue-400 text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
             )}
           </div>
        </div>

        <Link to={`/smestaj/oglas/${acc.id}`}>
          <h3 className="text-xl font-black font-headline tracking-tight uppercase leading-tight group-hover:text-secondary transition-all line-clamp-2 italic mb-1">{acc.title}</h3>
        </Link>
        <div className="flex items-center gap-1 text-white/60 text-[9px] font-bold uppercase tracking-widest mb-4">
          <span className="material-symbols-outlined text-secondary text-[12px]">location_on</span>
          {LOCATIONS.find(l => l.slug === acc.locationSlug)?.name}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
           <div className="bg-[#050f19] p-2.5 rounded-sm border border-white/5 flex flex-col justify-center">
             <span className="block text-[6px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-1 leading-none">
               <span className="material-symbols-outlined text-[8px]">group</span> KAPACITET
             </span>
             <span className="block text-[10px] font-black uppercase text-white font-mono">{acc.totalBeds} KREVETA</span>
           </div>
           <div className="bg-[#050f19] p-2.5 rounded-sm border border-white/5 flex flex-col justify-center">
             <span className="block text-[6px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-1 leading-none">
               <span className="material-symbols-outlined text-[8px]">door_open</span> DOSTUPNO
             </span>
             <span className="block text-[10px] font-black uppercase text-secondary font-mono">{acc.availableBeds || acc.totalBeds}</span>
           </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {(acc.amenities || []).slice(0, 3).map((slug: string) => {
            const amenity = ACCOMMODATION_AMENITIES.find(a => a.slug === slug || a.id === slug);
            return (
              <span key={slug} className="px-2 py-0.5 bg-white/5 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 text-white/40 rounded-sm border border-white/5">
                {amenity?.name || slug.replace(/-/g, ' ')}
              </span>
            );
          })}
        </div>

        <Link 
          to={`/smestaj/oglas/${acc.id}`}
          className="bg-white/5 hover:bg-white/10 text-white font-black py-3 rounded-[10px] border border-white/10 transition-all uppercase tracking-widest text-[10px] w-full mt-auto text-center"
        >
          POGLEDAJ DETALJE
        </Link>
      </div>
    </div>
  );
});

AccommodationCard.displayName = "AccommodationCard";
