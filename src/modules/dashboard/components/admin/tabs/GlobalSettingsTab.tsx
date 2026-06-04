import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useGlobalSettings, useUpdateGlobalSettings, SettingsState } from '@/src/modules/admin/hooks/useGlobalSettings';
import { Skeleton } from '@/src/components/ui/Skeleton';

export function GlobalSettingsTab() {
  const { data: serverSettings, isLoading } = useGlobalSettings();
  const updateSettingsMutation = useUpdateGlobalSettings();
  
  const [settings, setSettings] = useState<SettingsState | null>(null);

  useEffect(() => {
    if (serverSettings) {
      setSettings(serverSettings);
    }
  }, [serverSettings]);

  const handleSave = () => {
    if (!settings) return;
    updateSettingsMutation.mutate(settings, {
      onSuccess: () => {
        toast.success("Podešavanja su sačuvana!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || err.message || "Greška pri čuvanju");
      }
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-96 h-4" />
          </div>
          <Skeleton className="w-48 h-12 rounded-[10px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-48 h-5" />
            </div>
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="w-40 h-3" />
                  <Skeleton className="w-full h-12 rounded-[10px]" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="w-48 h-5" />
              </div>
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-40 h-3" />
                    <Skeleton className="w-full h-12 rounded-[10px]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="w-48 h-5" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-[10px] border border-white/10">
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-3" />
                    <Skeleton className="w-48 h-2" />
                  </div>
                  <Skeleton className="w-12 h-6 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="w-full h-24 rounded-[10px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const saving = updateSettingsMutation.isPending;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Globalna Podešavanja</h2>
           <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">KONFIGURACIJA CENA, LIMITA I SISTEMSKIH PARAMETARA</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-4 bg-secondary text-slate-950 font-black rounded-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'ČUVANJE...' : 'SAČUVAJ IZMENE'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pricing Section */}
        <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
           <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-secondary">payments</span>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">MONETIZACIJA (RSD)</h3>
           </div>
           
           <div className="grid grid-cols-1 gap-6">
              {[
                { key: 'job_standard', label: 'Standardni Oglas (Posao)' },
                { key: 'job_premium', label: 'Premium Oglas (Posao)' },
                { key: 'machine_premium', label: 'Premium Oglas (Mašine)' },
                { key: 'real_estate_premium', label: 'Premium Oglas (Nekretnine)' },
                { key: 'professional_monthly', label: 'Mesečna Pretplata (Majstori)' }
              ].map(item => (
                <div key={item.key}>
                   <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">{item.label}</label>
                   <input 
                      type="number"
                      value={(settings.pricing as any)[item.key]}
                      onChange={(e) => setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, [item.key]: Number(e.target.value) }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                   />
                </div>
              ))}
           </div>
        </section>

        {/* Limits & Messages */}
        <div className="space-y-8">
          <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
             <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-blue-500">settings_suggest</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">LIMITACIJE SISTEMA</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">Besplatni Oglasi (Mesečno)</label>
                  <input 
                      type="number"
                      value={settings.limits.free_listings_per_month}
                      onChange={(e) => setSettings({
                        ...settings,
                        limits: { ...settings.limits, free_listings_per_month: Number(e.target.value) }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">Max Slika po Oglasu</label>
                  <input 
                      type="number"
                      value={settings.limits.max_images_per_ad}
                      onChange={(e) => setSettings({
                        ...settings,
                        limits: { ...settings.limits, max_images_per_ad: Number(e.target.value) }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">Globalni Rate Limit (Zahtevi/Min)</label>
                   <input 
                       type="number"
                       value={settings.globalRateLimit ?? 100}
                       onChange={(e) => setSettings({
                         ...settings,
                         globalRateLimit: Number(e.target.value)
                       })}
                       className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                   />
                </div>
             </div>
          </section>

          <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
             <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-amber-500">warning</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">SISTEMSKE PORUKE</h3>
             </div>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-[10px] border border-white/10">
                   <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">Održavanje sistema</div>
                      <div className="text-[8px] font-bold text-white/20 uppercase">Gasi pristup sajtu za obične korisnike</div>
                   </div>
                   <button 
                    onClick={() => setSettings({
                      ...settings,
                      messages: { ...settings.messages, maintenance_mode: !settings.messages.maintenance_mode }
                    })}
                    className={`w-12 h-6 rounded-full relative transition-all ${settings.messages.maintenance_mode ? 'bg-red-500' : 'bg-white/10'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.messages.maintenance_mode ? 'right-1' : 'left-1'}`} />
                   </button>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">Naslovna (Welcome Text)</label>
                   <textarea 
                      value={settings.messages.welcome_text}
                      onChange={(e) => setSettings({
                        ...settings,
                        messages: { ...settings.messages, welcome_text: e.target.value }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-bold text-xs outline-none focus:border-secondary transition-all min-h-[100px]"
                   />
                </div>
             </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
