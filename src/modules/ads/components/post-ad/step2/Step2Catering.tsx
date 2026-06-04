import React from 'react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { Input } from '@/src/components/ui/form/Input';
import { Textarea } from '@/src/components/ui/form/Textarea';

export function Step2Catering({ nextStep, prevStep }: { nextStep?: () => void; prevStep?: () => void }) {
  const { watch, setValue } = useFormContext();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center border border-secondary/20">
          <span className="material-symbols-outlined text-secondary">payments</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight font-headline">Uslovi i Benefiti</h2>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Input
             name="catMinOrder"
             type="number"
             label="Min. narudžbina (obroka)"
             required
             icon="production_quantity_limits"
             placeholder="Npr. 15"
           />
           <Input
             name="catPricePerMeal"
             type="number"
             label="Cena po obroku (od)"
             required
             icon="payments"
             placeholder="Iznos u EUR/RSD"
           />
           <Input
             name="catDeliveryZone"
             type="text"
             label="Zona dostave"
             required
             icon="local_shipping"
             placeholder="Npr. Ceo Beograd, Do 20km..."
           />
        </div>

        {/* Catering B2B Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-secondary tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined">business_center</span> Poslovni uslovi i Kapacitet
            </h3>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setValue('catInvoiceAvailable', !watch('catInvoiceAvailable'))}
                className={`w-full py-4 rounded-[10px] border-2 flex items-center justify-center gap-3 transition-all ${watch('catInvoiceAvailable') ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
              >
                <span className="material-symbols-outlined text-xl">receipt_long</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Plaćanje preko računa (Faktura)</span>
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="catDailyCapacityMeals"
                  type="number"
                  label="Max obroka dnevno"
                  placeholder="Npr. 500"
                />
                <Input
                  name="catContactPhone"
                  type="text"
                  label="Telefon za kontakt"
                  placeholder="Npr. +381..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-secondary tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined">verified</span> Standardi i Pakovanje
            </h3>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setValue('catHaccpCertified', !watch('catHaccpCertified'))}
                className={`w-full py-4 rounded-[10px] border-2 flex items-center justify-center gap-3 transition-all ${watch('catHaccpCertified') ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
              >
                <span className="material-symbols-outlined text-xl">health_and_safety</span>
                <span className="text-[10px] font-black uppercase tracking-widest">HACCP Sertifikovan</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('catPackagingIncluded', !watch('catPackagingIncluded'))}
                className={`w-full py-4 rounded-[10px] border-2 flex items-center justify-center gap-3 transition-all ${watch('catPackagingIncluded') ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-on-surface-variant hover:border-white/20'}`}
              >
                <span className="material-symbols-outlined text-xl">inventory_2</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Ambalaža i pribor u ceni obroka</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-8 border-t border-white/10 pt-8">
           <Textarea
             name="catMenuItems"
             label="Spisak jela iz menija (opciono)"
             rows={6}
             placeholder="Bečka šnicla sa krompirom&#10;Gulaš sa testeninom&#10;Pasulj sa kobasicom..."
             description="Unesite jela jedno ispod drugog (svako jelo u novom redu) kako bi kupci videli vašu ponudu."
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
