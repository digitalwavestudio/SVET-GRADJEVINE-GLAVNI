import { ShoppingCart } from 'lucide-react';
import React, { useMemo } from 'react';
import { calculatePodovi } from '../../utils/calculatorFormulas';

interface PodoviCalculatorProps {
  podoviKvadratura: any;
  setPodoviKvadratura: (val: any) => void;
  podoviTipSlaganja: any;
  setPodoviTipSlaganja: (val: any) => void;
  podoviPakovanjeM2: any;
  setPodoviPakovanjeM2: (val: any) => void;
  onOpenRfq: (results: any[], title: string) => void;
}

export const PodoviCalculator = React.memo(({ podoviKvadratura, setPodoviKvadratura, podoviTipSlaganja, setPodoviTipSlaganja, podoviPakovanjeM2, setPodoviPakovanjeM2, onOpenRfq }: PodoviCalculatorProps) => {
  const results = useMemo(() => calculatePodovi(podoviKvadratura, podoviTipSlaganja, podoviPakovanjeM2), [podoviKvadratura, podoviTipSlaganja, podoviPakovanjeM2]);

  return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">POVRŠINA PODA (m²)</label>
                <input aria-label="Unos polja" type="number" value={podoviKvadratura} onChange={e => setPodoviKvadratura(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">m² U PAKOVANJU</label>
                <input aria-label="Unos polja" type="number" step="0.01" value={podoviPakovanjeM2} onChange={e => setPodoviPakovanjeM2(e.target.value ? Number(e.target.value) : '')} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-xl font-black outline-none focus:border-secondary transition-colors" />
                <p className="text-[9px] text-white/30 uppercase mt-1 italic">Piše na deklaraciji paketa</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">STIL SLAGANJA / VRSTA PODA</label>
              <select value={podoviTipSlaganja} onChange={e => setPodoviTipSlaganja(e.target.value)} className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-5 py-5 text-white text-base font-bold outline-none focus:border-secondary transition-colors appearance-none cursor-pointer">
                 <option value="STANDARD">STANDARDNO SLAGANJE (LAMINAT / BRODSKI POD)</option>
                 <option value="RIBLJA_KOST">RIBLJA KOST / HERRINGBONE (VEĆI OTPAD)</option>
              </select>
            </div>
            <div className="bg-secondary/5 border border-secondary/20 p-5 rounded-[10px]">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-relaxed">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                Savet: Za prostorije sa puno uglova uvek računajte na gornju granicu otpada (10-15%).
              </p>
            </div>
          </div>
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
             <div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[50px] pointer-events-none"></div>
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">SPECIFIKACIJA PODNIH OBLOGA</h3>
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
               id="rfq-btn-PODOVI"
               type="button"
               onClick={() => onOpenRfq(results, 'Podovi')}
               className="w-full mt-8 flex items-center justify-center gap-3 bg-gradient-to-r from-secondary to-yellow-500 hover:from-yellow-500 hover:to-secondary !text-black font-black text-xs tracking-[0.15em] uppercase py-5 px-6 rounded-[10px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-secondary/10 group cursor-pointer"
             >
               <ShoppingCart className="w-5 h-5 !text-black stroke-[2.5]" />
               Pošalji specifikaciju na B2B tender
             </button>
          </div>
        </div>
      );
});
