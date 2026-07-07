import React from 'react';

const TRUST_ITEMS = [
  { icon: 'verified', title: 'Provereni poslodavci', desc: 'Svi poslodavci su verifikovani' },
  { icon: 'support_agent', title: 'Podrška 24/7', desc: 'Uvek tu za sva vaša pitanja' },
  { icon: 'speed', title: 'Brza pretraga', desc: 'AI pretraga štedi vaše vreme' },
];

const LOGO_COUNT = 30;
const logos = Array.from({ length: LOGO_COUNT }, (_, i) => `/assets/logos/partneri/${i + 1}.png`);

function LogoRow({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className={`flex gap-4 md:gap-16 items-center ${reverse ? 'marquee-reverse' : 'marquee'}`}>
      {items.map((src, i) => (
        <img key={i} src={src} alt="" className="!h-[200px] md:!h-44 w-auto object-contain opacity-60 hover:opacity-100 hover:-translate-y-2 transition-all duration-500 shrink-0" />
      ))}
    </div>
  );
}

export default function TrustSection() {
  return (
    <section className="bg-[#0B1420] py-16 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {TRUST_ITEMS.map((item, i) => (
            <div key={i} className="text-center p-4 md:p-6 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-7xl md:!text-[3rem] mb-4 md:mb-6 shrink-0">
                {item.icon}
              </span>
              <h4 className="text-white font-bold text-lg md:text-2xl mb-2">{item.title}</h4>
              <p className="text-white/40 text-sm md:text-lg text-center max-w-md">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full mb-10 text-center">
        <p className="text-[10px] md:text-sm font-black text-white/30 uppercase tracking-[0.4em] md:tracking-[0.2em]">
          Poverenje su nam ukazali
        </p>
      </div>

      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-track {
          display: flex;
          overflow: hidden;
          gap: 0;
          width: 100%;
        }
        .marquee-track .marquee-content {
          display: flex;
          gap: 1rem;
          flex-shrink: 0;
          min-width: 100%;
          animation: marquee-left 80s linear infinite;
          will-change: transform;
        }
        @media (min-width: 768px) {
          .marquee-track .marquee-content {
            gap: 2.5rem;
          }
        }
        .marquee-track.reverse .marquee-content {
          animation-name: marquee-right;
        }
      `}</style>

      <div className="space-y-6 md:space-y-8">
        <div className="marquee-track">
          <div className="marquee-content">
            <LogoRow items={logos} />
            <LogoRow items={logos} />
          </div>
        </div>
        <div className="hidden md:block marquee-track reverse">
          <div className="marquee-content">
            <LogoRow items={logos} />
            <LogoRow items={logos} />
          </div>
        </div>
      </div>
    </section>
  );
}
