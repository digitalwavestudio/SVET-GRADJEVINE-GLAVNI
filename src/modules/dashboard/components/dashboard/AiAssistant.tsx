import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { processAiCommand } from '@/src/lib/aiService';
import { useDashboardMetrics } from '@/src/modules/dashboard/hooks/useDashboardStats';

interface AiAssistantProps {
  user: any;
}

export default function AiAssistant({ user }: AiAssistantProps) {
  const { data } = useDashboardMetrics();
  const roleData = (data as any as {
    pendingApplications?: number;
    totalAds?: number;
    recentApplications?: any[];
    recentAds?: any[];
  }) || {};
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<{ id: number; type: string; label: string; msg: string; time: string; }[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const logs = [];
    const nowHours = new Date().getHours();
    const timeStr = `${nowHours.toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;

    if (roleData?.pendingApplications && roleData.pendingApplications > 0 && user.role === 'poslodavac') {
        logs.push({ id: 1, type: 'warning', label: 'PRIJAVE', msg: `Imate ${roleData.pendingApplications} neobrađenih prijava. Preporučujemo da odgovorite kandidatima što pre kako biste osigurali najbolje radnike.`, time: timeStr });
    }
    if (roleData?.totalAds && roleData.totalAds > 5 && user.role === 'poslodavac') {
        logs.push({ id: 2, type: 'info', label: 'OGLASI', msg: `Trenutno imate ${roleData.totalAds} aktivnih oglasa. Razmislite o osvežavanju naslova kako bi privukli više pažnje.`, time: timeStr });
    }
    if (user.role === 'majstor' && (!roleData?.recentApplications || roleData.recentApplications.length === 0)) {
        logs.push({ id: 3, type: 'warning', label: 'TRŽIŠTE', msg: `Još uvek niste poslali prijavu za poslove. Aktivni oglasi se redovno ažuriraju, preporučujemo da pogledate novu ponudu.`, time: timeStr });
    }
    if ((roleData.recentAds && roleData.recentAds.length > 0) || (roleData.recentApplications && roleData.recentApplications.length > 0)) {
        logs.push({ id: 4, type: 'success', label: 'STATUS', msg: `Vaš profil je aktivan i vidljiv na platformi. Sve usluge funkcionišu besprekorno.`, time: timeStr });
    }
    if (logs.length === 0) {
        logs.push({ id: 5, type: 'info', label: 'DOBRODOŠLI', msg: `Dobrodošli na vašu kontrolnu tablu. Ovde možete pratiti analitiku poseta, upravljati svojim oglasima i dobiti pametne uvide o poslovanju. Kako vam mogu pomoći danas?`, time: timeStr });
    }
    setAiLogs(logs.slice(0, 4));
  }, [roleData, user]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setIsAiProcessing(true);
    try {
        const responseText = await processAiCommand(aiInput, { userRole: user?.role, name: user?.name || user?.firstName });
        setAiLogs(prev => [...prev, {
            id: Date.now(),
            type: 'info',
            label: 'AI ODGOVOR',
            msg: responseText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setAiInput('');
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
        setAiLogs(prev => [...prev, {
            id: Date.now(),
            type: 'error',
            label: 'GREŠKA',
            msg: 'Došlo je do greške prilikom komuniciranja sa AI.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    } finally {
        setIsAiProcessing(false);
    }
  };

  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden flex flex-col h-[500px]">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">AI ASISTENT</h3>
            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">INTERAKTIVNI POSLOVNI ASISTENT</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
        <AnimatePresence initial={false}>
          {aiLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4 group"
            >
              <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                log.type === 'warning' ? 'bg-[#ffad3a] shadow-[0_0_10px_rgba(255,173,58,0.5)]' :
                log.type === 'error' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                log.type === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse'
              }`} />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">[{log.label}]</span>
                  <span className="text-[10px] font-black text-white/20">{log.time}</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest leading-relaxed">{log.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <form onSubmit={handleAiSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="PITAJTE AI ASISTENTA NEŠTO..."
            className="w-full bg-[#0A0F14] border border-white/10 rounded-[10px] py-4 pl-6 pr-16 text-xs text-white placeholder-white/20 font-black tracking-widest uppercase focus:outline-none focus:border-secondary transition-colors"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            disabled={isAiProcessing}
          />
          <button
            type="submit"
            disabled={!aiInput.trim() || isAiProcessing}
            className="absolute right-2 w-10 h-10 bg-secondary rounded-[10px] flex items-center justify-center !text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
          >
            {isAiProcessing ? (
               <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
               <span className="material-symbols-outlined text-sm">send</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
