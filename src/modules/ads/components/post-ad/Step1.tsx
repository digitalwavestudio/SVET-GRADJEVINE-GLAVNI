import { useEffect } from 'react';
import { motion } from 'motion/react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MACHINE_CATEGORIES, MACHINE_SUBCATEGORIES } from '@/src/constants/machineTaxonomy';
import { TaxonomyItem, ACCOMMODATION_TYPES, KITCHEN_TYPES, LOCATIONS, PROFESSIONS, REAL_ESTATE_PURPOSES, SECTORS, MARKETPLACE_CATEGORIES, PAYMENT_DYNAMICS, BENEFITS } from '@/src/constants/taxonomy';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';
import { Textarea } from '@/src/components/ui/form/Textarea';
import { StepProps } from '@/src/modules/ads/components/post-ad/types';
import { AiMagicInput } from './AiMagicInput';
import { AiJobScore } from './AiJobScore';

export function Step1({
  setSelectedCategory,
  selectedCategory,
  nextStep,
  setStep,
}: {
  setSelectedCategory?: (c: string | null) => void;
  selectedCategory: string;
  nextStep?: () => void;
  setStep?: (n: number) => void;
}) {
  const { watch, setValue, register, formState: { errors } } = useFormContext();
  
  const sector = watch('sector');
  const machCategory = watch('machCategory');
  const plotPurpose = watch('plotPurpose');

  const availableProfessions: TaxonomyItem[] = sector ? PROFESSIONS[sector] || [] : [];
  const availableSubcategories: TaxonomyItem[] = machCategory ? (MACHINE_SUBCATEGORIES[machCategory] || []) : [];
  const opis = watch('opis');
  const plataMin = watch('plataMin');

  useEffect(() => {
    if (!opis || selectedCategory !== 'job') return;
    const m = opis.match(/Satnica:\s*(\d+(?:[.,]\s*\d+)?)\s*(?:eur|€)?/i);
    if (m) {
      const v = m[1].replace(',', '.').replace(/\s+/g, '');
      if (v !== (plataMin ?? '')) {
        setValue('plataMin', v, { shouldDirty: true });
        setValue('isNegotiable', false, { shouldDirty: true });
      }
    }
  }, [opis, selectedCategory, setValue, plataMin]);

  return (
    <>
      {/* STEP 1 - Company */}
      {selectedCategory === 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-start md:items-center gap-4 mb-10 flex-wrap">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20 shrink-0">
              <span className="material-symbols-outlined text-secondary">business_center</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline text-center sm:text-left">Osnovne informacije o firmi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Input name="companyName" label="Naziv firme" placeholder="Npr. Građevinac DOO" required />
            
            <Select 
              name="location" 
              label="Sedište firme (grad)" 
              options={LOCATIONS.map(l => ({ value: l.slug, label: l.name }))} 
              placeholder="Izaberite grad" 
              required 
            />
            
            <Input name="companyAddress" label="Adresa" placeholder="Ulica i broj" required />
            <Input name="phone" label="Telefon" placeholder="Npr. 064 123 456" required />
            <Input name="companyWorkingHours" label="Radno vreme" placeholder="Npr. Pon-Pet 07-17h" />
          </div>

          <Textarea 
            name="companyDescription" 
            label="Kratak opis firme (min 50 karaktera)" 
            placeholder="Predstavite svoju firmu klijentima..." 
            rows={4} 
            required 
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
            <Input name="companyIG" label="Instagram" placeholder="@vasafirma" />
            <Input name="companyFB" label="Facebook" placeholder="fb.com/vasafirma" />
            <Input name="companyWeb" label="Web sajt" placeholder="www.firma.rs" />
          </div>

          <div className="mt-12 grid grid-cols-2 sm:flex sm:justify-between gap-4 w-full">
            <button 
              type="button"
              onClick={() => setSelectedCategory?.(null)}
              className={`${UI_TOKENS.BTN_SECONDARY} w-full sm:w-auto justify-center`}
            >
              Nazad
            </button>
            <button type="button" onClick={nextStep} className={`${UI_TOKENS.BTN_POST_AD} w-full sm:w-auto justify-center`}>
              Nastavi dalje
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 1 - Generic Listings */}
      {selectedCategory !== 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center sm:items-start md:items-center justify-center sm:justify-start gap-4 mb-10 flex-wrap">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20 shrink-0">
              <span className="material-symbols-outlined text-secondary">
                {selectedCategory === 'accommodation' ? 'home' : 'search'}
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline text-center sm:text-left w-full sm:w-auto mt-2 sm:mt-0">Osnovne informacije</h2>
          </div>
          
          {selectedCategory === 'job' && (
            <div className="space-y-8 mb-8">
              <AiJobScore />
              <AiMagicInput selectedCategory={selectedCategory} setStep={setStep} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Kontakt Telefon *</label>
                  <div className="relative group">
                    <input 
                      type="tel"
                      {...register('phone')}
                      placeholder="Npr. 0601234567"
                      className={`w-full bg-[#070d14] border ${errors?.phone ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-[10px] px-6 py-5 text-white focus:border-[#ffad3a]/50 focus:bg-[#070d14] focus:shadow-[0_0_20px_rgba(254,191,13,0.1)] outline-none transition-all duration-300 font-bold group-hover:bg-white/[0.06] group-hover:border-white/20 [-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s,color_0s_ease-in-out_0s] [-webkit-autofill]:[background-color:#070d14!important] [-webkit-autofill]:[-webkit-text-fill-color:white!important] [-webkit-autofill]:[box-shadow:0_0_0px_1000px_#070d14_inset!important]`}
                    />
                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-hover:text-[#ffad3a] transition-colors">call</span>
                  </div>
                  {errors?.phone && <p className="text-error text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.phone.message as string}</p>}
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Dostupni ste na</label>
                  <div className="flex w-full h-[58px] justify-around items-center text-lg font-black">
                    <button
                      type="button"
                      onClick={() => setValue('viber', !watch('viber'))}
                      className={`flex items-center gap-2 transition-all hover:scale-105 ${
                        watch('viber') 
                          ? 'text-[#7360F2] opacity-100 drop-shadow-[0_0_10px_rgba(115,96,242,0.6)]' 
                          : 'text-[#7360F2] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl">call</span>
                      Viber
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('whatsapp', !watch('whatsapp'))}
                      className={`flex items-center gap-2 transition-all hover:scale-105 ${
                        watch('whatsapp') 
                          ? 'text-[#25D366] opacity-100 drop-shadow-[0_0_10px_rgba(37,211,102,0.6)]' 
                          : 'text-[#25D366] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl">chat</span>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          <div className="space-y-8">
            {selectedCategory === 'accommodation' && (
              <Select 
                name="accType" 
                label="Tip smeštaja" 
                options={ACCOMMODATION_TYPES.map(t => ({ value: t.slug, label: t.name }))} 
                icon="apartment" 
                required 
              />
            )}

            {selectedCategory === 'catering' && (
              <Select 
                name="catKitchenType" 
                label="Tip kuhinje" 
                options={KITCHEN_TYPES.map(t => ({ value: t.id, label: t.name }))} 
                icon="restaurant" 
                required 
              />
            )}

            {selectedCategory === 'marketplace' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select 
                  name="marketCategory" 
                  label="Kategorija predmeta" 
                  options={MARKETPLACE_CATEGORIES.map(c => ({ value: c.id, label: c.name }))} 
                  icon="shopping_basket" 
                  required 
                />
                <Input name="title" label="Naslov oglasa" placeholder="Npr. Drvena oplata 50m2" required />
              </div>
            )}

            {selectedCategory === 'machines' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select 
                  name="machCategory" 
                  label="Kategorija mašine" 
                  options={MACHINE_CATEGORIES.map(c => ({ value: c.id, label: c.name }))} 
                  icon="precision_manufacturing" 
                  required 
                />
                <Select 
                  name="machSubCategory" 
                  label="Podkategorija / Vrsta" 
                  options={availableSubcategories.map((s) => ({ value: s.id, label: s.name }))} 
                  icon="category" 
                  disabled={!machCategory}
                  required 
                />
                <Input name="machBrand" label="Marka mašine" placeholder="Npr. Caterpillar, JCB..." required />
                <Input name="machModel" label="Model" placeholder="Npr. 320D, 3CX..." required />
              </div>
            )}



            {selectedCategory === 'plot' && (
              <div className="space-y-6">
                <label className="block text-[10px] font-black text-[#a2acb9] uppercase tracking-[0.2em] ml-1">Namena zemljišta *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {REAL_ESTATE_PURPOSES.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setValue('plotPurpose', p.id)}
                      className={`py-6 rounded-[10px] border-2 transition-all font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-3 ${plotPurpose === p.id ? 'bg-secondary border-secondary !text-black shadow-lg shadow-secondary/20' : 'bg-white/5 border-white/5 text-[#a2acb9] hover:border-white/20'}`}
                    >
                      <span className="material-symbols-outlined text-3xl">
                        {p.id === 'građevinsko' ? 'home' : p.id === 'industrijsko' ? 'factory' : 'agriculture'}
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory !== 'job' && (
              <Select 
                name="location" 
                label="Izaberite grad" 
                options={LOCATIONS.map(l => ({ value: l.slug, label: l.name }))} 
                icon="location_on" 
                required 
              />
            )}


          </div>

          <div className="mt-16 grid grid-cols-2 sm:flex sm:flex-row gap-4 sm:justify-between w-full">
            <button 
              type="button"
              onClick={() => setSelectedCategory?.(null)}
              className={`${UI_TOKENS.BTN_SECONDARY} w-full sm:w-auto justify-center`}
            >
              Nazad
            </button>
            <button 
              type="button"
              onClick={nextStep} 
              className={`${UI_TOKENS.BTN_POST_AD} w-full sm:w-auto justify-center`}
            >
              Nastavi dalje
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
