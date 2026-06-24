import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { getLazyAuth } from '@/src/lib/firebase';

interface PricingTier {
  standard: number;
  premium: number;
  urgent: number;
}

interface SettingsState {
  pricing: {
    jobs: PricingTier;
    accommodations: PricingTier;
    caterings: PricingTier;
    marketplace: PricingTier;
    machines: PricingTier;
    plots: PricingTier;
    professional_monthly: number;
  };
  limits: {
    free_listings_per_month: number;
    max_images_per_ad: number;
  };
  messages: {
    welcome_text: string;
    maintenance_mode: boolean;
  };
  globalRateLimit: number;
  initialCredits: number;
}

const DEFAULT_SETTINGS: SettingsState = {
  pricing: {
    jobs: { standard: 500, premium: 1000, urgent: 1500 },
    accommodations: { standard: 500, premium: 1000, urgent: 1500 },
    caterings: { standard: 500, premium: 1000, urgent: 1500 },
    marketplace: { standard: 500, premium: 1000, urgent: 1500 },
    machines: { standard: 500, premium: 1000, urgent: 1500 },
    plots: { standard: 500, premium: 1000, urgent: 1500 },
    professional_monthly: 6000
  },
  limits: { free_listings_per_month: 3, max_images_per_ad: 10 },
  messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false },
  globalRateLimit: 1000,
  initialCredits: 1500
};

export function GlobalSettingsTab() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await (await getLazyAuth()).currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings/global', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Map/Ensure correct new schema is present with fallbacks
      const mappedData: SettingsState = {
        pricing: {
          jobs: { standard: 500, premium: 1000, urgent: 1500, ...(data?.pricing?.jobs || {}) },
          accommodations: { standard: 500, premium: 1000, urgent: 1500, ...(data?.pricing?.accommodations || {}) },
          caterings: { standard: 500, premium: 1000, urgent: 1500, ...(data?.pricing?.caterings || {}) },
          marketplace: { standard: 500, premium: 1000, urgent: 1500, ...(data?.pricing?.marketplace || {}) },
          machines: { standard: 500, premium: 1000, urgent: 1500, ...(data?.pricing?.machines || {}) },
          plots: { standard: 500, premium: 1000, urgent: 1500, ...(data?.pricing?.plots || {}) },
          professional_monthly: data?.pricing?.professional_monthly !== undefined ? data.pricing.professional_monthly : 6000
        },
        limits: {
          free_listings_per_month: data?.limits?.free_listings_per_month !== undefined ? data.limits.free_listings_per_month : 3,
          max_images_per_ad: data?.limits?.max_images_per_ad !== undefined ? data.limits.max_images_per_ad : 10
        },
        messages: {
          welcome_text: data?.messages?.welcome_text || 'Dobrodošli na Svet Građevine',
          maintenance_mode: !!data?.messages?.maintenance_mode
        },
        globalRateLimit: data?.globalRateLimit ?? 1000,
        initialCredits: data?.initialCredits !== undefined ? data.initialCredits : 1500
      };
      setSettings(mappedData);
    } catch (err) {
      console.error("Greška pri učitavanju podešavanja:", err);
      // Ako fetch padne, inicijalizuj sa default vrednostima da forma i dalje radi
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const token = await (await getLazyAuth()).currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings/global', {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ updates: settings })
      });
      if (res.ok) {
        toast.success("Podešavanja su sačuvana!");
        fetchSettings(); // Osveži podatke sa servera posle uspešnog čuvanja
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `Greška na serveru (${res.status})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri čuvanju";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePricingChange = (category: keyof Omit<SettingsState['pricing'], 'professional_monthly'>, tier: keyof PricingTier, value: number) => {
     if (!settings) return;
     setSettings({
        ...settings,
        pricing: {
           ...settings.pricing,
           [category]: {
              ...settings.pricing[category],
              [tier]: value
           }
        }
     });
  };

  if (loading) return <div className="p-20 text-center uppercase font-black text-white/20">Učitavanje podešavanja...</div>;
  if (!settings) return null;

  const categories = [
    { key: 'jobs' as const, label: 'Poslovi' },
    { key: 'accommodations' as const, label: 'Smeštaj' },
    { key: 'caterings' as const, label: 'Ketering' },
    { key: 'marketplace' as const, label: 'Alat i Oprema (Marketplace)' },
    { key: 'machines' as const, label: 'Građevinske Mašine' },
    { key: 'plots' as const, label: 'Placevi' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Globalna Podešavanja</h2>
           <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">KONFIGURACIJA CENA U SG KREDITIMA I SISTEMSKIH PARAMETARA</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-4 bg-secondary !text-black font-black rounded-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'ČUVANJE...' : 'SAČUVAJ IZMENE'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Pricing (Spans 2 columns on large screens) */}
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
             <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-secondary">payments</span>
                <h3 className="text-sm font-black uppercase tracking-widest">MONETIZACIJA I KATEGORIJE (CENE U SG KREDITIMA)</h3>
             </div>
             
             <div className="space-y-8 divide-y divide-white/5">
                {categories.map((cat, idx) => (
                  <div key={cat.key} className={idx > 0 ? "pt-8" : ""}>
                     <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">{cat.label}</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                           <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 pl-2">Standardni oglas</label>
                           <input 
                              type="number"
                              value={settings.pricing[cat.key]?.standard || 0}
                              onChange={(e) => handlePricingChange(cat.key, 'standard', Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                           />
                        </div>
                        <div>
                           <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 pl-2">Premium oglas</label>
                           <input 
                              type="number"
                              value={settings.pricing[cat.key]?.premium || 0}
                              onChange={(e) => handlePricingChange(cat.key, 'premium', Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                           />
                        </div>
                        <div>
                           <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 pl-2">Hitan oglas</label>
                           <input 
                              type="number"
                              value={settings.pricing[cat.key]?.urgent || 0}
                              onChange={(e) => handlePricingChange(cat.key, 'urgent', Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                           />
                        </div>
                     </div>
                  </div>
                ))}

                <div className="pt-8">
                   <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">Premium Partner (Građevinske Firme)</h4>
                   <p className="text-[10px] text-white/40 mb-4 font-bold uppercase">Godišnja pretplata za firme (dodeljuje zlatni bedž - Premium Partner)</p>
                   <div className="w-full md:w-1/3">
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 pl-2">Cena u RSD (Godišnje)</label>
                      <input 
                         type="number"
                         value={settings.pricing.professional_monthly}
                         onChange={(e) => setSettings({
                            ...settings,
                            pricing: {
                               ...settings.pricing,
                               professional_monthly: Number(e.target.value)
                            }
                         })}
                         className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                      />
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Right Side: Limits, Messages, Initial Credits */}
        <div className="space-y-8">
          <section className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 space-y-8">
             <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-blue-500">settings_suggest</span>
                <h3 className="text-sm font-black uppercase tracking-widest">LIMITACIJE I POČETNI KREDITI</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">Početni gratis SG Krediti (Registracija)</label>
                   <input 
                       type="number"
                       value={settings.initialCredits || 0}
                       onChange={(e) => setSettings({
                         ...settings,
                         initialCredits: Number(e.target.value)
                       })}
                       className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black outline-none focus:border-secondary transition-all"
                   />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 pl-2">Maksimalan broj slika po oglasu</label>
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
                       value={settings.globalRateLimit ?? 1000}
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
                <h3 className="text-sm font-black uppercase tracking-widest">SISTEMSKE PORUKE</h3>
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
