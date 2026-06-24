import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { PAYMENT_DYNAMICS, EXPERIENCE_LEVELS, BENEFITS } from '@/src/constants/taxonomy';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';


export function Step2Job({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
          <span className="material-symbols-outlined text-secondary">payments</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Uslovi</h2>
      </div>

      <div className="space-y-10">
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-[10px] border border-white/10">
          <div>
            <span className="block text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Tip isplate</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase">{watch('salaryType') === 'hourly' ? 'Satnica' : 'Plata'}</span>
              <span className="text-xs text-on-surface-variant/60">{watch('salaryType') === 'hourly' ? '(pomerite desno)' : '(pomerite levo)'}</span>
            </div>
          </div>
          <div className="flex bg-black/40 p-1 rounded-[10px] border border-white/5">
            <button
              type="button"
              onClick={() => setValue('salaryType', 'hourly')}
              className={`px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${watch('salaryType') === 'hourly' ? 'bg-secondary !text-black shadow-lg shadow-secondary/20' : 'text-on-surface-variant/40 hover:text-white'}`}
            >
              Satnica
            </button>
            <button
              type="button"
              onClick={() => setValue('salaryType', 'monthly')}
              className={`px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${watch('salaryType') === 'monthly' ? 'bg-secondary !text-black shadow-lg shadow-secondary/20' : 'text-on-surface-variant/40 hover:text-white'}`}
            >
              Plata
            </button>
          </div>
        </div>

        {/* Inputs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              name="plataMin" 
              type="number" 
              label={watch('salaryType') === 'hourly' ? 'Satnica od (EUR)' : 'Plata od (EUR)'} 
              required 
              placeholder="Od" 
            />
            <Input 
              name="plataMax" 
              type="number" 
              label={watch('salaryType') === 'hourly' ? 'Satnica do (EUR)' : 'Plata do (EUR)'} 
              required 
              placeholder="Do" 
            />
          </div>

          <Select
            name="dinamikaIsplate"
            label="Dinamika isplate"
            required
            icon="schedule"
              options={PAYMENT_DYNAMICS
                .filter(dyn => {
                  if (watch('salaryType') === 'hourly' && dyn.slug === 'mesecna') return false;
                  if (watch('salaryType') === 'monthly' && (dyn.slug === 'dnevna' || dyn.slug === 'nedeljna')) return false;
                  return true;
                })
                .map(dyn => ({ 
                  value: dyn.slug, 
                  label: dyn.slug === 'po-m2' ? 'Plaćanje po m2' : dyn.name,
                  className: dyn.slug === 'po-m2' ? 'text-secondary' : undefined 
                }))}
            placeholder="Izaberite dinamiku"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Select
            name="iskustvo"
            label="Izaberite nivo iskustva"
            icon="military_tech"
            options={EXPERIENCE_LEVELS.map(exp => ({ value: exp.slug, label: exp.name }))}
          />

          <Input
            name="tipAngazmana"
            label="Radno vreme"
            icon="badge"
            placeholder="npr. 09-17h, smenski rad, vikendom..."
          />
        </div>

        <div className="space-y-5">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Pogodnosti</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BENEFITS.map(benefit => (
              <label 
                key={benefit.slug} 
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[10px] border-2 cursor-pointer transition-all duration-300 ${((watch('benefits') as string[]) || []).includes(benefit.slug) ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/5 scale-[1.02]' : benefit.slug === 'pomoc-pri-vizi' ? 'border-white/5 bg-secondary/[0.04] hover:border-white/20' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
              >
                <input 
                  type="checkbox" 
                  checked={((watch('benefits') as string[]) || []).includes(benefit.slug)}
                  onChange={() => {
                    const current = (watch('benefits') as string[]) || [];
                    const next = current.includes(benefit.slug) 
                      ? current.filter(b => b !== benefit.slug)
                      : [...current, benefit.slug];
                    setValue('benefits', next);
                  }}
                  className="hidden" 
                />
                <span className={`material-symbols-outlined text-3xl transition-colors ${((watch('benefits') as string[]) || []).includes(benefit.slug) ? 'text-secondary' : 'text-on-surface-variant'}`}>
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
                <span className={`text-[10px] font-black uppercase tracking-widest text-center transition-colors ${((watch('benefits') as string[]) || []).includes(benefit.slug) ? 'text-white' : 'text-on-surface-variant'}`}>
                  {benefit.name}
                </span>
              </label>
            ))}
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
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </motion.div>
  );
}
