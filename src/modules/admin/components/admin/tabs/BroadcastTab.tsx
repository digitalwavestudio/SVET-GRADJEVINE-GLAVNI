import { useState } from 'react';
import { motion } from 'motion/react';
import { useAdminBroadcast, BroadcastCampaign } from '@/src/modules/admin/hooks/useAdminBroadcast';
import { toast } from 'react-hot-toast';

export function BroadcastTab() {
  const { broadcasts, isLoading, sendBroadcastMutation } = useAdminBroadcast();
  
  const [audience, setAudience] = useState<string>('all_active');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  const validate = () => {
    const newErrors: { title?: string; body?: string } = {};
    if (title.trim().length < 5) {
      newErrors.title = "Naslov mora imati najmanje 5 karaktera.";
    }
    if (body.trim().length < 10) {
      newErrors.body = "Telo poruke mora imati najmanje 10 karaktera.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = () => {
    if (!validate()) return;

    sendBroadcastMutation.mutate(
      { audience, title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setErrors({});
        }
      }
    );
  };

  const isSending = sendBroadcastMutation.isPending;

  const audienceLabel = (aud: string) => {
    switch (aud) {
      case 'all_active': return 'Svi Aktivni Korisnici';
      case 'verified_companies': return 'Samo Verifikovane Firme';
      case 'premium': return 'Samo Premium Korisnici';
      default: return 'Selektovana Grupa';
    }
  };

  return (
    <motion.div 
       key="broadcast"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -20 }}
       className="space-y-8"
    >
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Composer */}
          <div className="bg-[#0A0F14] border border-blue-500/20 rounded-[10px] p-10 relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full"></div>
             <div className="relative z-10 flex-grow">
                <h3 className="text-[12px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                   <span className="material-symbols-outlined animate-pulse">campaign</span>
                   BROADCAST KREATOR
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8 leading-relaxed">
                   Slanje masovnih notifikacija i sistemskih obaveštenja selektovanim grupama korisnika u realnom vremenu.
                </p>
                
                <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">CILJNA GRUPA (AUDIENCE)</label>
                       <select 
                         value={audience}
                         onChange={(e) => setAudience(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-[10px] py-4 px-5 text-xs font-black text-white uppercase tracking-widest focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                       >
                          <option value="all_active" className="bg-slate-900">Svi Aktivni Korisnici</option>
                          <option value="verified_companies" className="bg-slate-900">Samo Verifikovane Firme</option>
                          <option value="premium" className="bg-slate-900">Samo Premium Korisnici</option>
                       </select>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">NASLOV PORUKE</label>
                       <input 
                         aria-label="Naslov" 
                         type="text" 
                         value={title}
                         onChange={(e) => setTitle(e.target.value)}
                         placeholder="Naslov obaveštenja koji će korisnici videti..." 
                         className={`w-full bg-white/5 border ${errors.title ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'} rounded-[10px] py-4 px-5 text-sm font-black text-white focus:outline-none transition-all`} 
                       />
                       {errors.title && <p className="text-red-500 text-[10px] uppercase font-black tracking-widest mt-1 pl-1">{errors.title}</p>}
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2 pl-1">SADRŽAJ PORUKE (PODRŽAVA MARKDOWN / LINKOVE)</label>
                       <textarea 
                         aria-label="Sadržaj"
                         placeholder="Unesite detaljno obaveštenje za korisnike..." 
                         value={body}
                         onChange={(e) => setBody(e.target.value)}
                         className={`w-full bg-white/5 border ${errors.body ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'} rounded-[10px] py-4 px-5 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none transition-all resize-none h-44`}
                       />
                       {errors.body && <p className="text-red-500 text-[10px] uppercase font-black tracking-widest mt-1 pl-1">{errors.body}</p>}
                    </div>
                </div>
             </div>
             
             <button 
               onClick={handleSend}
               disabled={isSending}
               className="w-full mt-8 bg-blue-500 text-slate-950 font-black py-5 rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-white disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer"
             >
                <span className="material-symbols-outlined text-lg">{isSending ? 'hourglass_empty' : 'rocket_launch'}</span>
                {isSending ? 'SLANJE U TOKU...' : 'POŠALJI BROADCAST'}
             </button>
          </div>

          {/* History */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 flex flex-col justify-between min-h-[500px]">
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8">ISTORIJA KAMPANJA</h3>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                   {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                         <div key={i} className="animate-pulse bg-white/[0.01] border border-white/5 rounded-[10px] p-6 space-y-4">
                            <div className="h-4 bg-white/10 rounded w-2/3"></div>
                            <div className="h-3 bg-white/5 rounded w-1/3"></div>
                            <div className="pt-4 border-t border-white/5 flex justify-between">
                               <div className="h-6 bg-white/5 rounded w-16"></div>
                               <div className="h-6 bg-white/5 rounded w-16"></div>
                            </div>
                         </div>
                      ))
                   ) : broadcasts.length > 0 ? (
                      broadcasts.map((campaign: BroadcastCampaign) => (
                         <div key={campaign.id} className="bg-white/[0.02] border border-white/5 rounded-[10px] p-6 group hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <h4 className="text-sm font-black text-white uppercase tracking-tight max-w-[70%]">{campaign.title}</h4>
                               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{campaign.date}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                               <span className="text-[8px] font-black px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full uppercase tracking-widest">
                                  {audienceLabel(campaign.audience)}
                                </span>
                                <span className="text-[8px] font-black px-3 py-1 bg-green-500/10 text-green-400 rounded-full uppercase tracking-widest">
                                  {campaign.status}
                               </span>
                            </div>
                            
                            <p className="text-xs text-white/60 mb-6 font-medium whitespace-pre-wrap line-clamp-3">
                              {campaign.body}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <div>
                                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">ISPORUČENO NA</div>
                                  <div className="text-xs font-black text-white">{campaign.reach} <span className="text-white/40">KORISNIKA</span></div>
                               </div>
                               <div className="text-right">
                                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">PROČITANO</div>
                                  <div className="text-xs font-black text-blue-500">{campaign.opens}</div>
                                </div>
                            </div>
                         </div>
                      ))
                   ) : (
                      <div className="text-center py-16 text-white/20 text-[10px] font-black uppercase tracking-widest">
                         NEMA PRETHODNIH KAMPANJA
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </motion.div>
  );
}
