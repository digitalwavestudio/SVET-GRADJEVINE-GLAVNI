import { ShoppingCart } from 'lucide-react';
import React, { useMemo } from 'react';
import { calculateKrov } from '../../utils/calculatorFormulas';

interface KrovCalculatorProps {
  krovOsnova: any;
  setKrovOsnova: (val: any) => void;
  krovNagib: any;
  setKrovNagib: (val: any) => void;
  krovPotrosnjaCrepa: any;
  setKrovPotrosnjaCrepa: (val: any) => void;
  onOpenRfq: (results: any[], title: string) => void;
}

export const KrovCalculator = React.memo(({ krovOsnova, setKrovOsnova, krovNagib, setKrovNagib, krovPotrosnjaCrepa, setKrovPotrosnjaCrepa, onOpenRfq }: KrovCalculatorProps) => {
  const results = useMemo(() => calculateKrov(krovOsnova, krovNagib, krovPotrosnjaCrepa), [krovOsnova, krovNagib, krovPotrosnjaCrepa]);

  return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">OSNOVA KUĆE (m²)</label>
              <input aria-label="Unos polja" type="number" value={krovOsnova} onChange={e => setKrovOsnova(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
              <p className="text-[9px] text-white/30 uppercase mt-1 italic">Gabaritna površina pod krovom</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">NAGIB KROVA (°)</label>
                <input aria-label="Unos polja" type="number" value={krovNagib} onChange={e => setKrovNagib(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
                <p className="text-[9px] text-white/30 uppercase mt-1 italic">U stepenima (0 - 45°)</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">CREP (kom/m²)</label>
                <input aria-label="Unos polja" type="number" step="0.1" value={krovPotrosnjaCrepa} onChange={e => setKrovPotrosnjaCrepa(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
                <p className="text-[9px] text-white/30 uppercase mt-1 italic">Prosek: 12.5</p>
              </div>
            </div>
            <div className="bg-secondary/5 border border-secondary/20 p-5 rounded-[10px] flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary">calculate</span>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-relaxed">
                  Trigonometrijska verifikacija
                </p>
                <p className="text-[9px] text-white/40 uppercase mt-1">
                  Kalkulator automatski pretvara horizontalnu osnovu u realnu kosu površinu koristeći kosinus nagiba.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
             <div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[50px] pointer-events-none"></div>
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">SPECIFIKACIJA KROVNOG MATERIJALA</h3>
               <ul className="space-y-4">
                 {results.map((r, i) => (
                   <li key={i} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-[10px] border border-white/5">
                     <div>
                       <div className="text-xs font-black text-white uppercase tracking-tight">{r.name}</div>
                       <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{r.desc}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-black text-secondary">{r.amount} <span className="text-xs text-white/40">{r.unit}</span></div>
                     </div>
                   </li>
                 ))}
               </ul>
             </div>
             
             <button
               id="rfq-btn-KROV"
               type="button"
               onClick={() => onOpenRfq(results, 'Krovni alati i materijali')}
               className="w-full mt-8 flex items-center justify-center gap-3 bg-gradient-to-r from-secondary to-yellow-500 hover:from-yellow-500 hover:to-secondary !text-black font-black text-xs tracking-[0.15em] uppercase py-5 px-6 rounded-[10px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-secondary/10 group cursor-pointer"
             >
               <ShoppingCart className="w-5 h-5 !text-black stroke-[2.5]" />
               Pošalji specifikaciju na B2B tender
             </button>
          </div>
        </div>
      );
});
