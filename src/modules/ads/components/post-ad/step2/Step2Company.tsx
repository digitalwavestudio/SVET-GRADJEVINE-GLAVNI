import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { COMPANY_MAIN_CATEGORIES } from '@/src/constants/companyTaxonomy';

export function Step2Company({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const formData = watch();

  const handleCompanyMainCatToggle = (catId: string) => {
    const current = watch('companyMainCats') || [];
    const next = current.includes(catId)
      ? current.filter((c: string) => c !== catId)
      : [...current, catId];
    setValue('companyMainCats', next);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
          <span className="material-symbols-outlined text-secondary">layers</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Glavne kategorije rada</h2>
      </div>

      <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-10">Izaberite jednu ili više glavnih kategorija kojima se vaša firma bavi.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {COMPANY_MAIN_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCompanyMainCatToggle(cat.id)}
              className={`flex items-center gap-4 p-6 rounded-[10px] border-2 text-left transition-all duration-300 ${formData.companyMainCats?.includes(cat.id) ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
            >
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border ${formData.companyMainCats?.includes(cat.id) ? 'bg-secondary border-secondary text-slate-950' : 'bg-surface-container-high border-white/10 text-secondary'}`}>
                <span className="material-symbols-outlined text-xl">{cat.icon}</span>
              </div>
              <span className={`text-sm font-black uppercase tracking-tight font-headline ${formData.companyMainCats?.includes(cat.id) ? 'text-secondary' : 'text-white'}`}>{cat.name}</span>
              {formData.companyMainCats?.includes(cat.id) && <span className="material-symbols-outlined ml-auto text-secondary text-xl">check_circle</span>}
            </button>
        ))}
      </div>
      {errors.companyMainCats && <p className="text-error text-[10px] font-bold mb-8 uppercase text-center">{errors.companyMainCats.message as string}</p>}

      <div className="flex justify-between flex-col-reverse md:flex-row gap-4">
        <button type="button" onClick={prevStep} className={UI_TOKENS.BTN_SECONDARY}>Nazad</button>
        <button type="button" onClick={nextStep} className={UI_TOKENS.BTN_POST_AD}>
          Sledeći korak
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </motion.div>
  );
}
