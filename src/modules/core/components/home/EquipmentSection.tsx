import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';

export default function EquipmentSection({ latestMachines = [], latestRealEstate = [] }: any) {
  const navigate = useNavigate();
  return (<>
    {/* Oprema i Mašine */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#38bdf8] font-black tracking-[0.2em] uppercase text-sm block">Teška Mehanizacija</span>
                <span className="material-symbols-outlined text-[#38bdf8] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>precision_manufacturing</span>
              </div>
              <h2 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#38bdf8_0%,#ffffff_60%)] mb-4">GRAĐEVINSKE MAŠINE</h2>
              <p className="text-on-surface-variant text-lg max-w-xl">Pronađite bagere, kranove, utovarivače i ostalu opremu za vaš sledeći projekat.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
            <Link className="text-secondary font-bold flex items-center gap-2 pt-2 hover:scale-110 transition-transform duration-300 origin-right shrink-0" to="/gradjevinske-masine">
              Pogledaj sve <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              {latestMachines.length > 0 ? latestMachines.map((machine: any, idx: number) => (
                <div key={machine.id || idx} className="bg-surface-container-lowest rounded-[10px] overflow-hidden border border-outline-variant/10 group">
                  <div className="h-48 overflow-hidden relative">
                    <OptimizedImage src={machine.images?.[0] || ""} fallbackType="machine" alt={machine.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                    <div className="absolute top-4 right-4 bg-surface-container-highest/80 backdrop-blur px-3 py-1 rounded-[10px] text-secondary font-bold uppercase">
                      {machine.listingType === 'sale' ? 'Prodaja' : 'Iznajmljivanje'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 uppercase line-clamp-1">{machine.title}</h3>
                    <div className="flex items-center gap-4 text-on-surface-variant text-sm mb-4">
                      {machine.yearOfManufacture && (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {machine.yearOfManufacture}. god</span>
                      )}
                      {machine.workingHours !== undefined && (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">history</span> {machine.workingHours}h</span>
                      )}
                      {machine.location && !machine.workingHours && (
                         <span className="flex items-center gap-1 line-clamp-1"><span className="material-symbols-outlined text-[16px]">location_on</span> {typeof machine.location === 'object' ? machine.location.address : machine.location}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-secondary">
                        {machine.price ? `€${machine.price.toLocaleString()}` : 'Po upitu'}
                      </span>
                      <button 
                        onClick={() => navigate(`/gradjevinske-masine/${machine.id}`)}
                        aria-label={`Pogledaj detalje ${machine.title}`}
                        className="p-2 rounded-[10px] border border-outline-variant/20 hover:bg-secondary hover:border-secondary transition-all duration-300 group/btn shadow-lg hover:shadow-secondary/20"
                      >
                        <span className="material-symbols-outlined group-hover/btn:text-on-secondary transition-colors text-white">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="md:col-span-2 bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                  <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>precision_manufacturing</span>
                  <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema objavljenih mašina</h3>
                  <p className="text-on-surface-variant text-base">Oglasa za građevinske mašine trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
                </div>
              )}
            </div>
            {/* Category Sidebar */}
            <div className="bg-[#0A0F14] p-10 rounded-[10px] border border-white/5 flex flex-col relative shadow-2xl overflow-hidden group/sidebar">
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[60px] pointer-events-none group-hover/sidebar:bg-secondary/10 transition-colors duration-500"></div>
               <div className="absolute top-0 left-0 w-[2px] bg-secondary h-0 group-hover/sidebar:h-full transition-all duration-700"></div>

              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-5">
                Istaknute Kategorije
              </h3>
              <ul className="space-y-3 flex-1">
                {[
                  { name: 'Bageri i utovarivači', cat: 'excavators' },
                  { name: 'Dizalice i kranovi', cat: 'cranes' },
                  { name: 'Kamioni i transport', cat: 'trucks' }
                ].map((cat, i) => (
                  <li 
                    key={i}
                    className="flex justify-between items-center p-5 rounded-[12px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:translate-x-1 transition-all duration-300 cursor-pointer group/item" 
                    onClick={() => navigate(`/gradjevinske-masine?category=${cat.cat}`)}
                  >
                    <span className="group-hover/item:text-secondary transition-colors uppercase font-black text-sm tracking-widest text-[#B4B9BE]">
                      {cat.name}
                    </span>
                    <span className="material-symbols-outlined text-lg text-white/10 group-hover/item:text-secondary group-hover/item:translate-x-1 transition-all duration-300">
                      arrow_forward
                    </span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/gradjevinske-masine"
                className="w-full mt-10 py-5 flex items-center justify-center uppercase font-black text-xs tracking-[0.2em] bg-white/5 hover:bg-secondary hover:text-slate-950 transition-all duration-500 rounded-[12px] border border-white/10 hover:border-secondary shadow-lg hover:shadow-secondary/20"
              >
                Sve građevinske mašine
              </Link>
            </div>
          </div>
          
          <Link 
            to="/postavi-oglas"
            className={UI_TOKENS.BTN_PRIMARY + " w-full mt-8 py-6 flex items-center justify-center text-lg rounded-[10px]"}
          >
            POSTAVI OGLAS ZA MAŠINE
          </Link>
        </div>
      </section>

      {/* Placevi Section */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#22c55e] font-black tracking-[0.2em] uppercase text-sm block">Nepokretnosti</span>
                <span className="material-symbols-outlined text-[#22c55e] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>terrain</span>
              </div>
              <h2 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#22c55e_0%,#ffffff_60%)] mb-4">PLACEVI I LOKACIJE</h2>
              <p className="text-on-surface-variant text-lg max-w-xl">Investicione prilike širom regiona. Pronađite idealno zemljište za gradnju.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
            <Link className="text-secondary font-bold flex items-center gap-2 pt-2 hover:scale-110 transition-transform duration-300 origin-right shrink-0" to="/placevi">
              Pogledaj sve <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {latestRealEstate.length > 0 ? latestRealEstate.map((plot: any, idx: number) => (
              <div key={plot.id || idx} className="relative rounded-[10px] overflow-hidden h-[500px] group shadow-2xl cursor-pointer" onClick={() => navigate(`/placevi/${plot.id}`)}>
                <OptimizedImage src={plot.images?.[0] || ""} fallbackType="real_estate" alt={plot.title || 'Plac'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent opacity-95 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="bg-secondary/20 text-secondary border border-secondary/30 px-3 py-1 rounded-[10px] text-xs font-bold backdrop-blur uppercase">
                      {plot.listingType === 'sale' ? 'PRODAJA' : 'IZDAVANJE'}
                    </span>
                    {plot.isPremium && (
                      <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-[10px] text-xs font-bold backdrop-blur uppercase">ISTAKNUT</span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black mb-2 uppercase line-clamp-1">{plot.title || 'Zemljište'}</h3>
                  <p className="text-on-surface-variant mb-6 text-sm flex items-center gap-1 line-clamp-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span> {typeof plot.location === 'object' ? plot.location.address : plot.location}
                    {plot.area && ` | Površina: ${plot.area}`}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-black">
                      {plot.price ? `€${plot.price.toLocaleString()}` : 'Po upitu'}
                    </span>
                    <button className="bg-gradient-to-br from-[#ffeb3b] to-[#fb8c00] text-slate-950 px-8 py-3 rounded-[10px] font-black hover:from-[#fb8c00] hover:to-[#ffeb3b] transition-all duration-300 uppercase shadow-lg shadow-yellow-500/20">Detalji</button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="md:col-span-2 bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>terrain</span>
                <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema objavljenih placeva</h3>
                <p className="text-on-surface-variant text-base">Prilika za placeve trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
              </div>
            )}
          </div>
          <Link 
            to="/postavi-oglas"
            className={UI_TOKENS.BTN_PRIMARY + " w-full mt-8 py-6 flex items-center justify-center text-lg rounded-[10px]"}
          >
            POSTAVI OGLAS ZA PLACEVE
          </Link>
        </div>
      </section>
  </>);
}