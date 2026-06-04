import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { Input } from '@/src/components/ui/form/Input';

export function Step2Marketplace({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
  const { watch, setValue, formState: { errors } } = useFormContext();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
          <span className="material-symbols-outlined text-secondary">payments</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Uslovi i Benefiti</h2>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Input
             name="marketValue"
             type="number"
             label="Cena (EUR)"
             required
             icon="euro"
             placeholder="Iznos u EUR"
           />

           <div className="space-y-3">
             <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Stanje predmeta *</label>
             <div className="flex bg-black/40 p-1 rounded-[10px] border border-white/5">
               <button
                 type="button"
                 onClick={() => setValue('marketCondition', 'novo')}
                 className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 transition-all ${watch('marketCondition') === 'novo' ? 'bg-secondary border-secondary text-slate-950 shadow-lg shadow-secondary/20 scale-[0.98]' : 'border-transparent text-white hover:bg-white/[0.02]'}`}
               >
                 <span className="material-symbols-outlined text-2xl">new_releases</span>
                 <span className="text-[10px] font-black uppercase tracking-widest">Novo</span>
               </button>
               <button
                 type="button"
                 onClick={() => setValue('marketCondition', 'polovno')}
                 className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 transition-all ${watch('marketCondition') === 'polovno' ? 'bg-secondary border-secondary text-slate-950 shadow-lg shadow-secondary/20 scale-[0.98]' : 'border-transparent text-white hover:bg-white/[0.02]'}`}
               >
                 <span className="material-symbols-outlined text-2xl">history</span>
                 <span className="text-[10px] font-black uppercase tracking-widest">Polovno</span>
               </button>
             </div>
             {errors.marketCondition && <p className="text-error text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.marketCondition?.message as string}</p>}
           </div>
        </div>
      </div>
      
      <div className="mt-16 flex flex-col-reverse md:flex-row justify-between gap-4">
        <button type="button" onClick={prevStep} className={UI_TOKENS.BTN_SECONDARY}>Nazad</button>
        <button type="button" onClick={nextStep} className={UI_TOKENS.BTN_POST_AD}>Sledeći korak</button>
      </div>
    </motion.div>
  );
}
