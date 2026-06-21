import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Briefcase } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { generateJobPostingListSchema } from '@/src/lib/seoSchema';
import DynamicSEO from '@/src/components/DynamicSEO';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { useDebounce } from '@/src/hooks/useDebounce';
import { usePrefetch } from '@/src/hooks/usePrefetch';
import { resolveRouteFilters } from '@/src/lib/routeFilters';
import { buildJobUrl } from '@/src/lib/seo';
import { parseSearchQuery } from '@/src/services/aiService';

import { JobFilters } from '@/src/modules/jobs/components/jobs/JobFilters';
import { JobListings } from '@/src/modules/jobs/components/jobs/JobListings';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { JobsUrgent } from '@/src/modules/jobs/components/jobs/JobsUrgent';
import { JobsPremium } from '@/src/modules/jobs/components/jobs/JobsPremium';
import { JobsFeaturedCompanies } from '@/src/modules/jobs/components/jobs/JobsFeaturedCompanies';
import { ActiveFilterChips, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { Button } from '@/src/components/ui/Button';
import { APP_CONFIG } from '@/src/constants/config';
import { BENEFITS, LOCATIONS, SECTORS } from '@/src/constants/taxonomy';
import { useJobs, usePremiumJobs, useUrgentJobs } from '@/src/modules/jobs/hooks/useJobs';

import { useCollectionStats, useCount } from '@/src/hooks/useCollectionStats';
import { AnalyticsDashboardUI } from '@/src/components/AnalyticsDashboardUI';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';

function JobsPage() {
  const prefetch = usePrefetch();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Resolve route ambiguity using central utility
  const resolved = resolveRouteFilters('poslovi', params);
  const { locationSlug: grad, professionSlug: zanimanje } = resolved;

  // URL State as Single Source of Truth
  const searchParamsStr = searchParams.toString();
  
  const activeFilters = useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const minSalaryParam = Number(currentParams.get('minSalary'));
    const maxSalaryParam = Number(currentParams.get('maxSalary'));
    return {
      locationSlug: grad && grad !== 'all' ? grad : undefined,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      professionSlug: zanimanje && zanimanje !== 'SVE' ? zanimanje : undefined,
      searchQuery: currentParams.get('q') || undefined,
      sector: currentParams.get('sector') || undefined,
      engagement: currentParams.get('engagement') || undefined,
      experience: currentParams.get('experience') || undefined,
      minSalary: minSalaryParam && minSalaryParam > 0 ? minSalaryParam : undefined,
      maxSalary: maxSalaryParam && maxSalaryParam < 5000 ? maxSalaryParam : undefined,
      benefits: currentParams.getAll('benefit')
    };
  }, [grad, zanimanje, searchParamsStr]);

  const activeFiltersKey = JSON.stringify(activeFilters);

  const isEmptyFilter = Object.keys(activeFilters).length === 0;
  const hasLocalActiveFilters = (searchParams.get('minSalary') && searchParams.get('minSalary') !== '0') || (searchParams.get('maxSalary') && searchParams.get('maxSalary') !== '5000') || searchParams.getAll('benefit').length > 0;
  
  // Ako postoji bilo kakav filter (ukljucujuci lokaciju iz propsa ili searchParams), smatramo da je "Filtering"
  const isFiltering = !isEmptyFilter || hasLocalActiveFilters;

  const sanitizedFilters = useMemo(() => {
  const cleaned: Record<string, unknown> = {};
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'string' && value.trim() === '') return;
    cleaned[key] = value;
  });
  return cleaned;
}, [activeFilters]);

