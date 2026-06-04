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
            {ACCOMMODATION_AMENITIES.map(amenity => (
              <label 
                key={amenity.slug} 
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-[10px] border-2 cursor-pointer transition-all duration-300 ${(watch('amenities') || []).includes(amenity.slug) ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/5 scale-[1.02]' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
              >
                <input 
                  type="checkbox" 
                  checked={(watch('amenities') || []).includes(amenity.slug)}
                  onChange={() => handleAmenityToggle(amenity.slug)}
                  className="hidden" 
                />
                <span className={`material-symbols-outlined text-2xl transition-colors ${(watch('amenities') || []).includes(amenity.slug) ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {amenity.slug === 'parking-kamion' ? 'local_shipping' : 
                   amenity.slug === 'parking-bager' ? 'construction' : 
                   amenity.slug === 'klima' ? 'ac_unit' :
                   amenity.slug === 'wifi' ? 'wifi' : 
                   amenity.slug === 'ves-masina' ? 'local_laundry_service' : 
                   amenity.slug === 'kuhinja' ? 'restaurant' : 'check_circle'}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight transition-colors ${(watch('amenities') || []).includes(amenity.slug) ? 'text-white' : 'text-on-surface-variant'}`}>
                  {amenity.name}
                </span>
              </label>
            ))}
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
                  className={`py-4 rounded-[10px] border-2 flex items-center justify-center gap-2 transition-all ${watch('accParkingAvailable') ? 'bg-secondary/10 border-secondary text-secondary font-black' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
                >
                  <span className="material-symbols-outlined text-lg">local_parking</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Parking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('accTruckAccess', !watch('accTruckAccess'))}
                  className={`py-4 rounded-[10px] border-2 flex items-center justify-center gap-2 transition-all ${watch('accTruckAccess') ? 'bg-secondary/10 border-secondary text-secondary font-black' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
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
                className={`w-full py-4 rounded-[10px] border-2 flex items-center justify-center gap-3 transition-all ${watch('accInvoiceAvailable') ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
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
              className={`py-6 rounded-[10px] border-2 flex flex-col items-center gap-3 transition-all ${formData.accLaundryAvailable ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
            >
              <span className="material-symbols-outlined text-2xl">local_laundry_service</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Veš mašina</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('accKitchenAvailable', !formData.accKitchenAvailable)}
              className={`py-6 rounded-[10px] border-2 flex flex-col items-center gap-3 transition-all ${formData.accKitchenAvailable ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
            >
              <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Kuhinja</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('accWifiAvailable', !formData.accWifiAvailable)}
              className={`py-6 rounded-[10px] border-2 flex flex-col items-center gap-3 transition-all ${formData.accWifiAvailable ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
            >
              <span className="material-symbols-outlined text-2xl">wifi</span>
              <span className="text-[10px] font-black uppercase tracking-widest">WiFi Internet</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('accAirConditioning', !formData.accAirConditioning)}
              className={`py-6 rounded-[10px] border-2 flex flex-col items-center gap-3 transition-all ${formData.accAirConditioning ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
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
