import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { ACCESS_ROAD_TYPES } from '@/src/constants/taxonomy';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';
import { Textarea } from '@/src/components/ui/form/Textarea';

export function Step2Plot({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
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
        <h3 className="text-sm font-black uppercase text-secondary mb-6 flex items-center gap-2">
           <span className="material-symbols-outlined">aspect_ratio</span> Površina i cena
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="grid grid-cols-[2fr_1fr] gap-3 items-end">
            <Input
              name="plotArea"
              type="number"
              label="Površina"
              required
              placeholder="Npr. 15"
            />
            <Select
              name="plotAreaUnit"
              label="Jedinica"
              options={[
                { value: 'ari', label: 'Ari' },
                { value: 'ha', label: 'Ha' }
              ]}
              placeholder="Jedinica"
            />
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                name="plotPrice"
                type="number"
                label="Cena (Opciono)"
                placeholder="Prazno za dogovor"
              />
            </div>
            <div className="bg-white/10 rounded-[10px] px-6 h-[68px] flex items-center justify-center font-black text-white/40 text-xs mt-auto">EUR</div>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">settings_input_component</span> Infrastruktura
        </h3>
        <div className="space-y-3 mb-8">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Komunalna opremljenost</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.keys(watch('plotInfrastructure') || {}).map(inf => (
              <label 
                key={inf} 
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-[10px] border-2 cursor-pointer transition-all duration-300 ${watch('plotInfrastructure')?.[inf] ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
              >
                <input 
                  type="checkbox" 
                  checked={!!watch('plotInfrastructure')?.[inf]}
                  onChange={() => {
                    const current = watch('plotInfrastructure') || {};
                    setValue('plotInfrastructure', { ...current, [inf]: !current[inf] });
                  }}
                  className="hidden" 
                />
                <span className={`material-symbols-outlined text-2xl ${watch('plotInfrastructure')?.[inf] ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {inf === 'struja' ? 'bolt' : inf === 'voda' ? 'water_drop' : inf === 'kanalizacija' ? 'waves' : inf === 'gas' ? 'mode_fan' : 'wifi'}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-widest text-center ${watch('plotInfrastructure')?.[inf] ? 'text-white' : 'text-on-surface-variant'}`}>
                  {inf}
                </span>
              </label>
            ))}
          </div>
        </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { key: 'plotHeating', label: 'Grejanje / Daljinsko', icon: 'heat' },
              { key: 'plotTelephone', label: 'Telekomunikacije', icon: 'call' },
              { key: 'plotTechnicalWater', label: 'Tehnička voda', icon: 'water_damage' },
              { key: 'plotDrinkingWater', label: 'Pijaća voda', icon: 'water_drop' },
              { key: 'plotGreenEnergySuitable', label: 'Solarni potencijal', icon: 'solar_power' },
            ].map((item: { key: string; label: string; icon: string }) => (
              <label 
                key={item.key} 
                className={`flex justify-start items-center gap-3 p-4 rounded-[10px] border-2 cursor-pointer transition-all duration-300 ${watch(item.key as any) ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
              >
                <input 
                  type="checkbox" 
                  checked={!!watch(item.key as any)}
                  onChange={(e) => setValue(item.key as any, e.target.checked)}
                  className="hidden" 
                />
                <span className={`material-symbols-outlined text-xl ${watch(item.key as any) ? 'text-secondary' : 'text-on-surface-variant'}`}>{item.icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest leading-tight ${watch(item.key as any) ? 'text-white' : 'text-on-surface-variant'}`}>{item.label}</span>
              </label>
            ))}
          </div>

        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">architecture</span> Namena i urbanizam
        </h3>
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              name="plotPlannedPurpose"
              type="text"
              label="Planirana namena"
              placeholder="Npr. Privredna zona"
            />
            <Input
              name="plotBuildingHeight"
              type="number"
              label="Maks. visina objekta (m)"
              placeholder="Npr. 12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              name="plotOccupancy"
              type="number"
              label="Zauzetost (%)"
              placeholder="Npr. 40"
            />
            <Input
              name="plotBuildabilityIndex"
              type="number"
              step="0.1"
              label="Indeks izgrađenosti"
              placeholder="Npr. 1.2"
            />
            <Input
              name="plotMaxFloors"
              type="number"
              label="Maks. spratnost"
              placeholder="Npr. 3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              name="plotParkingStandard"
              type="text"
              label="Parking standard (poslovni)"
              placeholder="Npr. 1 mesto na 50m2"
            />
            <Input
              name="plotProductionParkingStandard"
              type="text"
              label="Parking standard (proizvodnja)"
              placeholder="Npr. 1 mesto na 2 zaposlena"
            />
          </div>
        </div>

        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">map</span> Katastar i lokalni podaci
        </h3>
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              name="plotCadastralNumber"
              type="text"
              label="Katastarski broj parcele"
              placeholder="Npr. 1234/5"
            />
            <Input
              name="plotCadastralMunicipality"
              type="text"
              label="Katastarska opština"
              placeholder="Npr. Zemun"
            />
          </div>
        </div>

        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">real_estate_agent</span> Pristup i lokacija
        </h3>
        <div className="space-y-3 mb-6">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Prilazni put *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACCESS_ROAD_TYPES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setValue('plotAccessRoad', r.id)}
                className={`py-4 rounded-[10px] border-2 transition-all font-black uppercase tracking-widest text-[10px] ${watch('plotAccessRoad') === r.id ? 'bg-secondary border-secondary !text-black' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/10'}`}
              >
                {r.name.split(' (')[0]}
              </button>
            ))}
          </div>
          {errors.plotAccessRoad && <p className="text-error text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.plotAccessRoad?.message as string}</p>}
        </div>
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { key: 'plotRailAccess', label: 'Železnički pristup', icon: 'train' },
              { key: 'plotHighwayAccess', label: 'Pristup autoputu', icon: 'add_road' },
              { key: 'plotAirportAccess', label: 'Blizina aerodroma', icon: 'flight_takeoff' },
              { key: 'plotFreeZone', label: 'Slobodna zona', icon: 'account_balance' },
            ].map(item => (
              <label 
                key={item.key} 
                className={`flex justify-start items-center gap-3 p-4 rounded-[10px] border-2 cursor-pointer transition-all duration-300 ${watch(item.key as any) ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
              >
                <input 
                  type="checkbox" 
                  {...register(item.key as any)}
                  className="hidden" 
                />
                <span className={`material-symbols-outlined text-xl ${watch(item.key as any) ? 'text-secondary' : 'text-on-surface-variant'}`}>{item.icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest leading-tight ${watch(item.key as any) ? 'text-white' : 'text-on-surface-variant'}`}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">monitor_heart</span> Ekonomski i lokalni podaci
        </h3>
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              name="plotMunicipalityName"
              type="text"
              label="Lokalna samouprava / Opština"
              placeholder="Npr. Grad Beograd"
            />
            <Input
              name="plotAverageSalary"
              type="number"
              label="Prosek plate u opštini (RSD)"
              placeholder="Npr. 95000"
            />
            <Input
              name="plotDevelopmentFeeBusiness"
              type="text"
              label="Naknada za uređivanje (poslovni) RSD/m2"
              placeholder="Npr. 5500"
            />
            <Input
              name="plotMarketValueEstimate"
              type="text"
              label="Tržišna procena vrednosti (EUR/m2)"
              placeholder="Npr. 120"
            />
          </div>
        </div>

        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">description</span> Dokumentacija i linkovi (Maks. 3)
        </h3>
        <div className="space-y-6 mb-8">
          <div className="space-y-4">
            {(watch('plotDocs') as { label: string; url: string }[] || []).map((doc, idx: number) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-6 rounded-[10px] border border-white/5 relative group transition-all hover:bg-white/[0.04]">
                <div className="space-y-2">
                   <label className="block text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Naziv dokumenta</label>
                   <input 
                    type="text"
                    placeholder="Npr. Informacija o lokaciji"
                    value={doc.label}
                    onChange={(e) => {
                        const newDocs = [...(watch('plotDocs') as { label: string; url: string }[])];
                        newDocs[idx].label = e.target.value;
                        setValue('plotDocs', newDocs);
                    }}
                    className="w-full bg-white/5 border border-white/5 rounded-[10px] px-4 py-3 text-white text-sm outline-none focus:border-secondary/30"
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Link (URL)</label>
                   <input 
                    type="text"
                    placeholder="https://..."
                    value={doc.url}
                    onChange={(e) => {
                        const newDocs = [...(watch('plotDocs') as { label: string; url: string }[])];
                        newDocs[idx].url = e.target.value;
                        setValue('plotDocs', newDocs);
                    }}
                    className="w-full bg-white/5 border border-white/5 rounded-[10px] px-4 py-3 text-white text-sm outline-none focus:border-secondary/30"
                   />
                </div>
                {(watch('plotDocs') as any[] || []).length > 1 && (
                  <button 
                    type="button"
                    onClick={() => setValue('plotDocs', (watch('plotDocs') as any[]).filter((_, i: number) => i !== idx))}
                    className="absolute -right-3 -top-3 w-8 h-8 bg-surface-container-highest border border-error/30 text-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>
            ))}
            {(watch('plotDocs') || []).length < 3 && (
              <button 
                type="button"
                onClick={() => setValue('plotDocs', [...(watch('plotDocs') || []), { label: '', url: '' }])}
                className="bg-white/5 text-secondary px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all border border-secondary/20"
              >
                <span className="material-symbols-outlined text-sm">add_link</span>
                Dodaj još jedan link
              </button>
            )}
          </div>
        </div>

        <h3 className="text-sm font-black uppercase text-secondary mb-6 mt-10 flex items-center gap-2">
           <span className="material-symbols-outlined">notes</span> Kontakt i napomene
        </h3>
        <div className="space-y-3">
          <Textarea
            name="plotNotes"
            label="Dodatne napomene za investitore"
            rows={4}
            placeholder="Unesite dodatne bitne podatke o lokaciji, uslove prodaje, vlasništvo, izvedene studije..."
          />
        </div>
      </div>
      
      <div className="mt-16 flex flex-col-reverse md:flex-row justify-between gap-4">
        <button type="button" onClick={prevStep} className={UI_TOKENS.BTN_SECONDARY}>Nazad</button>
        <button type="button" onClick={nextStep} className={UI_TOKENS.BTN_POST_AD}>Sledeći korak</button>
      </div>
    </motion.div>
  );
}
