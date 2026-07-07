import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { PAYMENT_DYNAMICS, BENEFITS } from '@/src/constants/taxonomy';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';


export function Step2Job({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center justify-center md:justify-start gap-4 mb-8 md:mb-10">
        <div className="hidden md:flex w-12 h-12 bg-secondary/10 rounded-[10px] items-center justify-center border border-secondary/20">
          <span className="material-symbols-outlined text-secondary">payments</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline text-center md:text-left w-full md:w-auto">Uslovi</h2>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="w-full bg-white/[0.02] p-5 sm:p-8 rounded-[12px] border border-white/10 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <span className="block text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1 sm:mb-0">Zarada / Iznos</span>
              <label className="flex items-center gap-3 cursor-pointer group mt-2 sm:mt-0">
                <span className={`text-[14px] leading-none md:text-[14px] font-black uppercase tracking-widest transition-colors ${watch('isNegotiable') ? 'text-secondary' : 'text-white/60 group-hover:text-white'}`}>
                  Pozvati
                </span>
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${watch('isNegotiable') ? 'bg-secondary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${watch('isNegotiable') ? 'left-[22px] bg-[#070d14]' : 'left-1'}`} />
                </div>
                <input 
                  type="checkbox" 
                  {...register('isNegotiable')} 
                  className="hidden"
                />
              </label>
            </div>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-all duration-500 ${watch('isNegotiable') ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
              <Input 
                name="plataMin" 
                type="number" 
                label="Iznos od (EUR)" 
                required={!watch('isNegotiable')}
                placeholder="Od" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const maxInput = document.querySelector('input[name="plataMax"]') as HTMLInputElement;
                    if (maxInput) maxInput.focus();
                  }
                }}
              />
              <Input 
                name="plataMax" 
                type="number" 
                label="Iznos do (EUR)" 
                required={!watch('isNegotiable')}
                placeholder="Do" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="w-full max-w-lg mx-auto bg-white/[0.02] p-6 rounded-[12px] border border-white/10 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative z-50">
            <Select
              name="dinamikaIsplate"
              label="Način obračuna"
              required
              icon="schedule"
              options={[
                ...PAYMENT_DYNAMICS.map(dyn => ({ 
                  value: dyn.slug, 
                  label: dyn.slug === 'po-m2' ? 'Po kvadratu (m2)' : dyn.slug === 'mesecna' ? 'Mesečno (Plata)' : dyn.name,
                  className: dyn.slug === 'po-m2' ? 'text-secondary' : undefined 
                }))
              ]}
              placeholder="Izaberite način obračuna"
            />
          </div>
        </div>

        <div className="space-y-5">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Pogodnosti</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BENEFITS.map(benefit => {
              const isChecked = ((watch('benefits') as string[]) || []).includes(benefit.slug);
              return (
                <label 
                  key={benefit.slug} 
                  className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[12px] border cursor-pointer transition-all duration-500 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.15)] ${
                    isChecked 
                      ? 'border-secondary bg-secondary/[0.08] shadow-[0_0_25px_rgba(254,191,13,0.15)] scale-[1.03]' 
                      : benefit.slug === 'pomoc-pri-vizi' 
                        ? 'border-secondary/20 bg-secondary/[0.02] hover:border-secondary/50 hover:bg-secondary/[0.05]' 
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => {
                      const current = (watch('benefits') as string[]) || [];
                      const next = current.includes(benefit.slug) 
                        ? current.filter(b => b !== benefit.slug)
                        : [...current, benefit.slug];
                      setValue('benefits', next);
                    }}
                    className="hidden" 
                  />
                  <span className={`material-symbols-outlined text-3xl transition-all duration-300 ${
                    isChecked ? 'text-secondary drop-shadow-[0_0_8px_rgba(254,191,13,0.6)] scale-110' : 'text-white/40'
                  }`}>
                    {benefit.slug === 'smestaj' ? 'home' : 
                     benefit.slug === 'topli-obrok' ? 'restaurant' : 
                     benefit.slug === 'pauza-za-kafu' ? 'coffee' :
                     benefit.slug === 'prevoz' ? 'commute' : 
                     benefit.slug === 'htz-oprema' ? 'checkroom' :
                     benefit.slug === 'alat-za-rad' ? 'construction' :
                     benefit.slug === 'prijava-ugovor' ? 'health_and_safety' :
                     benefit.slug === 'placen-prekovremeni' ? 'more_time' :
                     benefit.slug === 'pomoc-pri-vizi' ? 'public' : 'check_circle'}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-center transition-all duration-300 ${
                    isChecked ? 'text-white [text-shadow:0_0_10px_rgba(255,255,255,0.2)]' : 'text-white/50'
                  }`}>
                    {benefit.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col-reverse md:flex-row justify-between gap-4">
        <button 
          type="button"
          onClick={prevStep} 
          className={UI_TOKENS.BTN_SECONDARY}
        >
          Nazad
        </button>
        <button 
          type="button"
          onClick={nextStep} 
          className={UI_TOKENS.BTN_POST_AD}
        >
          Nastavi dalje
          <span className="hidden md:block material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </motion.div>
  );
}
