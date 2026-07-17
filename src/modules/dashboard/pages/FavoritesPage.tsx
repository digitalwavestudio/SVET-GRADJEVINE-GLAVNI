import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { buildJobUrl } from '@/src/lib/seo';
import { useFavoritesList, favoritesKeys } from '@/src/modules/dashboard/hooks/useFavorites';
import { apiClient } from '@/src/lib/apiClient';


export default function FavoritesPage() {
  const { user } = useAuth();
  
  const { data: ads = [], isLoading: loading } = useFavoritesList(user?.id);

  const queryClient = useQueryClient();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(ctrl => ctrl.abort());
    };
  }, []);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      if (!navigator.onLine) {
        throw new Error("Cannot toggle favorite while offline");
      }
      if (abortControllersRef.current.has(id)) {
        abortControllersRef.current.get(id)?.abort();
      }
      const controller = new AbortController();
      abortControllersRef.current.set(id, controller);

      try {
        await apiClient.post(
          '/favorites/toggle',
          { adId: id, adType: type },
          { signal: controller.signal }
        );
      } finally {
        if (abortControllersRef.current.get(id) === controller) {
          abortControllersRef.current.delete(id);
        }
      }
    },
    onMutate: async ({ id, type }) => {
      const queryKey = favoritesKeys.user(user?.id || 'guest');
      
      // Cancel active queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot old list
      const previousFavorites = queryClient.getQueryData<unknown[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<unknown[]>(queryKey, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((ad: unknown) => {
          const a = ad as Record<string, unknown>;
          return a.id !== id && a.adId !== id;
        });
      });

      return { previousFavorites, queryKey };
    },
    onError: (err: unknown, variables, context) => {
      if (!navigator.onLine) {
        return;
      }
      
      let isAbort = false;
      if (err instanceof Error) {
         if (err.name === 'AbortError' || err.message.includes('abort')) {
             isAbort = true;
         }
      } else if (err && typeof err === 'object') {
         const errObj = err as Record<string, unknown>;
         if (errObj.name === 'AbortError' || (typeof errObj.message === 'string' && errObj.message.includes('abort'))) {
             isAbort = true;
         }
      }

      if (isAbort) {
        console.info(`[FAVORITES] Saved ad toggle aborted for ${variables.id}`);
        return;
      }
      if (context?.previousFavorites && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousFavorites);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Complete optimistic loop without heavy refetches unless dynamic syncing needed
    }
  });

  const clearAllFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!navigator.onLine) {
        throw new Error("Cannot clear favorites while offline");
      }
      await apiClient.post('/favorites/clear-all');
    },
    onMutate: async () => {
      const queryKey = favoritesKeys.user(user?.id || 'guest');
      
      // Cancel active queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot old list
      const previousFavorites = queryClient.getQueryData<unknown[]>(queryKey);

      // Optimistic update: empty the list of favorites
      queryClient.setQueryData<unknown[]>(queryKey, []);

      return { previousFavorites, queryKey };
    },
    onError: (err, variables, context) => {
      if (!navigator.onLine) {
        return;
      }
      console.error('[Favorites] Batch clearing failed, rolling back cache.', err);
      if (context?.previousFavorites && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousFavorites);
      }
    },
    onSettled: () => {
      const queryKey = favoritesKeys.user(user?.id || 'guest');
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setBy] = useState('newest');

  const filteredAndSortedAds = useMemo(() => {
    if (!Array.isArray(ads)) return [];
    // Filter out deleted, null, or incomplete mock/placeholder ads that have no real data
    let result = ads.filter(ad => ad && ad.id && (ad.title || ad.name || ad.brand));

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ad => 
        (ad.title || ad.name || ad.brand || '').toLowerCase().includes(q) ||
        (ad.company || ad.city || ad.location || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterType !== 'all') {
      result = result.filter(ad => {
        if (filterType === 'real_estate') {
          return ad._type === 'real_estate' || ad._type === 'plot';
        }
        return ad._type === filterType;
      });
    }

    // Sort logic
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => {
        const titleA = (a.title || a.name || a.brand || '').toLowerCase();
        const titleB = (b.title || b.name || b.brand || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
    }

    return result;
  }, [ads, searchQuery, filterType, sortBy]);

  const handleClearAll = async () => {
    try {
      await clearAllFavoritesMutation.mutateAsync();
      setConfirmClearOpen(false);
    } catch (err) {
      console.error('[Favorites] Error invoking batch empty:', err);
    }
  };

  const promptRemove = (id: string, type: string) => {
    toggleFavoriteMutation.mutate({ id, type });
  };

  const getAdLink = (val: unknown) => {
    const ad = val as Record<string, unknown>;
    if (ad._type === 'job') return buildJobUrl(ad as { title?: string; location?: string; loc?: string; company?: string; comp?: string; id?: string | number });
    if (ad._type === 'machine') return `/masine/${ad.id}`;
    if (ad._type === 'real_estate' || ad._type === 'plot') return `/placevi/${ad.id}`;
    if (ad._type === 'accommodation') return `/smestaj/${ad.id}`;
    if (ad._type === 'catering') return `/ketering/${ad.id}`;
    return '#';
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 text-center md:text-left">OMILJENI OGLASI</h1>
            <div className="flex items-center gap-2 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase justify-center md:justify-start">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              VAŠA LISTA ZANIMLJIVOSTI
            </div>
          </motion.div>

          <button 
            onClick={() => setConfirmClearOpen(true)}
            className="bg-white/5 border border-white/10 text-white font-black px-6 py-3 rounded-[10px] hover:bg-white/10 transition-all text-[10px] tracking-widest uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
            OBRIŠI SVE
          </button>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full scale-100 focus-within:scale-[1.01] transition-transform">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 select-none">search</span>
            <input 
              type="text"
              placeholder="PRETRAŽI OMILJENO (NASLOV, KOMPANIJA, LOKACIJA...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs font-bold tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-secondary/30 transition-all uppercase"
            />
          </div>

          <div className="hidden md:flex flex-wrap items-center gap-2 w-full xl:w-auto">
            {[
              { id: 'all', label: 'SVI', icon: 'apps' },
              { id: 'job', label: 'POSLOVI', icon: 'work' },
              { id: 'machine', label: 'MAŠINE', icon: 'precision_manufacturing' },
              { id: 'real_estate', label: 'NEKRETNINE', icon: 'landscape' },
              { id: 'accommodation', label: 'SMEŠTAJ', icon: 'hotel' },
              { id: 'catering', label: 'KETERING', icon: 'restaurant' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  filterType === cat.id 
                    ? 'bg-secondary !text-black shadow-lg shadow-secondary/10 px-6' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${filterType === cat.id ? 'font-black' : 'opacity-40'}`}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            ))}
            <div className="h-10 w-[1px] bg-white/5 mx-2 hidden xl:block" />
            <select 
              value={sortBy}
              onChange={(e) => setBy(e.target.value)}
              className="bg-white/5 border border-white/5 text-white/60 text-[10px] font-black tracking-widest uppercase px-4 py-3 rounded-xl focus:outline-none cursor-pointer hover:bg-white/10 hover:text-white transition-all h-full"
            >
              <option value="newest" className="bg-[#0A0F14]">NAJNOVIJE</option>
              <option value="alphabetical" className="bg-[#0A0F14]">A-Z REDOSLED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center"><span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedAds.map((val: unknown, i: number) => {
              const ad = val as Record<string, unknown>;
              return (
              <motion.div 
                key={`${ad._type}-${ad.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6">
                  <button 
                    onClick={() => promptRemove(String(ad.id || ''), String(ad._type || ''))}
                    className="text-secondary hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                  </button>
                </div>

                <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                  <span className="material-symbols-outlined text-white/20 group-hover:text-secondary transition-colors">
                    {ad._type === 'job' ? 'work' : ad._type === 'machine' ? 'precision_manufacturing' : ad._type === 'plot' || ad._type === 'real_estate' ? 'landscape' : 'hotel'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-secondary transition-colors line-clamp-2 min-h-[56px]">
                  {String(ad.title || ad.name || ad.brand || 'Oglas')}
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8">
                  {String((ad.authorSnapshot as Record<string, unknown>)?.companyName || (ad.authorSnapshot as Record<string, unknown>)?.displayName || ad.company || ad.city || ad.location || 'Svet Građevine')}
                </p>

                <div className="flex gap-3">
                  <Link 
                    to={getAdLink(ad)}
                    className="flex-1 py-4 bg-secondary !text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-[10px] hover:bg-yellow-400 transition-all text-center"
                  >
                    POGLEDAJ
                  </Link>
                  <button 
                    onClick={() => promptRemove(String(ad.id || ''), String(ad._type || ''))}
                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center hover:bg-error/10 hover:text-error transition-all">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </motion.div>
            )})}
          </div>
        )}

        {!loading && filteredAndSortedAds.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <span className="material-symbols-outlined text-6xl mb-4">
              {searchQuery || filterType !== 'all' ? 'search_off' : 'bookmark_border'}
            </span>
            <p className="text-sm font-black uppercase tracking-widest">
              {searchQuery || filterType !== 'all' ? 'NEMA REZULTATA ZA ODABRANE FILTRE' : 'NEMATE OMILJENIH OGLASA'}
            </p>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmClearOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmClearOpen(false)}
              className="absolute inset-0 bg-[#05070a]/80 backdrop-blur-md"
            />
            {/* Content box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#0d121a] border border-white/10 rounded-[12px] p-6 shadow-2xl z-10 overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />

              <div className="flex items-start gap-4 mt-2">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-[10px] flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">
                    warning
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-bold text-white uppercase tracking-wider mb-2 font-headline">
                    UKLANJANJE OMILJENIH
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    Da li ste sigurni da želite da uklonite sve oglase sa vaše liste omiljenih? Ova akcija se ne može vratiti.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-5 py-3 rounded-[8px] bg-white/5 border border-white/5 text-[10px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                >
                  ODUSTANI
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-5 py-3 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/10"
                >
                  OBRIŠI SVE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

