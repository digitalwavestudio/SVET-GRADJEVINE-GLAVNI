import React from 'react';
import { Link } from 'react-router-dom';
import { ModerationItem } from '@/src/services/moderationService';

interface ModerationQueueItemProps {
  item: ModerationItem;
  processingId: string | null;
  getDetailLink: (item: ModerationItem) => string;
  onOpenEdit: (item: ModerationItem) => void;
  onReject: (collName: string, id: string) => void;
  onApprove: (collName: string, id: string) => void;
}

export function ModerationQueueItem({
  item,
  processingId,
  getDetailLink,
  onOpenEdit,
  onReject,
  onApprove
}: ModerationQueueItemProps) {
  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 hover:border-secondary/30 transition-all group">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8">
        {/* Job Info */}
        <div className="flex-1 flex gap-8 items-center">
          <div className="w-24 h-24 bg-white/[0.03] border border-white/5 rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden">
            {item.logo || (Array.isArray(item.images) && item.images[0]) ? (
              <img width="800" height="600" decoding="async" src={(item.logo as string) || (item.images as string[])[0]} alt="Logo" className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <span className="material-symbols-outlined text-white/10 text-4xl">business</span>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/5 text-white/40 text-[9px] font-black rounded-[10px] uppercase tracking-widest">{item._typeLabel as string}</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{(item.cat as string) || (item.category as string) || 'OSTALO'}</span>
              {item.status === 'pending_payment' && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-[10px] uppercase tracking-widest border border-amber-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">payments</span>
                  ČEKA UPLATU
                </span>
              )}
            </div>
            <h4 className="text-xl font-black text-white uppercase tracking-tight">{(item.title as string) || (item.name as string)}</h4>
            <div className="flex items-center gap-6 text-[10px] font-bold text-white/30 uppercase tracking-widest">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">business</span> {(item.comp as string) || (item.company as string) || (item.name as string)}</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">location_on</span> {(item.loc as string) || (item.location as string)}</span>
            </div>
          </div>
        </div>

        {/* Quick details */}
        <div className="flex items-center gap-12 border-l border-white/5 pl-12 lg:min-w-[300px]">
          <div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">CENA / PLATA</div>
            <div className="text-sm font-black text-white">{(item.price as string | number) || (item.sal as string | number) || 'DOGOVOR'}</div>
          </div>
          <div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">PROFIL</div>
            <div className={`px-3 py-1 rounded-[10px] text-[9px] font-black uppercase ${item.isPremium ? 'bg-secondary/10 text-secondary' : 'bg-white/5 text-white/40'}`}>
              {item.isPremium ? 'PREMIUM' : 'STANDARD'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 lg:min-w-[400px]">
          <button 
            onClick={() => onOpenEdit(item)}
            className="py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-[10px] text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <Link 
            to={getDetailLink(item)}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-[10px] text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">visibility</span>
            DETALJI
          </Link>
          <button 
            onClick={() => onReject(item._collection, item.id)}
            disabled={processingId === item.id}
            className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black rounded-[10px] text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            ODBIJ
          </button>
          <button 
            onClick={() => onApprove(item._collection, item.id)}
            disabled={processingId === item.id}
            className="flex-[2] py-4 bg-green-500 !text-black font-black rounded-[10px] text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {processingId === item.id ? (
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                ODOBRI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

