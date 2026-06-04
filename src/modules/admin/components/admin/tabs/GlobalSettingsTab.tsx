import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { auth } from '@/src/firebase';

interface SettingsState {
  pricing: {
    job_standard: number;
    job_premium: number;
    machine_premium: number;
    real_estate_premium: number;
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
}

export function GlobalSettingsTab() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings/global', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSettings(data || {
          pricing: { job_standard: 0, job_premium: 2500, machine_premium: 1500, real_estate_premium: 3000, professional_monthly: 5000 },
          limits: { free_listings_per_month: 3, max_images_per_ad: 10 },
          messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false }
      });
    } catch (err) {
      toast.error("Greška pri učitavanju podešavanja");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
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
      } else {
        throw new Error("Greška na serveru");
      }
    } catch (err) {
      toast.error("Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center uppercase font-black text-white/20">Učitavanje podešavanja...</div>;
  if (!settings) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Globalna Podešavanja</h2>
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
              <h3 className="text-sm font-black uppercase tracking-widest">MONETIZACIJA (RSD)</h3>
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
                <h3 className="text-sm font-black uppercase tracking-widest">LIMITACIJE SISTEMA</h3>
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
                       value={(settings as any).globalRateLimit || 100}
                       onChange={(e) => setSettings({
                         ...settings,
                         globalRateLimit: Number(e.target.value)
                       } as any)}
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
