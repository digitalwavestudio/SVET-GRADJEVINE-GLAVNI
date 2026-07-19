import { OptimizedImage } from '@/src/components/OptimizedImage';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LOCATIONS } from '@/src/constants/taxonomy';

interface CompanyAdsTabsContentProps {
  activeJobs: any[];
  isLoading: boolean;
}

export function CompanyAdsTabsContent({
  activeJobs,
  isLoading
}: CompanyAdsTabsContentProps) {

  const allAds = useMemo(() => {
    const mapped: any[] = [];
    activeJobs.forEach(j => mapped.push({ ...j, _type: 'job', _link: `/posao/${j.id}` }));
    return mapped;
  }, [activeJobs]);

  const itemsPerPage = 10;
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const displayed = allAds.slice(0, visibleCount);
  const hasMore = allAds.length > visibleCount;

  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      job: 'Posao',
    };
    return map[t] || t;
  };

  const typeColor = (t: string) => {
    const map: Record<string, string> = {
      job: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return map[t] || 'bg-white/10 text-white/60 border-white/10';
  };

  if (allAds.length === 0 && !isLoading) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-600 font-headline">Svi oglasi ovog poslodavca</h2>
        <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
      </div>
      {isLoading ? (
        <div className="text-center py-12"><span className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block"></span></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayed.map(ad => (
              <Link
                key={`${ad._type}-${ad.id}`}
                to={ad._link}
                className="group block bg-[#132123] rounded-[10px] overflow-hidden border border-white/5 hover:border-secondary/30 transition-all shadow-2xl"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <OptimizedImage
                    src={ad.images?.[0] || ad.image}
                    fallbackType="default"
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    containerClassName="w-full h-full"
                  />
                  <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${typeColor(ad._type)} backdrop-blur-sm`}>
                    {typeLabel(ad._type)}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-bold text-white group-hover:text-secondary transition-colors line-clamp-2 leading-tight mb-2">{ad.title}</h4>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">
                    {LOCATIONS.find((l: any) => l.slug === ad.locationSlug)?.name || ad.location || ad.loc || ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + itemsPerPage)}
                className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest px-8 py-4 rounded-[10px] text-[10px] transition-all border border-white/10"
              >
                Učitaj još
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
