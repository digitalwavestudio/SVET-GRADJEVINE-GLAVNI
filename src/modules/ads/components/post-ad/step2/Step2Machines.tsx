import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';
import { Textarea } from '@/src/components/ui/form/Textarea';

export function Step2Machines({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
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
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Tip oglasa *</label>
            <div className="flex bg-black/40 p-1 rounded-[10px] border border-white/5">
              <button
                type="button"
                onClick={() => setValue('machAdType', 'prodaja')}
                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 transition-all ${watch('machAdType') === 'prodaja' ? 'bg-secondary border-secondary text-slate-950 shadow-lg shadow-secondary/20 scale-[0.98]' : 'border-transparent text-white hover:bg-white/[0.02]'}`}
              >
                <span className="material-symbols-outlined text-2xl">sell</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Prodaja</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('machAdType', 'iznajmljivanje')}
                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 transition-all ${watch('machAdType') === 'iznajmljivanje' ? 'bg-secondary border-secondary text-slate-950 shadow-lg shadow-secondary/20 scale-[0.98]' : 'border-transparent text-white hover:bg-white/[0.02]'}`}
              >
                <span className="material-symbols-outlined text-2xl">calendar_clock</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Iznajmljivanje</span>
              </button>
            </div>
            {errors.machAdType && <p className="text-error text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.machAdType.message as string}</p>}
          </div>

          <div className="space-y-8">
            {watch('machAdType') === 'prodaja' && (
              <Input
                name="machPrice"
                type="number"
                label="Cena prodaje (EUR)"
                required
                icon="payments"
                placeholder="Iznos ili ostavite prazno za 'Na upit'"
              />
            )}

            {watch('machAdType') === 'iznajmljivanje' && (
              <Input
                name="machPricePerDay"
                type="number"
                label="Cena iznajmljivanja po danu (EUR)"
                required
                icon="calendar_month"
                placeholder="Iznos po danu"
              />
            )}
          </div>
        </div>

        <div className="space-y-5 mt-10">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1 text-center border-b border-white/10 pb-4">Tehničke specifikacije</label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Input name="machYear" type="number" label="Godina proiz." required placeholder="Npr. 2018" />
            <Input name="machHours" type="number" label="Radni sati" placeholder="Npr. 4500" />
            <Input name="machPower" type="text" label="Snaga motora" placeholder="Npr. 120kW" />
            <Input name="machWeight" type="text" label="Težina mašine" placeholder="Npr. 21t" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <Select
              name="machFuel"
              label="Tip pogona / Gorivo"
              icon="local_gas_station"
              options={[
                { value: 'dizel', label: 'Dizel' },
                { value: 'benzin', label: 'Benzin' },
                { value: 'struja', label: 'Električni' },
                { value: 'hibrid', label: 'Hibrid' }
              ]}
              placeholder="Izaberite tip pogona"
            />
            
            {watch('machAdType') === 'iznajmljivanje' && (
              <Select
                name="machOperator"
                label="Rukovalac mašinom"
                icon="person"
                options={[
                  { value: 'sa-rukovaocem', label: 'Izdaje se SA rukovaocem' },
                  { value: 'bez-rukovaoca', label: 'Izdaje se BEZ rukovaoca' }
                ]}
                placeholder="Da li se mašina izdaje sa rukovaocem?"
              />
            )}
          </div>
        </div>
        
        {/* Phase 2: Dimensions */}
        <div className="mt-12 pt-10 border-t border-white/5 space-y-8">
           <h3 className="text-sm font-black uppercase text-secondary flex items-center gap-2">
             <span className="material-symbols-outlined">straighten</span> Gabariti i težina
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Input name="machWeightKg" type="number" label="Težina (kg)" placeholder="Npr. 21000" />
             <Input name="machLengthMm" type="number" label="Dužina (mm)" placeholder="Npr. 9500" />
             <Input name="machWidthMm" type="number" label="Širina (mm)" placeholder="Npr. 2990" />
             <Input name="machHeightMm" type="number" label="Visina (mm)" placeholder="Npr. 3100" />
           </div>
        </div>

        {/* Phase 2: Capacity and Radni Parametri */}
        <div className="mt-12 pt-10 border-t border-white/5 space-y-8">
           <h3 className="text-sm font-black uppercase text-secondary flex items-center gap-2">
             <span className="material-symbols-outlined">settings_input_component</span> Kapacitet i radni parametri
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Input name="machLoadCapacityKg" type="number" label="Nosivost (kg)" placeholder="Npr. 5000" />
             <Input name="machBucketCapacityM3" type="number" step="0.1" label="Kapacitet kašike (m3)" placeholder="Npr. 1.2" />
             <Input name="machMaxDigDepthMm" type="number" label="Dubina kopanja (mm)" placeholder="Npr. 6500" />
             <Input name="machMaxReachMm" type="number" label="Max dohvat (mm)" placeholder="Npr. 9800" />
           </div>
        </div>

        {/* Phase 2: Service and Operativa */}
        <div className="mt-12 pt-10 border-t border-white/5 space-y-8">
           <h3 className="text-sm font-black uppercase text-secondary flex items-center gap-2">
             <span className="material-symbols-outlined">engineering</span> Operativne i servisne informacije
           </h3>
           <div className="space-y-6">
             <Textarea
               name="machServiceHistory"
               label="Istorija servisa i održavanja"
               placeholder="Navedite bitne servise, urađene remonte ili generalne popravke..."
             />
             
             <Input
               name="machVideoUrl"
               type="text"
               label="Video prikaz (YouTube/Vimeo link)"
               icon="play_circle"
               placeholder="https://www.youtube.com/watch?v=..."
             />
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

