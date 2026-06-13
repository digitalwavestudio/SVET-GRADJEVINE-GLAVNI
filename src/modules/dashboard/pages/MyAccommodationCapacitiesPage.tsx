import React, { useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { motion } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { useMyAds, useMyAdsMutations } from '@/src/modules/dashboard/hooks/useMyAds';
import { useDebounce } from '@/src/hooks/useDebounce';
import EmptyState from '@/src/components/ui/EmptyState';
import { Hotel, Megaphone, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAccommodationLink } from '@/src/lib/routeFilters';
import { OptimizedImage } from '@/src/components/OptimizedImage';

export default function MyAccommodationCapacitiesPage() {
  const { user } = useAuth();
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);
  const { data: ads = [], isLoading } = useMyAds(user?.id, debouncedQuery);
  const { deleteAd } = useMyAdsMutations(user?.id);

  // Filter to show only accommodations
  const accommodations = ads.filter(ad => ad.postType === 'accommodation' || ad.postType === 'smestaj' || ad.collection === 'accommodations');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter">SMEŠTAJNI KAPACITETI</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
            Ažurirajte status slobodnih kreveta i soba u vašim objektima. Ovi podaci se koriste za direktnu pretragu i slanje upita firmi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative text-white/40 w-full max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg">search</span>
            <input 
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              type="text" 
              placeholder="PRETRAŽI OBJEKTE..." 
              className="bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-[10px] font-black tracking-widest uppercase focus:border-secondary transition-all outline-none text-white w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : accommodations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {accommodations.map((ad) => {
              const detailUrl = getAccommodationLink(ad.id);
              return (
                <div key={ad.id} className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-16 h-16 bg-white/5 rounded-[10px] overflow-hidden shrink-0 border border-white/5 relative">
                      {(ad.images as string[])?.[0] ? (
                        <OptimizedImage 
                          src={(ad.images as string[])[0]} 
                          fallbackType="accommodation" 
                          alt="Slika objekta" 
                          className="w-full h-full object-cover" 
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-white/10 m-auto h-full flex items-center justify-center">image</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{ad.title as string}</h3>
                      <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-secondary">{ad.location as string || 'Nepoznata lokacija'}</span>
                        <span>•</span>
                        <span>Broj soba: {ad.roomsCount as string || 'Nije uneto'}</span>
                        <span>•</span>
                        <span>Kapacitet kreveta: {ad.bedsCount as string || 'Nije uneto'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Link to={detailUrl} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">open_in_new</span> Vidi oglas
                    </Link>
                    <Link to={`/postavi-oglas?edit=true&id=${ad.id}&type=smestaj`} className="px-6 py-3 bg-secondary text-slate-950 rounded-[10px] text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">edit</span> Uredi
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={Hotel}
            title="Nemate kreiranih objekata"
            description="Da biste mogli da ažurirate kapacitete, prvo morate da postavite oglas za vaš smeštaj."
            actionLabel="KREIRAJ OGLAS"
            actionLink="/postavi-oglas"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
