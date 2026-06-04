import { ShoppingCart } from 'lucide-react';
import React, { useMemo } from 'react';
import { calculateBeton } from '../../utils/calculatorFormulas';

interface BetonCalculatorProps {
  betonDuzina: any;
  setBetonDuzina: (val: any) => void;
  betonSirina: any;
  setBetonSirina: (val: any) => void;
  betonDubina: any;
  setBetonDubina: (val: any) => void;
  onOpenRfq: (results: any[], title: string) => void;
}

export const BetonCalculator = React.memo(({ betonDuzina, setBetonDuzina, betonSirina, setBetonSirina, betonDubina, setBetonDubina, onOpenRfq }: BetonCalculatorProps) => {
  const results = useMemo(() => calculateBeton(betonDuzina, betonSirina, betonDubina), [betonDuzina, betonSirina, betonDubina]);

  return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">DUŽINA (m)</label>
                <input aria-label="Unos polja" type="number" value={betonDuzina} onChange={e => setBetonDuzina(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">ŠIRINA (m)</label>
                <input aria-label="Unos polja" type="number" value={betonSirina} onChange={e => setBetonSirina(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">DEBLJINA PLOČE / DUBINA (m)</label>
              <input aria-label="Unos polja" type="number" step="0.01" value={betonDubina} onChange={e => setBetonDubina(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
              <p className="text-[10px] font-bold text-white/30 uppercase mt-2">PRIMER: 10cm = 0.1m</p>
            </div>
          </div>
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
             <div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[50px] pointer-events-none"></div>
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">IZLAZNI PODACI</h3>
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
               id="rfq-btn-BETON"
               type="button"
               onClick={() => onOpenRfq(results, 'Beton')}
               className="w-full mt-8 flex items-center justify-center gap-3 bg-gradient-to-r from-secondary to-yellow-500 hover:from-yellow-500 hover:to-secondary text-slate-950 font-black text-xs tracking-[0.15em] uppercase py-5 px-6 rounded-[10px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-secondary/10 group cursor-pointer"
             >
               <ShoppingCart className="w-5 h-5 text-slate-950 stroke-[2.5]" />
               Pošalji specifikaciju na B2B tender
             </button>
          </div>
        </div>
      );
});
