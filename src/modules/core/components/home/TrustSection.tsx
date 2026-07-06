import React from 'react';

const TRUST_ITEMS = [
  { icon: 'verified', title: 'Provereni poslodavci', desc: 'Svi poslodavci su verifikovani' },
  { icon: 'support_agent', title: 'Podrška 24/7', desc: 'Uvek tu za sva vaša pitanja' },
  { icon: 'speed', title: 'Brza pretraga', desc: 'AI pretraga štedi vaše vreme' },
];

export default function TrustSection() {
  return (
    <section className="bg-transparent py-16 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="text-center p-4 md:p-6 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-6xl md:text-9xl mb-4 md:mb-6 shrink-0">
                {item.icon}
              </span>
              <h4 className="text-white font-bold text-lg md:text-2xl mb-2">{item.title}</h4>
              <p className="text-white/40 text-sm md:text-lg text-center max-w-md">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
