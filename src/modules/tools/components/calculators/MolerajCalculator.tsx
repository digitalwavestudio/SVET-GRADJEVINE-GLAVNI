import { ShoppingCart } from 'lucide-react';
import React, { useMemo } from 'react';
import { calculateMoleraj } from '../../utils/calculatorFormulas';

interface MolerajCalculatorProps {
  molerajKvadratura: any;
  setMolerajKvadratura: (val: any) => void;
  molerajOdbijci: any;
  setMolerajOdbijci: (val: any) => void;
  molerajTipBoje: any;
  setMolerajTipBoje: (val: any) => void;
  molerajBrojRuku: any;
  setMolerajBrojRuku: (val: any) => void;
  onOpenRfq: (results: any[], title: string) => void;
}

export const MolerajCalculator = React.memo(({ molerajKvadratura, setMolerajKvadratura, molerajOdbijci, setMolerajOdbijci, molerajTipBoje, setMolerajTipBoje, molerajBrojRuku, setMolerajBrojRuku, onOpenRfq }: MolerajCalculatorProps) => {
  const results = useMemo(() => calculateMoleraj(molerajKvadratura, molerajOdbijci, molerajTipBoje, molerajBrojRuku), [molerajKvadratura, molerajOdbijci, molerajTipBoje, molerajBrojRuku]);

  return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">UKUPNA POVRŠINA (m²)</label>
                <input aria-label="Unos polja" type="number" value={molerajKvadratura} onChange={e => setMolerajKvadratura(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">ODBIJANJE OTVORA (m²)</label>
                <input aria-label="Unos polja" type="number" value={molerajOdbijci} onChange={e => setMolerajOdbijci(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
                <p className="text-[9px] text-white/30 uppercase mt-1 italic">Vrata i prozori</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">TIP BOJE</label>
              <select value={molerajTipBoje} onChange={e => setMolerajTipBoje(e.target.value)} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-base font-bold outline-none focus:border-secondary transition-colors appearance-none cursor-pointer">
                 <option value="POLUDISPERZIJA">POLUDISPERZIJA (STANDARDNA BELA)</option>
                 <option value="AKRILNA">AKRILNA BOJA (TONIRANA)</option>
                 <option value="PERIVA">PERIVA BOJA (PREMIUM)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">BROJ PREMAZA (RUKE)</label>
              <div className="flex gap-4">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMolerajBrojRuku(n)}
                    className={`flex-1 py-4 rounded-[10px] text-sm font-black border transition-all ${molerajBrojRuku === n ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {n} SL{n === 1 ? 'OJ' : 'OJA'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
             <div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[50px] pointer-events-none"></div>
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">SPECIFIKACIJA MATERIJALA</h3>
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
               id="rfq-btn-MOLERAJ"
               type="button"
               onClick={() => onOpenRfq(results, 'Moleraj & Farbanje')}
               className="w-full mt-8 flex items-center justify-center gap-3 bg-gradient-to-r from-secondary to-yellow-500 hover:from-yellow-500 hover:to-secondary text-slate-950 font-black text-xs tracking-[0.15em] uppercase py-5 px-6 rounded-[10px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-secondary/10 group cursor-pointer"
             >
               <ShoppingCart className="w-5 h-5 text-slate-950 stroke-[2.5]" />
               Pošalji specifikaciju na B2B tender
             </button>
          </div>
        </div>
      );
});
