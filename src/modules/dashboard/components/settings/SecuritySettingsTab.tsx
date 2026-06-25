import React from 'react';
import { motion } from 'motion/react';
import { Laptop, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/src/lib/apiClient';

const SessionManager = () => {
  const [sessions, setSessions] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await apiClient.get<Record<string, unknown>>('/auth/devices');
        if (Array.isArray(res.sessions)) setSessions(res.sessions as Record<string, unknown>[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const revokeOthers = async () => {
    try {
      await apiClient.post('/auth/devices/revoke-others', {});
      toast.success('Sve ostale sesije su prekinute.');
      const res = await apiClient.get<Record<string, unknown>>('/auth/devices');
      if (Array.isArray(res.sessions)) setSessions(res.sessions as Record<string, unknown>[]);
    } catch (e) {
      toast.error('Došlo je do greške prilikom prekidanja sesija.');
    }
  };

  return (
    <div className="bg-[#121A21] rounded-[10px] p-6 sm:p-8 border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl text-white font-black uppercase tracking-widest font-heading mb-2">Aktivne Sesije</h3>
          <p className="text-gray-400 text-sm">Upravljajte uređajima koji trenutno imaju pristup Vašem nalogu.</p>
        </div>
        <button 
          onClick={revokeOthers}
          className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-[10px] hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-wider"
        >
          Odjavi sve ostale uređaje
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="h-20 flex items-center justify-center"><span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span></div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">Nema aktivnih sesija.</div>
        ) : (
          sessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                   {String(session.userAgent || '').includes('Mobile') ? <Phone size={18} /> : <Laptop size={18} />}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{String(session.userAgent || 'Nepoznat uređaj')}</div>
                  <div className="text-gray-500 text-xs mt-1">Zadnja aktivnost:{' '}
                    {new Date(((session as { lastActive?: string | number | Date })?.lastActive as string | number | Date)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export function SecuritySettingsTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">TRENUTNA LOZINKA</label>
          <input 
            type="password"
            name="currentPassword"
            className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">NOVA LOZINKA</label>
            <input 
              type="password"
              name="newPassword"
              className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">POTVRDI LOZINKU</label>
            <input 
              type="password"
              name="confirmPassword"
              className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-4 px-6 text-xs font-bold tracking-widest uppercase focus:border-secondary transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[10px]">
        <div className="flex items-center gap-4 mb-2">
          <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">SAVET ZA BEZBEDNOST</h4>
        </div>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">
          LOZINKA TREBA DA SADRŽI NAJMANJE 8 KARAKTERA, UKLJUČUJUĆI BROJEVE I SPECIJALNE ZNAKOVE.
        </p>
      </div>

      <SessionManager />
    </motion.div>
  );
}

