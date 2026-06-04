import React from 'react';

interface JobWhatWeOfferProps {
  jobData: any;
}

export function JobWhatWeOffer({ jobData }: JobWhatWeOfferProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-white font-headline flex items-center gap-3 px-2 uppercase">
        <span className="material-symbols-outlined text-secondary">stars</span>
        Šta nudimo
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex flex-col gap-5 hover:border-secondary/30 transition-colors group shadow-lg">
          <div className="w-16 h-16 rounded-[10px] bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">location_on</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-widest mb-1">Mesto rada</p>
            <p className="text-xl text-white font-bold">{jobData.location}</p>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex flex-col gap-5 hover:border-secondary/30 transition-colors group shadow-lg">
          <div className="w-16 h-16 rounded-[10px] bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">schedule</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-widest mb-1">Radno vreme</p>
            <p className="text-xl text-white font-bold">{jobData.type}</p>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex flex-col gap-5 hover:border-secondary/30 transition-colors group shadow-lg">
          <div className="w-16 h-16 rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">home_work</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-widest mb-1">Smeštaj</p>
            <p className="text-xl text-white font-bold">{jobData.benefits?.housing}</p>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex flex-col gap-5 hover:border-secondary/30 transition-colors group shadow-lg">
          <div className="w-16 h-16 rounded-[10px] bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">local_shipping</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-widest mb-1">Prevoz</p>
            <p className="text-xl text-white font-bold">{jobData.benefits?.transport}</p>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex flex-col gap-5 hover:border-secondary/30 transition-colors group shadow-lg">
          <div className="w-16 h-16 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">payments</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-widest mb-1">Plata</p>
            <p className="text-xl text-white font-bold">{jobData.benefits?.salary}</p>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-[10px] border border-white/5 flex flex-col gap-5 hover:border-secondary/30 transition-colors group shadow-lg">
          <div className="w-16 h-16 rounded-[10px] bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">assignment_ind</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-widest mb-1">Ugovor</p>
            <p className="text-xl text-white font-bold">{jobData.benefits?.contract}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
