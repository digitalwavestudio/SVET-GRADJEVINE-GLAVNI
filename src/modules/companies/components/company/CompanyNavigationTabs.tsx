import React from 'react';

type ProfileTab = 'info' | 'jobs' | 'machines' | 'accommodations' | 'catering' | 'realestate';

interface CompanyNavigationTabsProps {
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  counts: {
    jobs: number;
    machines: number;
    accommodations: number;
    catering: number;
    realestate: number;
  };
}

export function CompanyNavigationTabs({ activeTab, setActiveTab, counts }: CompanyNavigationTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-2 rounded-[10px] border border-white/5 overflow-x-auto no-scrollbar">
      {[
        { id: 'jobs', label: 'Poslovi', count: counts.jobs, icon: 'work' },
        { id: 'machines', label: 'Mašine', count: counts.machines, icon: 'construction' },
        { id: 'accommodations', label: 'Smeštaj', count: counts.accommodations, icon: 'home' },
        { id: 'catering', label: 'Hrana', count: counts.catering, icon: 'restaurant' },
        { id: 'realestate', label: 'Placevi', count: counts.realestate, icon: 'landscape' },
        { id: 'info', label: 'O Firmi', count: null, icon: 'info' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as ProfileTab)}
          className={`flex-grow md:flex-grow-0 px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === tab.id 
              ? 'bg-[#ffad3a] text-black shadow-[0_10px_20px_rgba(255,173,58,0.2)]' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-sm">{tab.icon}</span>
          {tab.label}
          {tab.count !== null && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-black/20' : 'bg-white/10'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
