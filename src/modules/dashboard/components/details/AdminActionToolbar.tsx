import React from 'react';
import { Edit3, Trash2, Crown, Eye, Share2, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminActionToolbarProps {
  onEdit: () => void;
  onDelete: () => void;
  onTogglePremium: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  status?: string;
  isPremium?: boolean;
  views?: number;
}

export default function AdminActionToolbar({ 
  onEdit, 
  onDelete, 
  onTogglePremium, 
  onApprove,
  onReject,
  status,
  isPremium,
  views = 0
}: AdminActionToolbarProps) {
  const isPending = status === 'pending';

  return (
    <div className="bg-surface-container-highest/80 backdrop-blur-xl border border-secondary/20 rounded-[10px] p-4 flex flex-wrap items-center justify-between gap-6 shadow-2xl mb-12">
      <div className="flex items-center gap-6 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[10px] bg-secondary/10 text-secondary">
            <Crown size={16} fill={isPremium ? "currentColor" : "none"} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">STATUS</span>
            <span className="text-[11px] font-black text-secondary uppercase tracking-widest">
              {status?.toUpperCase() || (isPremium ? 'VIP AKTIVAN' : 'STANDARDAN')}
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[10px] bg-white/5 text-white/60">
            <Eye size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">PREGLEDA</span>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{views}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-2">
        {isPending && onApprove && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onApprove}
            className="px-6 py-3 bg-emerald-500 text-white rounded-[10px] font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all"
          >
            ODOBRI
          </motion.button>
        )}
        {isPending && onReject && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReject}
            className="px-6 py-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-[10px] font-black text-[10px] uppercase tracking-widest hover:bg-red-500/30 transition-all"
          >
            ODBIJ
          </motion.button>
        )}

        {!isPremium && !isPending && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePremium}
            className="px-6 py-3 bg-secondary text-slate-950 rounded-[10px] font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all"
          >
            AKTIVIRAJ VIP
          </motion.button>
        )}
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-[10px] transition-all"
          title="Izmeni oglas"
        >
          <Edit3 size={18} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="p-3 bg-error/10 hover:bg-error/20 text-error rounded-[10px] transition-all"
          title="Obriši oglas"
        >
          <Trash2 size={18} />
        </motion.button>
        
        <button className="p-3 text-white/30 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
