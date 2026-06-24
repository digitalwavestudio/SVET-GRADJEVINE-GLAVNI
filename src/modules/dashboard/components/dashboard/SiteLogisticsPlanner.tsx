import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Building2, Utensils, Phone, Mail, Navigation, Briefcase } from 'lucide-react';
import { apiClient } from '@/src/lib/apiClient';

interface SiteLogisticsPlannerProps {
  recentAds?: any[];
}

export function SiteLogisticsPlanner({ recentAds = [] }: SiteLogisticsPlannerProps) {
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [caterings, setCaterings] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setIsSearching(true);
    setHasResults(false);
    
    try {
      // Call search api for accommodations and caterings with 10km radius
      const [accRes, catRes]: [any, any] = await Promise.all([
        apiClient.post('/ads/search', { category: 'accommodations', filters: { location: address, radius: 10 }, pageSize: 5 }),
        apiClient.post('/ads/search', { category: 'caterings', filters: { location: address, radius: 10 }, pageSize: 5 })
      ]);
      
      setAccommodations((accRes.data?.docs || []).map((ad: any) => ({
        id: ad.id,
        name: ad.title || 'Smeštaj',
        distance: ad.distance || 0, // Real distance from Algolia
        capacity: ad.capacity || 10,
        price: ad.price || 'Po dogovoru',
        currency: ad.currency || 'EUR',
        contact: ad.phone || 'Vidite Oglas',
        available: true
      })));
 
      setCaterings((catRes.data?.docs || []).map((ad: any) => ({
        id: ad.id,
        name: ad.title || 'Ketering',
        distance: ad.distance || 0, // Real distance from Algolia
        pricePerMeal: ad.price || 'Po dogovoru',
        currency: ad.currency || 'EUR',
        minOrder: ad.minOrder || 10,
        contact: ad.phone || 'Vidite Oglas'
      })));

    } catch (error) {
      console.error("Failed to fetch logistics planning", error);
    } finally {
      setIsSearching(false);
      setHasResults(true);
    }
  };

  const handleSelectAd = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setAddress(val);
    }
  }

  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden group">
      <div className="p-8 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">explore</span>
              Logistički Planer Gradilišta
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2 font-bold max-w-xl leading-relaxed">
              Povežite vaše novo gradilište sa najbližim dostupnim smeštajima za radnike i ketering uslugama u radijusu od 10km.
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex flex-col gap-3 w-full md:w-auto">
            {recentAds.length > 0 && (
              <div className="relative w-full sm:w-[350px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Briefcase className="text-white/20" size={14} />
                </div>
                <select
                  onChange={handleSelectAd}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-[8px] py-3 pl-10 pr-8 text-[11px] font-bold text-white uppercase tracking-wider focus:border-secondary transition-all outline-none cursor-pointer appearance-none"
                >
                  <option value="" className="bg-slate-900 text-white/50">Izaberite adresu sa postojećeg oglasa...</option>
                  {recentAds.filter(ad => ad.location || ad.city).slice(0,5).map(ad => (
                    <option key={ad.id} value={ad.location || ad.city} className="bg-slate-900 text-white">
                      {ad.title} ({ad.location || ad.city})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-white/20 text-sm">expand_more</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="relative w-full sm:w-[250px] md:w-[220px] lg:w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="text-white/20" size={14} />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ili unesite ručno... (npr. Beograd)"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-[11px] font-bold text-white uppercase tracking-wider focus:border-secondary transition-all outline-none placeholder:text-white/20"
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching || !address.trim()}
                className="w-full sm:w-auto px-6 py-4 bg-secondary !text-black font-black text-[10px] uppercase tracking-widest rounded-[8px] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(254,191,13,0.15)] flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ANALIZA...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    SKENIRAJ OBLAST
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="p-8">
        {!hasResults && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-24 h-24 mb-6 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/[0.01] relative">
              <div className="absolute inset-2 border border-white/5 rounded-full animate-spin-slow"></div>
              <MapPin size={32} className="text-white/20" />
            </div>
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/30 text-center">
              Unesite lokaciju gradilišta za prostornu analizu<br/>infrastrukture
            </p>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border border-secondary/20 rounded-full animate-ping opacity-75 duration-1000"></div>
              <div className="absolute inset-4 border border-secondary/30 rounded-full animate-ping opacity-50 duration-1000 delay-300"></div>
              <div className="absolute inset-8 border border-secondary/40 rounded-full animate-ping opacity-25 duration-1000 delay-500"></div>
              <CompassIcon className="text-secondary animate-pulse" size={40} />
            </div>
            <h4 className="text-white text-sm font-black uppercase tracking-widest mb-2">Skeniranje Okoline</h4>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Traženje optimalnih ruta i B2B partnera u radijusu od 10km...</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column - Stylized Map HUD */}
              <div className="lg:col-span-5 relative min-h-[400px] bg-[#050A0F] rounded-[10px] border border-white/5 overflow-hidden flex items-center justify-center p-8">
                {/* Map Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                
                {/* Radar Sweeper */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] border border-secondary/30 rounded-full bg-secondary/[0.02]"></div>
                  
                  {/* Origin Pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <div className="w-4 h-4 bg-secondary rounded-full shadow-[0_0_15px_rgba(254,191,13,0.8)] border-[3px] border-[#0A0F14]"></div>
                    <span className="absolute top-5 text-[8px] font-black text-secondary uppercase tracking-widest whitespace-nowrap bg-[#0A0F14]/80 px-2 py-1 rounded backdrop-blur">Vaše Gradilište</span>
                  </div>

                  {/* Render Mock Nodes on Map */}
                  <div className="absolute top-[30%] left-[65%] w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-2 border-[#0A0F14]"></div>
                  <div className="absolute top-[60%] left-[25%] w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-2 border-[#0A0F14]"></div>
                  <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] border-2 border-[#0A0F14]"></div>
                  <div className="absolute top-[70%] left-[60%] w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] border-2 border-[#0A0F14]"></div>
                </div>

                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                  <div className="flex items-center gap-2 bg-[#0A0F14]/90 border border-white/10 px-3 py-1.5 rounded-[6px] backdrop-blur text-[8px] font-bold text-white/60 tracking-widest uppercase">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Smeštajni Kapaciteti
                  </div>
                  <div className="flex items-center gap-2 bg-[#0A0F14]/90 border border-white/10 px-3 py-1.5 rounded-[6px] backdrop-blur text-[8px] font-bold text-white/60 tracking-widest uppercase">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Ketering Rute
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between z-20">
                  <div className="bg-[#0A0F14]/90 border border-white/10 px-3 py-2 rounded-[6px] backdrop-blur">
                    <span className="block text-[7px] text-white/40 font-bold uppercase tracking-widest mb-1">Pretraga za adresu:</span>
                    <span className="block text-[10px] text-white font-black uppercase tracking-tight">{address}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-full w-px bg-white/10 mx-2"></div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Radijus</span>
                      <span className="text-secondary text-[10px] font-black tracking-widest">10 KM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Data Panels */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Accommodations */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                    <Building2 size={14} />
                    Najbliži Smeštajni Kapaciteti
                  </h4>
                  <div className="flex flex-col gap-3">
                    {accommodations.length === 0 ? (
                      <div className="text-white/40 text-xs py-4 px-2 border border-white/5 rounded">Nema dostupnih smeštanih kapaciteta blizu željene lokacije.</div>
                    ) : accommodations.map((acc, i) => (
                      <div key={acc.id} className="bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-colors p-4 rounded-[8px] flex items-center justify-between group/card">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-500/10 text-blue-400 w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black">{i + 1}</span>
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-white uppercase tracking-tight group-hover/card:text-blue-400 transition-colors">{acc.name}</h5>
                            <div className="flex items-center gap-3 mt-1.5 opacity-60">
                              <span className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                                <Navigation size={10} />
                                {acc.distance} km
                              </span>
                              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                              <span className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">group</span>
                                Max {acc.capacity} radnika
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-white">{acc.price}</span>
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{acc.currency} / Dan</span>
                          </div>
                          <button className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-[4px] transition-colors border border-blue-500/20">
                            KONTAKTIRAJ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Catering */}
                <div className="space-y-4 mt-2">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                    <Utensils size={14} />
                    Ketering sa Najbržom Dostavom
                  </h4>
                  <div className="flex flex-col gap-3">
                    {caterings.length === 0 ? (
                      <div className="text-white/40 text-xs py-4 px-2 border border-white/5 rounded">Nema dostupnog keteringa blizu željene lokacije.</div>
                    ) : caterings.map((cat, i) => (
                      <div key={cat.id} className="bg-white/[0.02] border border-white/5 hover:border-orange-500/30 transition-colors p-4 rounded-[8px] flex items-center justify-between group/card">
                        <div className="flex items-start gap-4">
                          <div className="bg-orange-500/10 text-orange-400 w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black">{i + 1}</span>
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-white uppercase tracking-tight group-hover/card:text-orange-400 transition-colors">{cat.name}</h5>
                            <div className="flex items-center gap-3 mt-1.5 opacity-60">
                              <span className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                                <Navigation size={10} />
                                {cat.distance} km
                              </span>
                              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                              <span className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                                Min {cat.minOrder} obroka
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-white">{cat.pricePerMeal}</span>
                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{cat.currency} / Obrok</span>
                          </div>
                          <button className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[8px] font-black uppercase tracking-widest rounded-[4px] transition-colors border border-orange-500/20">
                            KONTAKTIRAJ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