const { data, isLoading: loadingJobs, fetchNextPage: loadMore, hasNextPage } = useJobs(sanitizedFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const jobs = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

  const [showPremiumAndUrgent, setShowPremiumAndUrgent] = useState(false);
  useEffect(() => {
    if (jobs.length > 0) setShowPremiumAndUrgent(true);
  }, [jobs.length]);

  const { data: premiumData } = usePremiumJobs(sanitizedFilters, 6, { enabled: showPremiumAndUrgent });
  const { data: urgentData } = useUrgentJobs(sanitizedFilters, 6, { enabled: showPremiumAndUrgent });
  const premiumJobs = useMemo(() => premiumData?.pages.flatMap(p => p.items) || [], [premiumData]);
  const urgentJobs = useMemo(() => urgentData?.pages.flatMap(p => p.items) || [], [urgentData]);

  const { data: jobStats } = useCollectionStats('jobs');
  const { data: companyCount } = useCount('companies');

  const totalJobsCount = data?.pages[0]?.totalHits ?? (isEmptyFilter ? jobStats?.total : jobs.length) ?? jobs.length;

  // Filter states initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSector, setSelectedSector] = useState<string | null>(searchParams.get('sector'));
  const [selectedProfession, setSelectedProfession] = useState<string | null>(zanimanje || searchParams.get('profession') || null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(grad ? [grad] : searchParams.getAll('loc'));
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(searchParams.getAll('benefit'));
  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(searchParams.get('engagement'));
  const [selectedExperience, setSelectedExperience] = useState<string | null>(searchParams.get('experience'));
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    Number(searchParams.get('minSalary')) || 0,
    Number(searchParams.get('maxSalary')) || 5000
  ]);
  const [isUrgentExpanded, setIsUrgentExpanded] = useState(false);
  const [isPremiumExpanded, setIsPremiumExpanded] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const debouncedRadius = useDebounce(filterRadius, 500);

  // Active Filter Chips Logic
  const filterChips = useMemo(() => {
    const list: { id: string; label: string; value: unknown }[] = [];
    
    if (searchQuery) list.push({ id: 'search', label: 'PRETRAGA', value: searchQuery });
    if (selectedSector) {
      const sector = SECTORS.find(s => s.slug === selectedSector);
      if (sector) list.push({ id: 'sector', label: 'SEKTOR', value: sector.name });
    }
    if (selectedProfession) {
      list.push({ id: 'profession', label: 'ZANIMANJE', value: selectedProfession.toUpperCase().replace(/-/g, ' ') });
    }
    selectedLocations.forEach(loc => {
      const location = LOCATIONS.find(l => l.slug === loc);
      if (location) list.push({ id: `loc-${loc}`, label: 'LOKACIJA', value: location.name });
    });
    if (selectedEngagement) list.push({ id: 'engagement', label: 'ANGAŽMAN', value: selectedEngagement.toUpperCase() });
    if (selectedExperience) list.push({ id: 'experience', label: 'ISKUSTVO', value: selectedExperience.toUpperCase() });
    if (salaryRange[0] > 0 || salaryRange[1] < 5000) {
      list.push({ id: 'salary', label: 'PLATA', value: `${salaryRange[0]}€ - ${salaryRange[1]}€` });
    }
    selectedBenefits.forEach(b => {
      const benefit = BENEFITS.find(bf => bf.slug === b);
      if (benefit) list.push({ id: `ben-${b}`, label: 'POVOLJNOST', value: benefit.name });
    });

    return list;
  }, [searchQuery, selectedSector, selectedProfession, selectedLocations, selectedEngagement, selectedExperience, salaryRange, selectedBenefits]);

  const removeFilterChip = (id: string) => {
    if (id === 'search') setSearchQuery('');
    else if (id === 'sector') setSelectedSector(null);
    else if (id === 'profession') setSelectedProfession(null);
    else if (id === 'engagement') setSelectedEngagement(null);
    else if (id === 'experience') setSelectedExperience(null);
    else if (id === 'salary') setSalaryRange([0, 5000]);
    else if (id.startsWith('loc-')) {
      const loc = id.replace('loc-', '');
      setSelectedLocations(prev => prev.filter(l => l !== loc));
    }
    else if (id.startsWith('ben-')) {
      const ben = id.replace('ben-', '');
      setSelectedBenefits(prev => prev.filter(b => b !== ben));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSector(null);
    setSelectedProfession(null);
    setSelectedLocations([]);
    setSelectedBenefits([]);
    setSelectedEngagement(null);
    setSelectedExperience(null);
    setSalaryRange([0, 5000]);
  };

  // Primitive values for dependency arrays
  const selectedLocationsStr = selectedLocations.join(',');
  const selectedBenefitsStr = selectedBenefits.join(',');
  const salaryRangeMin = salaryRange[0];
  const salaryRangeMax = salaryRange[1];

  // Sync state with URL when back/forward is clicked (unidirectional guard)
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const q = currentParams.get('q') || '';
    const loc = grad || 'all';
    const prof = zanimanje || 'SVE';
    const sector = currentParams.get('sector');
    const engagement = currentParams.get('engagement');
    const experience = currentParams.get('experience');
    const minS = Number(currentParams.get('minSalary')) || 0;
    const maxS = Number(currentParams.get('maxSalary')) || 5000;
    const rad = currentParams.get('radius') || '50';
    const benefits = currentParams.getAll('benefit');

    if (q !== searchQuery) setSearchQuery(q);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (prof !== (selectedProfession || 'SVE')) setSelectedProfession(prof === 'SVE' ? null : prof);
    if (sector !== selectedSector) setSelectedSector(sector);
    if (engagement !== selectedEngagement) setSelectedEngagement(engagement);
    if (experience !== selectedExperience) setSelectedExperience(experience);
    if (minS !== salaryRange[0] || maxS !== salaryRange[1]) setSalaryRange([minS, maxS]);
    
    // Array comparisons
    const urlBenefitsStr = [...benefits].sort().join(',');
    const currentBenefitsStr = [...selectedBenefits].sort().join(',');
    if (urlBenefitsStr !== currentBenefitsStr) {
      setSelectedBenefits(benefits);
    }
    
    const urlLocs = grad ? [grad] : searchParams.getAll('loc');
    const urlLocsStr = [...urlLocs].sort().join(',');
    const currentLocsStr = [...selectedLocations].sort().join(',');
    if (urlLocsStr !== currentLocsStr) {
      setSelectedLocations(urlLocs);
    }
  }, [searchParamsStr, grad, zanimanje]);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'newest' | 'salary-desc' | 'urgent'>('newest');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);

  const debouncedSalary = useDebounce(salaryRange, 500);

  const navigate = useNavigate();

  const handleApplyFilters = useCallback(() => {
    const desiredLoc = selectedLocations.length > 0 ? selectedLocations[0] : null;

    // Update URL structure (path)
    let newPath = '/poslovi';
    if (desiredLoc && desiredLoc !== 'all') {
      newPath = selectedProfession && selectedProfession !== 'SVE' ? `/poslovi/${selectedProfession}/${desiredLoc}` : `/poslovi/${desiredLoc}`;
    } else if (selectedProfession && selectedProfession !== 'SVE') {
      newPath = `/poslovi/${selectedProfession}`;
    }

    // Update Query Params
    const newParams = new URLSearchParams();
    if (filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    if (searchQuery.trim()) newParams.set('q', searchQuery.trim());
    if (selectedSector) newParams.set('sector', selectedSector);
    if (selectedEngagement) newParams.set('engagement', selectedEngagement);
    if (selectedExperience) newParams.set('experience', selectedExperience);
    if (salaryRangeMin > 0) newParams.set('minSalary', salaryRangeMin.toString());
    if (salaryRangeMax < 5000) newParams.set('maxSalary', salaryRangeMax.toString());
    selectedBenefits.forEach(b => newParams.append('benefit', b));

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
  }, [selectedLocationsStr, filterRadius, selectedProfession, searchQuery, selectedSector, selectedEngagement, selectedExperience, salaryRangeMin, salaryRangeMax, selectedBenefitsStr, grad, zanimanje, navigate, setSearchParams, location.pathname, searchParamsStr]);

  // Unified auto-apply effect with change detection
  const debouncedSalaryMin = debouncedSalary[0];
  const debouncedSalaryMax = debouncedSalary[1];

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const currentQ = currentParams.get('q') || '';
    const currentLoc = grad || 'all';
    const currentProf = zanimanje || 'SVE';
    const currentSector = currentParams.get('sector');
    const currentEng = currentParams.get('engagement');
    const currentExp = currentParams.get('experience');
    const currentMinS = Number(currentParams.get('minSalary')) || 0;
    const currentMaxS = Number(currentParams.get('maxSalary')) || 5000;
    const currentRadius = currentParams.get('radius') || '50';
    const currentBenefits = currentParams.getAll('benefit');

    const selectedLoc = selectedLocationsStr ? selectedLocationsStr.split(',')[0] : 'all';
    const selProf = selectedProfession || 'SVE';

    const hasChanged = 
      debouncedSearchQuery !== currentQ ||
      selectedLoc !== currentLoc ||
      debouncedRadius !== currentRadius ||
      selProf !== currentProf ||
      selectedSector !== currentSector ||
      selectedEngagement !== currentEng ||
      selectedExperience !== currentExp ||
      debouncedSalaryMin !== currentMinS ||
      debouncedSalaryMax !== currentMaxS ||
      selectedBenefitsStr !== currentBenefits.sort().join(',');

    if (hasChanged) {
      handleApplyFilters();
    }
  }, [
    debouncedSearchQuery, 
    debouncedRadius, 
    selectedSector, 
    selectedProfession, 
    selectedLocationsStr, 
    selectedBenefitsStr, 
    selectedEngagement, 
    selectedExperience, 
    debouncedSalaryMin, 
    debouncedSalaryMax, 
    grad, 
    zanimanje, 
    handleApplyFilters, 
    searchParamsStr
  ]);

  const applyLocalFilters = useCallback((jobList: any[]) => {
    let result = jobList || [];
    if (salaryRange[0] > 0 || salaryRange[1] < 5000) {
      result = result.filter(j => {
        const minPlata = Number(j.plataMin) || 0;
        const maxPlata = Number(j.plataMax) || Number(j.plataMin) || 0;
        if (!minPlata) return false;
        return minPlata >= salaryRange[0] && maxPlata <= salaryRange[1];
      });
    }
    if (selectedBenefits.length > 0) {
      result = result.filter(j => {
        if (!j.benefits || j.benefits.length === 0) return false;
        return selectedBenefits.some(benefit => j.benefits.includes(benefit));
      });
    }
    return result;
  }, [salaryRange, selectedBenefits]);

  const filteredJobs = useMemo(() => {
    let result = applyLocalFilters(jobs);
    if (sortBy === 'salary-desc') {
      result = [...result].sort((a, b) => (Number(b.plataMax || b.plataMin || 0)) - (Number(a.plataMax || a.plataMin || 0)));
    } else if (sortBy === 'urgent') {
      result = [...result].sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0));
    }
    return result;
  }, [jobs, debouncedSearchQuery, salaryRange, selectedBenefits, sortBy]);
  const filteredPremiumJobs = useMemo(() => {
    const res = applyLocalFilters(premiumJobs).filter((j: any) => j.isPremium === true);
    console.log("JobsPage filteredPremiumJobs:", res.length, "raw premiumJobs:", premiumJobs.length, "all raw jobs:", jobs.length);
    return res;
  }, [premiumJobs, debouncedSearchQuery, salaryRange, selectedBenefits, jobs]);
  const filteredUrgentJobs = useMemo(() => applyLocalFilters(urgentJobs).filter((j: any) => j.isUrgent === true), [urgentJobs, debouncedSearchQuery, salaryRange, selectedBenefits]);

  // Reset page when filters change (Not needed anymore with server-side pagination)
  
  // Update filters if location state changes
  useEffect(() => {
    if (location.state?.filters) {
      const filters = location.state.filters;
      if (filters.sector) setSelectedSector(filters.sector);
      if (filters.profession) setSelectedProfession(filters.profession);
      if (filters.location) setSelectedLocations([filters.location]);
      if (filters.engagement) setSelectedEngagement(filters.engagement);
      if (filters.experience) setSelectedExperience(filters.experience);
    }
  }, [location.state]);

  /* 
     INITIAL LOAD REMOVED FOR OPTIMIZATION.
     User must now explicitly click 'Primeni filtere' or 'Osveži' to get data.
  */

  // Handlers
  const handleSectorChange = (slug: string | null) => {
    setSelectedSector(slug);
    setSelectedProfession(null); // Reset profession when sector changes
  };

  const toggleLocation = (slug: string) => {
    setSelectedLocations(prev => 
      prev.includes(slug) ? prev.filter(l => l !== slug) : [...prev, slug]
    );
  };

  const toggleBenefit = (slug: string) => {
    setSelectedBenefits(prev => 
      prev.includes(slug) ? prev.filter(b => b !== slug) : [...prev, slug]
    );
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const parsed = await parseSearchQuery(aiQuery);
      if (parsed) {
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
        
        if (parsed.location) {
          const locMatch = LOCATIONS.find(l => 
            l.name.toLowerCase().includes(parsed.location!.toLowerCase()) || 
            l.slug === parsed.location!.toLowerCase() ||
            (parsed.location!.toLowerCase() === 'bg' && l.slug === 'beograd') ||
            (parsed.location!.toLowerCase() === 'ns' && l.slug === 'novi-sad')
          );
          if (locMatch) setSelectedLocations([locMatch.slug]);
        }

        if (parsed.sector) {
          const sectorMatch = SECTORS.find(s => 
            s.name.toLowerCase().includes(parsed.sector!.toLowerCase()) || 
            s.slug === parsed.sector!.toLowerCase()
          );
          if (sectorMatch) setSelectedSector(sectorMatch.slug);
        }
        
        if (parsed.benefits && parsed.benefits.length > 0) {
          const matchedBenefits = parsed.benefits.map(b => {
             return BENEFITS.find(bf => bf.name.toLowerCase().includes(b.toLowerCase()) || bf.slug.replace('-', '').includes(b.toLowerCase()))?.slug;
          }).filter(Boolean) as string[];
          if (matchedBenefits.length > 0) setSelectedBenefits(matchedBenefits);
        }
        
        if (parsed.isUrgent) {
          setIsUrgentExpanded(true);
        }
        // Unified effect handles the URL updates naturally when states change
      }
    } finally {
      setIsAiSearching(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'SG';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const featuredCompanies = useMemo(() => {
    const covers = [
      "",
      "",
      "",
      ""
    ];

    // Build ad counts per company
    const companyMap: Record<string, any> = {};
    jobs.forEach(job => {
      if (job.status === 'active' && job.companyId) {
        if (!companyMap[job.companyId]) {
          companyMap[job.companyId] = {
            id: job.companyId,
            name: job.company || 'Kompanija',
            logo: job.companyLogo || null,
            ads: 0,
            website: null
          };
        }
        companyMap[job.companyId].ads += 1;
      }
    });

    const mapped = Object.values(companyMap).map((comp, idx) => ({
      ...comp,
      coverImage: covers[idx % covers.length]
    }));

    return mapped.sort((a, b) => (b.ads || 0) - (a.ads || 0)).slice(0, 8);
  }, [jobs]);

  const itemListSchema = useMemo(() => generateJobPostingListSchema(
    filteredJobs.slice(0, 20).map((job) => ({
      name: job.title,
      url: `${APP_CONFIG.BASE_URL}${buildJobUrl(job)}`,
      description: job.description,
      image: job.image
    })),
    {
      name: "Oglasi za Posao | Svet Građevine",
      description: "Najveća baza poslova u građevinskoj industriji.",
      url: `${APP_CONFIG.BASE_URL}/poslovi${selectedProfession ? `/${selectedProfession}` : ''}${grad ? `/${grad}` : ''}`,
    }
  ), [filteredJobs, selectedProfession, grad]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <DynamicSEO type="poslovi" grad={grad ?? undefined} zanimanje={zanimanje ?? undefined} jsonLd={[itemListSchema]} />

      <StandardPageHero
        badge="Oglasi za Posao"
        title="Poslovi"
        titleAccent="Građevina"
        subtitle="Najveća baza poslova u građevinskom sektoru. Pronađi stalni zaposlenje ili angažman na projektu za svoj tim."
        stats={[
          { label: "AKTIVNI OGLASI", value: jobStats?.total?.toLocaleString() || "1K+", icon: "work" },
          { label: "KOMPANIJE", value: companyCount?.toLocaleString() || "400", icon: "business" },
          { label: "NOVI DANAS", value: jobStats?.today?.toLocaleString() || "12", icon: "new_releases" }
        ]}
      >
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl w-full">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">search</span>
            <input
              type="text"
              placeholder="PRETRAŽI POSLOVE ILI KLJUČNE REČI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-3 md:px-6" 
            />
          </div>
          <Button 
            onClick={handleApplyFilters}
            variant="primary"
            className="w-full md:w-auto px-12 h-16 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none"
            icon="search"
          >
            PRETRAŽI
          </Button>
        </div>
      </StandardPageHero>

      {/* FACT-SHEET P-SEO DASHBOARD */}
      {((grad && grad !== 'all') || (zanimanje && zanimanje !== 'SVE')) && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8" aria-labelledby="pseo-insights-title">
          <AnalyticsDashboardUI 
            type="jobs" 
            zanimanjeSlug={!zanimanje || zanimanje === 'SVE' ? undefined : zanimanje} 
            gradSlug={!grad || grad === 'all' ? undefined : grad} 
          />
        </section>
      )}

      {/* Hitni Oglasi */}
      <JobsUrgent 
        jobs={filteredUrgentJobs}
        isExpanded={isUrgentExpanded}
        setIsExpanded={setIsUrgentExpanded}
        prefetch={prefetch}
        getInitials={getInitials}
        hasMore={false}
        loadMore={() => {}}
        loadingMore={false}
      />

      {/* PREMIUM POSLOVI SECTION */}
      <JobsPremium 
        jobs={filteredPremiumJobs}
        isExpanded={isPremiumExpanded}
        setIsExpanded={setIsPremiumExpanded}
        prefetch={prefetch}
        getInitials={getInitials}
        hasMore={false}
        loadMore={() => {}}
        loadingMore={false}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row-reverse gap-8">

          {/* Sidebar Filters */}
          <JobFilters 
            stats={{ 
              total: jobStats?.total || 0, 
              today: Number(jobStats?.today) || 12 
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedSector={selectedSector}
            handleSectorChange={handleSectorChange}
            selectedProfession={selectedProfession}
            setSelectedProfession={setSelectedProfession}
            selectedLocations={selectedLocations}
            filterRadius={filterRadius}
            setFilterRadius={setFilterRadius}
            toggleLocation={toggleLocation}
            setSelectedLocations={setSelectedLocations}
            selectedBenefits={selectedBenefits}
            toggleBenefit={toggleBenefit}
            setSelectedBenefits={setSelectedBenefits}
            salaryRange={salaryRange}
            setSalaryRange={setSalaryRange}
            handleApplyFilters={handleApplyFilters}
          />

          <div className="flex-1 flex flex-col">
            {/* Active Filter Chips */}
            <ActiveFilterChips 
              filters={filterChips} 
              onRemove={removeFilterChip} 
              onClearAll={clearAllFilters} 
            />

            {/* Top Bar: Job Count, Sorting, View Toggle */}
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-[8px] h-16 bg-secondary mt-1"></div>
                <div>
                  <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter italic">
                    Aktivna <br /> <span className="text-secondary">Ponuda</span>
                  </h3>
                  <p className="text-[10px] font-black mt-2 tracking-[0.3em] uppercase">
                    <span className="text-white/40">UKUPNO PRONAĐENO:</span> <span className="text-secondary">{totalJobsCount} OGLASA</span>
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

            {/* Sorting Bar */}
            <SortingBar 
              currentSort={sortBy}
              options={[
                { value: 'newest', label: 'NAJNOVIJE' },
                { value: 'salary-desc', label: 'NAJVEĆA PLATA' },
                { value: 'urgent', label: 'HITNI POSLOVI' }
              ]}
              onChange={(val) => setSortBy(val as any)}
            />

            {/* Jobs Listing */}
            <JobListings
              viewMode={viewMode}
              setViewMode={setViewMode}
              filteredJobs={filteredJobs}
              filteredPremiumJobs={filteredPremiumJobs}
              filteredUrgentJobs={filteredUrgentJobs}
              jobs={jobs}
              loadingJobs={loadingJobs}
              hasMore={hasMore}
              loadMore={loadMore}
              prefetch={prefetch}
              handleResetFilters={() => {
                setSearchQuery('');
                setSelectedSector(null);
                setSelectedProfession(null);
                setSelectedLocations([]);
                setSelectedBenefits([]);
                setSalaryRange([0, 5000]);
              }}
              isDeepPagingLimitReached={isDeepPagingLimitReached}
            />
          </div>
        </div>
      </main>

      {/* FEATURED COMPANIES LOGO CLOUD */}
      <JobsFeaturedCompanies 
        companies={featuredCompanies}
        getInitials={getInitials}
      />

      <CrossVerticalHub 
        gradSlug={!grad || grad === 'all' ? undefined : grad} 
        zanimanjeSlug={!zanimanje || zanimanje === 'SVE' ? undefined : zanimanje} 
        currentVertical="poslovi" 
      />

      <SeoContentBlock type="poslovi" grad={grad ?? undefined} zanimanje={zanimanje ?? undefined} itemCount={totalJobsCount} />
    </div>
  );
}

export default JobsPage;
