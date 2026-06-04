import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/src/modules/core';
import LoadingState from '@/src/components/LoadingState';
import { motion, AnimatePresence } from 'motion/react';
import { useSearch } from '@/src/modules/search/hooks/useSearch';
import NoResults from '@/src/components/ui/NoResults';
import { VirtuosoGrid } from 'react-virtuoso';
import { useFavoriteIds } from '@/src/modules/dashboard/hooks/useFavorites';
import { OptimizedImage } from '@/src/components/OptimizedImage';

import { useAuth } from '@/src/context/AuthContext';
import { Heart } from 'lucide-react';
import { SearchResult } from '@/src/modules/search/services/unifiedSearchService';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { user, toggleSavedAd, toggleSavedJob } = useAuth();
  const { data: favoriteIds } = useFavoriteIds(user?.id);
  
  const { data, isLoading: loading } = useSearch(query);
  const results = data?.results || [];
  const aiIntent = data?.aiIntent || null;

  const Item = ({ res }: { res: SearchResult }) => {
    // Check global favorites first if available
    const isSaved = (res.category === 'job' 
      ? favoriteIds?.jobs?.includes(res.id) 
      : favoriteIds?.ads?.includes(res.id)) || false;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 relative group/item"
      >
        <Link 
          to={`/${res.category}/${res.id}?ref=algolia`}
          className="block group bg-[#13212e] rounded-[10px] overflow-hidden border border-white/5 hover:border-[#ffad3a]/50 transition-all duration-500 h-full"
        >
          <div className="aspect-video relative overflow-hidden">
            {res.image || res.imageStatus === 'processing' ? (
              <OptimizedImage 
                src={res.image} 
                fallbackType="real_estate"
                alt={res.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                containerClassName="w-full h-full"
                isProcessing={res.imageStatus === 'processing'}
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/10 text-4xl">image</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                {res.category}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-bold text-white group-hover:text-[#ffad3a] transition-colors line-clamp-1 mb-2">
              {res.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/40 text-xs text-nowrap overflow-hidden">
                <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                <span className="truncate">{res.location || 'Srbija'}</span>
              </div>
              {res.price && (
                <div className="text-[#ffad3a] font-black shrink-0 ml-2">
                  {typeof res.price === 'number' ? `${res.price.toLocaleString()}€` : res.price}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Quick Favorite Button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
               // Must be handled usually via navigation, but for now
               alert("Morate biti prijavljeni da biste sačuvali.");
               return;
            }
            if (res.category === 'job') {
              if (toggleSavedJob) await toggleSavedJob(res.id);
            } else {
              if (toggleSavedAd) await toggleSavedAd(res.id, res.category);
            }
          }}
          className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 z-20 ${
            isSaved 
              ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' 
              : 'bg-black/50 text-white/40 border-white/10 hover:text-white hover:border-white/30 opacity-0 group-hover/item:opacity-100'
          }`}
        >
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col h-[calc(100vh-100px)]">
        <div className="mb-12 shrink-0">
          <h1 className="text-4xl font-black text-white mb-4">Rezultati pretrage</h1>
          <p className="text-white/60">
            Prikazujemo rezultate za: <span className="text-[#ffad3a] font-bold">"{query}"</span>
          </p>
          
          {aiIntent && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-white/5 rounded-[10px] border border-white/10 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-[#ffad3a]/20 rounded-full flex items-center justify-center text-[#ffad3a]">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <p className="text-sm text-white/80">
                  AI je prepoznao: 
                  <span className="ml-2 px-2 py-1 bg-white/10 rounded-[10px] text-xs uppercase font-bold text-[#ffad3a]">
                    {aiIntent.category || 'Globalna pretraga'}
                  </span>
                  {aiIntent.locationSlug && (
                    <span className="ml-2 px-2 py-1 bg-white/10 rounded-[10px] text-xs uppercase font-bold text-emerald-400">
                      Lokacija: {aiIntent.locationSlug}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 overflow-hidden">
             <LoadingState count={6} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
             {results.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 overflow-auto h-full">
                 {results.map((res: SearchResult, index: number) => (
                   <Item key={res.id || index} res={res} />
                 ))}
               </div>
            ) : (
              <NoResults />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
