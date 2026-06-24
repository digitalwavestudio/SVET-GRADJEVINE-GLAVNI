import { motion } from 'motion/react';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MACHINE_CATEGORIES, MACHINE_SUBCATEGORIES } from '@/src/constants/machineTaxonomy';
import { TaxonomyItem, ACCOMMODATION_TYPES, KITCHEN_TYPES, LOCATIONS, PROFESSIONS, REAL_ESTATE_PURPOSES, SECTORS, MARKETPLACE_CATEGORIES } from '@/src/constants/taxonomy';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';
import { Textarea } from '@/src/components/ui/form/Textarea';
import { StepProps } from '@/src/modules/ads/components/post-ad/types';

export function Step1({
  setSelectedCategory,
  selectedCategory,
  nextStep,
}: {
  setSelectedCategory?: (c: string | null) => void;
  selectedCategory: string;
  nextStep?: () => void;
}) {
  const { watch, setValue, formState: { errors } } = useFormContext();
  
  const sector = watch('sector');
  const machCategory = watch('machCategory');
  const plotPurpose = watch('plotPurpose');

  const availableProfessions: TaxonomyItem[] = sector ? PROFESSIONS[sector] || [] : [];
  const availableSubcategories: TaxonomyItem[] = machCategory ? (MACHINE_SUBCATEGORIES[machCategory] || []) : [];

  return (
    <>
      {/* STEP 1 - Company */}
      {selectedCategory === 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">business_center</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Osnovne informacije o firmi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Input name="companyName" label="Naziv firme" placeholder="Npr. Građevinac DOO" required />
            <Input name="companyPIB" label="PIB / Matični broj" placeholder="Minimalno 8 cifara" required />
            
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

          <div className="flex justify-between mt-12">
            <button 
              type="button"
              onClick={() => setSelectedCategory?.(null)}
              className={UI_TOKENS.BTN_SECONDARY}
            >
              Nazad
            </button>
            <button type="button" onClick={nextStep} className={UI_TOKENS.BTN_POST_AD}>
              Nastavi dalje <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 1 - Generic Listings */}
      {selectedCategory !== 'company' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">
                {selectedCategory === 'accommodation' ? 'home' : 'search'}
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Osnovne informacije</h2>
          </div>
          
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

            {selectedCategory === 'job' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select 
                  name="sector" 
                  label="Sektor delatnosti" 
                  options={SECTORS.map(s => ({ value: s.slug, label: s.name }))} 
                  required 
                />
                <Select 
                  name="profession" 
                  label="Zanimanje / Pozicija" 
                  options={availableProfessions.map((p) => ({ value: p.slug, label: p.name }))} 
                  icon="engineering" 
                  disabled={!sector}
                  required 
                />
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

            <Select 
              name="location" 
              label="Izaberite grad" 
              options={LOCATIONS.map(l => ({ value: l.slug, label: l.name }))} 
              icon="location_on" 
              required 
            />

            <Input 
              name="tacnaLokacija" 
              label={selectedCategory === 'accommodation' ? 'Tačna adresa smeštaja' : 
                     selectedCategory === 'plot' ? 'Tačna lokacija placa (Naselje / Adresa)' :
                     'Tačna adresa / Lokacija'}
              placeholder="Unesite adresu ili naselje"
              icon="map"
              description="Precizna lokacija nam pomaže da automatski generišemo mapu gradilišta, što radnicima olakšava dolazak do vašeg smeštaja bez lutanja."
            />
          </div>

          <div className="mt-16 flex justify-between">
            <button 
              type="button"
              onClick={() => setSelectedCategory?.(null)}
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
      )}
    </>
  );
}
