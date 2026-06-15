import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2 } from 'lucide-react';
import { JobResponse } from '@/src/modules/jobs/types/models';

interface AdminCommandCenterProps {
  jobData: any;
  updateJob: (params: { id: string; updates: any }) => Promise<any>;
}

export default function AdminCommandCenter({ jobData, updateJob }: AdminCommandCenterProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0D151D] border-b border-white/5 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-white/5 p-10 rounded-[10px] border border-white/10 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[10px] bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20 animate-pulse">
              <Zap size={32} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">ADMIN COMMAND CENTER</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  jobData.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                  jobData.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {jobData.status?.toUpperCase() || 'UNSET'}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">UPRAVLJANJE OGLASOM</h2>
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest">
                PROVERI PODATKE I ODREDI STATUS OGLASA PRE OBJAVLJIVANJA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {jobData.status === 'pending' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (confirm('Odobriti oglas?')) {
                      await updateJob({ id: jobData.id, updates: { status: 'active' } });
                      alert('Oglas je sada aktivan.');
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-16 px-10 rounded-[10px] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                >
                  <CheckCircle2 size={18} />
                  ODOBRI OGLAS
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    const reason = prompt('Razlog odbijanja oglas:');
                    if (reason !== null) {
                      await updateJob({ id: jobData.id, updates: { status: 'rejected', rejectionReason: reason } as Partial<JobResponse> & { rejectionReason: string } });
                      alert('Oglas je odbijen.');
                      navigate('/admin');
                    }
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-16 px-10 rounded-[10px] text-sm font-black uppercase tracking-widest transition-all flex items-center gap-3"
                >
                  ODBIJ OGLAS
                </motion.button>
              </>
            )}
            {jobData.status === 'active' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => updateJob({ id: jobData.id, updates: { status: 'pending' } })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-16 px-10 rounded-[10px] text-sm font-black uppercase tracking-widest transition-all"
              >
                VRATI NA ČEKANJE
              </motion.button>
            )}
            <div className="w-px h-12 bg-white/10 mx-2" />
            <button onClick={() => navigate('/admin')} className="text-xs font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-colors">
              Zatvori
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 px-10">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID OGLASA</span>
            <p className="text-[11px] font-mono text-secondary break-all">{jobData.id}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">OGLAŠAVAČ ID</span>
            <p className="text-[11px] font-mono text-white/60 break-all">{jobData.authorId || jobData.companyId}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">EMAIL ADRESA</span>
            <p className="text-[11px] font-bold text-white uppercase">{jobData.email || jobData.applicationEmail || 'Nije uneto'}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">TELEFON</span>
            <p className="text-xl font-black text-secondary">{jobData.phone || jobData.applicationPhone || 'Nije uneto'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
