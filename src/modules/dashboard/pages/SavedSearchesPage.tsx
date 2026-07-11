import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useSavedSearches, SavedSearch } from '../hooks/useSavedSearches';
import { apiClient } from '@/src/lib/apiClient';

export default function SavedSearchesPage() {
  const { user } = useAuth();
  const { data: savedSearches = [], isLoading, removeSearch } = useSavedSearches(user?.id);
  const [activeSearch, setActiveSearch] = useState<SavedSearch | null>(null);
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleRunSearch = async (search: SavedSearch) => {
    setActiveSearch(search);
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Direct search fetch without route reload
      // Manually constructing query string for apiClient
      let url = '/ads/search';
      if (search.filterParams) {
        const params = new URLSearchParams();
        Object.entries(search.filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
      }
      
      const response = await apiClient.get<Record<string, unknown>[]>(url);
      setSearchResults(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Direct search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">MOJE PRETRAGE</h1>
            <div className="flex items-center gap-2 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              OBAVEŠTENJA I SAČUVANI FILTERI
            </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[10px]" />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {savedSearches.map((search, i) => (
                <motion.div 
                  key={search.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, x: -50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative group overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 p-6 z-10">
                    <button 
                      onClick={() => removeSearch(search.id)}
                      className="w-10 h-10 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                    <span className="material-symbols-outlined text-white/20 group-hover:text-secondary transition-colors">manage_search</span>
                  </div>

                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-secondary transition-colors">
                    {search.name}
                  </h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8">
                    {new Date(search.createdAt).toLocaleDateString('sr-RS')}
                  </p>

                  <div className="flex gap-3 mt-auto">
                    <button 
                      onClick={() => handleRunSearch(search)}
                      className="flex-1 py-4 bg-secondary !text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-[10px] hover:bg-yellow-400 transition-all text-center"
                    >
                      INSTANT PREGLED
                    </button>
                    <div className="w-12 h-12 bg-white/5 border border-secondary/30 rounded-[10px] flex items-center justify-center text-secondary transition-colors" title="Obaveštenja su aktivna">
                      <span className="material-symbols-outlined text-lg">notifications_active</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {savedSearches.length === 0 && !isLoading && (
          <div className="py-20 text-center opacity-20">
            <span className="material-symbols-outlined text-6xl mb-4">notifications_off</span>
            <p className="text-sm font-black uppercase tracking-widest">NEMATE SAČUVANIH PRETRAGA</p>
          </div>
        )}
      </div>

      {/* Direct Search Results Preview Overlay */}
      <AnimatePresence>
        {activeSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0A0F14] border border-white/10 w-full max-w-5xl rounded-[20px] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                   <h2 className="text-2xl font-black text-white uppercase italic">{activeSearch.name}</h2>
                   <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">REZULTATI PRETRAGE U REALNOM VREMENU</p>
                </div>
                <button 
                  onClick={() => setActiveSearch(null)}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                   <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-black/20">
                 {isSearching ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">SINHRONIZACIJA SA BAZOM...</p>
                   </div>
                 ) : searchResults.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {searchResults.map((ad, idx) => (
                        <motion.div 
                          key={String(ad.id ?? idx)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white/5 p-4 rounded-[12px] border border-white/5 flex gap-4 hover:border-secondary/20 transition-all group"
                        >
                           <div className="w-24 h-24 bg-white/5 rounded-[8px] overflow-hidden shrink-0">
                              {ad.imageUrl && typeof ad.imageUrl === 'string' ? (
                                <img src={ad.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10">
                                   <span className="material-symbols-outlined">image</span>
                                </div>
                              )}
                           </div>
                           <div className="flex flex-col justify-center">
                              <h4 className="text-sm font-black text-white uppercase mb-1 line-clamp-1">{String(ad.title || '') || String(ad.name || '')}</h4>
                              <p className="text-xs text-white/40 mb-2">{String(ad.location || '')}</p>
                              <div className="text-secondary font-black text-xs italic">{ad.price ? `${ad.price} €` : 'PO DOGOVORU'}</div>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                 ) : (
                   <div className="py-20 text-center text-white/10 uppercase font-black tracking-widest text-sm italic">
                      Trenutno nema novih rezultata za ove kriterijume pretrage
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-center">
                 <button 
                   onClick={() => window.location.href = activeSearch.path}
                   className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-white/10"
                 >
                    DETALJNA PRETRAGA NA GLAVNOJ STRANICI
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

