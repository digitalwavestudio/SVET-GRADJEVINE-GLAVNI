import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import Tooltip from '@/src/components/ui/Tooltip';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { ACCOMMODATION_AMENITIES } from '@/src/constants/taxonomy';
import { Input } from '@/src/components/ui/form/Input';
import { Select } from '@/src/components/ui/form/Select';

export function Step2Accommodation({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
  const { watch, setValue, getValues } = useFormContext();
  const formData = watch();

  const handleAmenityToggle = (amenityId: string) => {
    const current = getValues('amenities') || [];
    const next = current.includes(amenityId)
      ? current.filter((a: string) => a !== amenityId)
      : [...current, amenityId];
    setValue('amenities', next);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
          <span className="material-symbols-outlined text-secondary">meeting_room</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Kapacitet i Cena</h2>
      </div>
      
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Input
             name="totalBeds"
             type="number"
             label="Ukupno kreveta"
             required
             icon="bed"
             placeholder="Npr. 20"
             description="Maksimalni broj kreveta u celom objektu."
           />

           <Input
             name="availableBeds"
             type="number"
             label="Trenutno slobodno"
             icon="check_circle"
             placeholder="Ostavite prazno ako je sve slobodno"
           />
        </div>

        <div className="grid grid-cols-1 gap-8">
           <div className="grid grid-cols-2 gap-3 items-end">
             <Input
               name="price"
               type="number"
               label="Cena (EUR)"
               required
               placeholder="Iznos"
             />
             <Select
               name="priceType"
               label="Način obračuna"
               options={[
                 { value: 'perPerson', label: 'Po osobi' },
                 { value: 'total', label: 'Za ceo objekat' }
               ]}
               placeholder="Način obračuna"
             />
           </div>
        </div>

        <div className="space-y-5">
          <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Pogodnosti objekta</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ACCOMMODATION_AMENITIES.map(amenity => {
              const isChecked = (watch('amenities') || []).includes(amenity.slug);
              return (
                <label 
                  key={amenity.slug} 
                  className={`flex flex-col items-center justify-center gap-4 p-5 rounded-[12px] border cursor-pointer transition-all duration-500 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.15)] ${
                    isChecked 
                      ? 'border-secondary bg-secondary/[0.08] shadow-[0_0_25px_rgba(254,191,13,0.15)] scale-[1.03]' 
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => handleAmenityToggle(amenity.slug)}
                    className="hidden" 
                  />
                  <span className={`material-symbols-outlined text-2xl transition-all duration-300 ${
                    isChecked ? 'text-secondary drop-shadow-[0_0_8px_rgba(254,191,13,0.6)] scale-110' : 'text-white/40'
                  }`}>
                    {amenity.slug === 'parking-kamion' ? 'local_shipping' : 
                     amenity.slug === 'parking-bager' ? 'construction' : 
                     amenity.slug === 'klima' ? 'ac_unit' :
                     amenity.slug === 'wifi' ? 'wifi' : 
                     amenity.slug === 'ves-masina' ? 'local_laundry_service' : 
                     amenity.slug === 'kuhinja' ? 'restaurant' : 'check_circle'}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight transition-all duration-300 ${
                    isChecked ? 'text-white [text-shadow:0_0_10px_rgba(255,255,255,0.2)]' : 'text-white/50'
                  }`}>
                    {amenity.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-secondary tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined">location_on</span> Lokacija i pristup
            </h3>
            <div className="space-y-4">
              <Input
                name="accDistanceToSiteKm"
                type="number"
                label="Udaljenost do najbližeg gradilišta (km)"
                placeholder="Npr. 5"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue('accParkingAvailable', !watch('accParkingAvailable'))}
                  className={`py-4 rounded-[10px] border flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                    watch('accParkingAvailable') 
                      ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">local_parking</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Parking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('accTruckAccess', !watch('accTruckAccess'))}
                  className={`py-4 rounded-[10px] border flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                    watch('accTruckAccess') 
                      ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">fire_truck</span>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Put za kamion</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-secondary tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined">business_center</span> Poslovni uslovi
            </h3>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setValue('accInvoiceAvailable', !watch('accInvoiceAvailable'))}
                className={`w-full py-4 rounded-[10px] border flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                  watch('accInvoiceAvailable') 
                    ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-xl">receipt_long</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Plaćanje preko računa (Faktura)</span>
              </button>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="accMinStayDays"
                  type="number"
                  label="Min. dana boravka"
                  placeholder="Npr. 7"
                />
                <Input
                  name="accContactPhone"
                  type="text"
                  label="Telefon za kontakt"
                  placeholder="Npr. +381..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-10">
          <h3 className="text-xs font-black uppercase text-secondary tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined">checklist</span> Dodatne operativne pogodnosti
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setValue('accLaundryAvailable', !formData.accLaundryAvailable)}
              className={`py-6 rounded-[10px] border flex flex-col items-center gap-3 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                formData.accLaundryAvailable 
                  ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">local_laundry_service</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Veš mašina</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('accKitchenAvailable', !formData.accKitchenAvailable)}
              className={`py-6 rounded-[10px] border flex flex-col items-center gap-3 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                formData.accKitchenAvailable 
                  ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Kuhinja</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('accWifiAvailable', !formData.accWifiAvailable)}
              className={`py-6 rounded-[10px] border flex flex-col items-center gap-3 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                formData.accWifiAvailable 
                  ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">wifi</span>
              <span className="text-[10px] font-black uppercase tracking-widest">WiFi Internet</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('accAirConditioning', !formData.accAirConditioning)}
              className={`py-6 rounded-[10px] border flex flex-col items-center gap-3 transition-all duration-300 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md ${
                formData.accAirConditioning 
                  ? 'bg-secondary/[0.08] border-secondary text-white shadow-[0_0_20px_rgba(254,191,13,0.15)]' 
                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">airlight</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Klima</span>
            </button>
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
