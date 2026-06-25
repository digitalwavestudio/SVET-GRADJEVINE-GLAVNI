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
    <div className="bg-[#0D151D] border-b border-white/5 pt-28 pb-12 md:pt-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 lg:gap-8 bg-white/5 p-6 lg:p-10 rounded-[10px] border border-white/10 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-4 lg:gap-8 text-center md:text-left">
            <div className="w-16 h-16 lg:w-20 lg:h-20 shrink-0 rounded-[10px] bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20">
              <Trash2 size={28} className="lg:w-8 lg:h-8" />
            </div>
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <div className="flex flex-col md:flex-row items-center gap-2 lg:gap-3">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">ADMIN COMMAND CENTER</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  jobData.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                  jobData.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {jobData.status?.toUpperCase() || 'UNSET'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">UPRAVLJANJE OGLASOM</h2>
              <p className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-widest">
                PROVERI PODATKE I ODREDI STATUS OGLASA PRE OBJAVLJIVANJA
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
            <button onClick={() => navigate(-1)} className="text-xs font-black text-white/50 hover:text-white uppercase tracking-[0.2em] transition-colors py-4 md:py-0 w-full md:w-auto">
              Nazad
            </button>
            <div className="hidden md:block w-px h-12 bg-white/10 mx-2" />
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
              className="bg-red-500 hover:bg-red-400 text-white h-14 md:h-16 px-6 md:px-10 rounded-[10px] text-xs md:text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 w-full md:w-auto shrink-0"
            >
              <XCircle size={18} />
              UKLONI OGLAS
            </motion.button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4 md:px-10 text-center md:text-left">
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
            <p className="text-[11px] font-bold text-white uppercase break-all">{jobData.email || jobData.applicationEmail || 'Nije uneto'}</p>
          </div>
          <div className="space-y-1 md:text-right">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">TELEFON</span>
            <p className="text-lg md:text-xl font-black text-secondary">{jobData.phone || jobData.applicationPhone || 'Nije uneto'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
