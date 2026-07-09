import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Trash2 } from 'lucide-react';

interface AdminCommandCenterProps {
  jobData: any;
  deleteJob: (id: string) => Promise<any>;
}

export default function AdminCommandCenter({ jobData, deleteJob }: AdminCommandCenterProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#090D14] border-b border-red-500/10 pt-24 pb-8 md:pt-32 md:pb-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(239,68,68,0.5) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 bg-red-500/[0.02] p-5 sm:p-8 lg:p-10 rounded-2xl border border-red-500/10 backdrop-blur-3xl shadow-2xl shadow-red-950/20">
          <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-6 text-center md:text-left w-full lg:w-auto">
            <div className="w-12 h-12 lg:w-16 lg:h-16 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <Trash2 size={22} className="lg:w-6 lg:h-6" />
            </div>
            <div className="space-y-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-red-400/50 uppercase tracking-[0.25em]">ADMIN PANEL</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                  jobData.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  jobData.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {jobData.status?.toUpperCase() || 'UNSET'}
                </span>
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white tracking-tight uppercase">UPRAVLJANJE OGLASOM</h2>
              <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">
                Provera podataka i uklanjanje oglasa iz baze podataka
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <button onClick={() => navigate(-1)} className="text-xs font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-colors py-3 md:py-0 w-full md:w-auto">
              Nazad
            </button>
            <div className="hidden md:block w-px h-10 bg-white/10 mx-2" />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                if (confirm('Da li ste sigurni da želite da uklonite ovaj oglas? Ova radnja je nepovratna.')) {
                  try {
                    await deleteJob(jobData.id);
                    alert('Oglas je uklonjen.');
                    navigate('/poslovi');
                  } catch {
                    alert('Greška pri uklanjanju oglasa.');
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white h-12 md:h-14 px-6 md:px-8 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2.5 w-full md:w-auto shrink-0 border border-red-500/30"
            >
              <XCircle size={16} />
              UKLONI OGLAS
            </motion.button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-2 md:px-6 text-center md:text-left border-t border-white/5 pt-6 w-full">
          <div className="space-y-1 flex flex-col items-center md:items-start">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID OGLASA</span>
            <span className="text-xs font-mono font-black text-yellow-400 break-all select-all tracking-wide bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 inline-block mt-0.5">{jobData.id}</span>
          </div>
          <div className="space-y-1 flex flex-col items-center md:items-start">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">OGLAŠAVAČ ID</span>
            <span className="text-xs font-mono font-black text-white/90 break-all select-all tracking-wide bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 inline-block mt-0.5">{jobData.authorId || jobData.companyId}</span>
          </div>
          <div className="space-y-1 flex flex-col items-center md:items-start">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">EMAIL ADRESA</span>
            <span className="text-xs font-black text-white break-all bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 inline-block mt-0.5 select-all">{jobData.email || jobData.applicationEmail || 'Nije uneto'}</span>
          </div>
          <div className="space-y-1 flex flex-col items-center md:items-end md:text-right">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">TELEFON</span>
            <span className="text-sm font-black text-yellow-400 tracking-wide select-all bg-white/5 py-1 px-3 rounded-lg border border-white/5 inline-block mt-0.5">{jobData.phone || jobData.applicationPhone || 'Nije uneto'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
