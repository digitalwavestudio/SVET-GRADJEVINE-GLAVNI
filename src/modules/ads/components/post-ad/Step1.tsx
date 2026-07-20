import { useEffect } from 'react';
import { motion } from 'motion/react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MACHINE_CATEGORIES, MACHINE_SUBCATEGORIES } from '@/src/constants/machineTaxonomy';
import { TaxonomyItem, ACCOMMODATION_TYPES, KITCHEN_TYPES, LOCATIONS, PROFESSIONS, REAL_ESTATE_PURPOSES, SECTORS, PAYMENT_DYNAMICS, BENEFITS } from '@/src/constants/taxonomy';
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
  const { watch, setValue, register, getValues, formState: { errors } } = useFormContext();
  
  const sector = watch('sector');
  const machCategory = watch('machCategory');
  const plotPurpose = watch('plotPurpose');

  const availableProfessions: TaxonomyItem[] = sector ? PROFESSIONS[sector] || [] : [];
  const availableSubcategories: TaxonomyItem[] = machCategory ? (MACHINE_SUBCATEGORIES[machCategory] || []) : [];
  const opis = watch('opis');
  const plataMin = watch('plataMin');

  useEffect(() => {
    if (!opis || selectedCategory !== 'job') return;

    const mapPaymentDynamics = (val: string): string | null => {
      const v = val.trim().toLowerCase();
      if (v === '?' || v === '' || v === 'ne') return null;
      if (/^dnevna|dnevno|dnevni$/.test(v)) return 'dnevna';
      if (/^nedeljna|nedeljno|nedeljni$/.test(v)) return 'nedeljna';
      if (/^(na\s*)?15\s*dana$/.test(v) || /^petnaest\s*dana$/.test(v)) return 'na-15-dana';
      if (/^mesecna|mesecno|mesečna|mesečno$/.test(v) || v === 'plata') return 'mesecna';
      if (/^po\s*m2$|^kvadrat$|^m2$/.test(v)) return 'po-m2';
      return val.trim();
    };

    const m = opis.match(/Satnica:\s*(\d+(?:[.,]\s*\d+)?)\s*(?:eur|€)?/i);
    if (m) {
      const v = m[1].replace(',', '.').replace(/\s+/g, '');
      if (v !== (plataMin ?? '')) {
        setValue('plataMin', v, { shouldDirty: true });
        setValue('isNegotiable', false, { shouldDirty: true });
      }
    }

    const locMatch = opis.match(/Mesto rada:\s*(.+?)(?:\n|$)/i);
    if (locMatch && locMatch[1].trim()) {
      const raw = locMatch[1].trim().toLowerCase().replace(/š/g, 's').replace(/đ/g, 'dj').replace(/č/g, 'c').replace(/ć/g, 'c').replace(/ž/g, 'z');
      for (const loc of LOCATIONS) {
        const n = loc.name.toLowerCase().replace(/š/g, 's').replace(/đ/g, 'dj').replace(/č/g, 'c').replace(/ć/g, 'c').replace(/ž/g, 'z');
        if (raw === loc.slug || raw === n) {
          setValue('location', loc.slug, { shouldDirty: true, shouldValidate: true });
          break;
        }
      }
    } else {
      const normalizedText = opis.toLowerCase().replace(/š/g, 's').replace(/đ/g, 'dj').replace(/č/g, 'c').replace(/ć/g, 'c').replace(/ž/g, 'z');
      let found = false;
      for (const loc of LOCATIONS) {
        if (found) break;
        const n = loc.name.toLowerCase().replace(/š/g, 's').replace(/đ/g, 'dj').replace(/č/g, 'c').replace(/ć/g, 'c').replace(/ž/g, 'z');
        const declensions = [n, n + 'u'];
        for (const variant of declensions) {
          const idx = normalizedText.indexOf(variant);
          if (idx !== -1) {
            const before = normalizedText[idx - 1] || '';
            const after = normalizedText[idx + variant.length] || '';
            if (!before.match(/[a-z0-9]/) && !after.match(/[a-z0-9]/)) {
              setValue('location', loc.slug, { shouldDirty: true, shouldValidate: true });
              found = true;
              break;
            }
          }
        }
      }
    }

    const isplataMatch = opis.match(/Isplata:\s*(.+?)(?:\n|$)/i);
    if (isplataMatch && isplataMatch[1].trim()) {
      const slug = mapPaymentDynamics(isplataMatch[1].trim());
      if (slug) {
        setValue('dinamikaIsplate', slug, { shouldDirty: true });
      }
    }

    const currentBenefits = new Set<string>((getValues('benefits') as string[]) || []);
    let changed = false;

    const benefitRules: { regex: RegExp; slug: string }[] = [
      { regex: /Smeštaj:\s*(da|ne|dostupan|nije)/i, slug: 'smestaj' },
      { regex: /Prevoz:\s*(da|ne|dostupan|nije)/i, slug: 'prevoz' },
      { regex: /Hrana:\s*(da|ne|dostupan|nije)/i, slug: 'topli-obrok' },
    ];

    for (const { regex, slug } of benefitRules) {
      const bm = opis.match(regex);
      if (bm) {
        const v = bm[1].toLowerCase();
        if (v === 'da' || v === 'dostupan') {
          if (!currentBenefits.has(slug)) {
            currentBenefits.add(slug);
            changed = true;
          }
        } else if (v === 'ne' || v === 'nije') {
          if (currentBenefits.has(slug)) {
            currentBenefits.delete(slug);
            changed = true;
          }
        }
      }
    }

    if (changed) {
      setValue('benefits', Array.from(currentBenefits), { shouldDirty: true });
    }
  }, [opis, selectedCategory, setValue, plataMin, getValues]);

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
