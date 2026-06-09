import { motion } from 'motion/react';
import { useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import SeoHead from '@/src/components/SeoHead';

export default function B2BTendersPage() {
  const [activeTab, setActiveTab] = useState('AKTIVNI TENDERI');

  const tenders = [
    {
      id: "TND-2024-081",
      title: "Gruba gradnja - Lamela C (22,000 m2)",
      investor: "MegaGradnja NS",
      deadline: "24. April 2024",
      budget: "ZATVOREN (BLIND BID)",
      requirements: ["Licenca I081", "Min. 50 radnika na raspolaganju", "Rok završetka 180 dana"],
      status: "OPEN",
      bids: 4
    },
    {
      id: "TND-2024-042",
      title: "Kompletne elektroinstalacije poselovnog objekta",
      investor: "SmartInvest DOO",
      deadline: "12. Maj 2024",
      budget: "~240,000 EUR",
      requirements: ["Licenca I052", "Iskustvo sa KNX sistemima"],
      status: "OPEN",
      bids: 1
    }
  ];

  return (
    <DashboardLayout>
      <SeoHead 
        title="B2B Tenderi | Svet Građevine"
        description="Pronađite aktivne tendere za izvođenje građevinskih radova, mašinske instalacije i specijalizovane zanate u Srbiji."
        type="website"
      />
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row gap-6 justify-between sm:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">B2B TENDERI</h1>
            <p className="text-white/40 font-bold text-xs tracking-[0.2em] uppercase">MREŽA PODIZVOĐAČA I VELIKIH PROJEKATA</p>
          </div>
          <button className="w-full sm:w-auto bg-secondary text-slate-950 font-black px-8 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-[0.2em] uppercase shadow-2xl shadow-secondary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">post_add</span> RASPIS TENDERA
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-white/5 pb-6">
          {['AKTIVNI TENDERI', 'MOJE PONUDE', 'ZATVORENI PROJEKTI'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-[10px] text-[10px] font-black tracking-widest uppercase transition-all ${
                activeTab === tab 
                  ? 'bg-white text-slate-950 shadow-lg' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-6">
          {tenders.map((tender, idx) => (
            <motion.div 
              key={tender.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0A0F14] border border-white/5 hover:border-white/20 transition-all rounded-[10px] p-5 md:p-8 flex flex-col xl:flex-row gap-8 items-start xl:items-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center gap-3">
                  <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-[10px] text-[9px] font-black tracking-widest uppercase">
                    {tender.id}
                  </span>
                  <span className="text-[10px] font-black text-white/40 tracking-widest uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">business</span> {tender.investor}
                  </span>
                </div>
                
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{tender.title}</h3>
                
                <div className="flex flex-wrap gap-2">
                  {tender.requirements.map((req, i) => (
                    <span key={i} className="bg-white/5 border border-white/5 text-white/60 px-3 py-1.5 rounded-[10px] text-[10px] font-bold tracking-wider">
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-4 xl:flex items-center gap-6 xl:gap-10 border-t border-white/5 xl:border-none pt-6 xl:pt-0">
                <div>
                   <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">BUDŽET</div>
                   <div className={`text-sm font-black tracking-widest uppercase ${tender.budget.includes('BLIND') ? 'text-secondary' : 'text-white'}`}>
                     {tender.budget}
                   </div>
                </div>
                <div>
                   <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">ROK ZA PONUDE</div>
                   <div className="text-sm font-black text-white tracking-widest uppercase">{tender.deadline}</div>
                </div>
                <div>
                   <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">BR. PONUDA</div>
                   <div className="text-sm font-black text-white tracking-widest">{tender.bids}</div>
                </div>
                
                <div className="col-span-2 md:col-span-1 xl:col-span-1">
                  <button className="w-full bg-white/5 hover:bg-secondary text-white hover:text-slate-950 border border-white/10 hover:border-secondary transition-all px-8 py-4 rounded-[10px] text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 group-hover:bg-secondary group-hover:text-slate-950">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    POŠALJI PONUDU
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
