import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAdminModeration } from '@/src/modules/admin/hooks/useAdminModeration';
import { useDebounce } from '@/src/hooks/useDebounce';
import { moderationService } from '@/src/services/moderationService';
import { getAuth } from 'firebase/auth';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { apiClient } from '@/src/lib/apiClient';

import { ModerationItem, ModerationItemType } from '@/src/services/moderationService';

interface ModerationTabProps {
  getDetailLink: (item: ModerationItem) => string;
}

export function ModerationTab({ getDetailLink }: ModerationTabProps) {
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);

  const { pendingQueue, isQueueLoading, processingId, setProcessingId, removePendingItem, fetchMore, refetch, hasMore, isFetchingMore } = useAdminModeration(debouncedQuery);
  const [editingItem, setEditingItem] = React.useState<ModerationItem | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');

  const handleGlobalApprove = async (collName: string, id: string, itemData?: ModerationItem) => {
    if (!navigator.onLine) {
      alert("Niste povezani na mrežu. Sve akcije odobravanja i odbijanja oglasa su privremeno onemogućene kada ste offline.");
      return;
    }
    setProcessingId(id);
    try {
      const auth = getAuth();
      const adminId = auth.currentUser?.uid || 'system';

      await moderationService.executeModerationAction({
        adminId,
        collectionName: collName,
        targetId: id,
        action: 'approve'
      }, itemData);
      
      removePendingItem(id);
      alert("Oglas odobren!");
    } catch (err) {
      console.error("Moderation Error (Approve):", err);
      alert("Greška pri odobravanju");
    } finally {
      if (processingId === id) setProcessingId(null);
    }
  };

  const handleGlobalReject = async (collName: string, id: string) => {
    if (!navigator.onLine) {
      alert("Niste povezani na mrežu. Sve akcije odobravanja i odbijanja oglasa su privremeno onemogućene kada ste offline.");
      return;
    }
    const reason = window.prompt("Upišite razlog odbijanja (opciono):");
    if (reason === null) return;
    setProcessingId(id);
    try {
      const auth = getAuth();
      const adminId = auth.currentUser?.uid || 'system';

      await moderationService.executeModerationAction({
        adminId,
        collectionName: collName,
        targetId: id,
        action: 'reject',
        reason
      });

      removePendingItem(id);
      alert("Oglas je odbijen.");
    } catch (err) {
      console.error("Moderation Error (Reject):", err);
      alert("Greška pri odbijanju oglasa");
    } finally {
      if (processingId === id) setProcessingId(null);
    }
  };

  const handleOpenEdit = (item: ModerationItem) => {
    setEditingItem(item);
    setEditTitle((item.title as string) || (item.name as string) || '');
    setEditDesc((item.description as string) || (item.desc as string) || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!navigator.onLine) {
      alert("Niste povezani na mrežu. Izmena i čuvanje oglasa su onemogućeni dok ste van mreže.");
      return;
    }
    setProcessingId(editingItem.id);
    try {
      const updates = {
        ...(editingItem.title !== undefined ? { title: editTitle } : { name: editTitle }),
        ...(editingItem.description !== undefined ? { description: editDesc } : { desc: editDesc })
      };
      await apiClient.patch(`/admin/moderate/${editingItem._collection}/${editingItem.id}`, { updates });
      alert('Oglas sačuvan!');
      setEditingItem(null);
      refetch();
    } catch (err) {
      console.error(err);
      alert('Greška pri čuvanju.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div 
      key="moderation"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
       <div className="bg-white/5 border border-white/10 rounded-[10px] p-8 flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-red-500/10 rounded-[10px] flex items-center justify-center border border-red-500/20">
                <span className="material-symbols-outlined text-red-500 text-3xl">queue</span>
             </div>
             <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">QUEZA ZA ODOBRAVANJE</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{pendingQueue.length} OGLASA ČEKA NA VAŠU ODLUKE</p>
             </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-lg">search</span>
                <input 
                  aria-label="Unos polja" 
                  type="text" 
                  placeholder="Pretraži..." 
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all w-64" 
                />
             </div>
             <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all">FILTRIRAJ</button>
             <button 
                onClick={() => refetch()}
                className="px-6 py-3 bg-secondary text-slate-950 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
             >
                OSVEŽI RED
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {isQueueLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1 flex gap-8 items-center">
                      <Skeleton className="w-24 h-24 rounded-[10px]" />
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Skeleton className="w-16 h-5 rounded-[10px]" />
                          <Skeleton className="w-24 h-5 rounded-[10px]" />
                        </div>
                        <Skeleton className="w-64 h-6" variant="text" />
                        <div className="flex gap-4">
                          <Skeleton className="w-32 h-3" variant="text" />
                          <Skeleton className="w-32 h-3" variant="text" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-8 border-l border-white/5 pl-12 lg:min-w-[300px]">
                      <div className="space-y-2">
                        <Skeleton className="w-20 h-2" variant="text" />
                        <Skeleton className="w-28 h-5" variant="text" />
                      </div>
                    </div>
                    <div className="flex gap-4 lg:min-w-[400px]">
                      <Skeleton className="w-12 h-14 rounded-[10px]" />
                      <Skeleton className="w-32 h-14 rounded-[10px]" />
                      <Skeleton className="w-32 h-14 rounded-[10px]" />
                      <Skeleton className="w-48 h-14 rounded-[10px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingQueue.length > 0 ? pendingQueue.map((item: ModerationItem) => (
            <div key={item.id} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 hover:border-secondary/30 transition-all group">
               <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                  {/* Job Info */}
                  <div className="flex-1 flex gap-8 items-center">
                     <div className="w-24 h-24 bg-white/[0.03] border border-white/5 rounded-[10px] flex items-center justify-center shrink-0">
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
                        onClick={() => handleOpenEdit(item)}
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
                        onClick={() => handleGlobalReject(item._collection, item.id)}
                        disabled={processingId === item.id}
                        className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black rounded-[10px] text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        <span className="material-symbols-outlined text-lg">close</span>
                        ODBIJ
                     </button>
                     <button 
                        onClick={() => handleGlobalApprove(item._collection, item.id)}
                        disabled={processingId === item.id}
                        className="flex-[2] py-4 bg-green-500 text-slate-950 font-black rounded-[10px] text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                     >
                        {processingId === item.id ? (
                           <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
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
          )) : (
            <div className="py-32 text-center bg-[#0A0F14] border border-dashed border-white/10 rounded-[10px]">
               <div className="w-20 h-20 bg-green-500/10 rounded-[10px] flex items-center justify-center mb-8 mx-auto">
                  <span className="material-symbols-outlined text-green-500 text-4xl">verified</span>
               </div>
               <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">SVE JE ČISTO!</h4>
               <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">TRENUTNO NEMA NOVIH OGLASA KOJI ČEKAJU ODOBRANJE</p>
            </div>
          )}
          {hasMore && !isQueueLoading && pendingQueue.length > 0 && (
             <div className="flex justify-center mt-8">
               <button 
                 onClick={() => fetchMore()}
                 disabled={isFetchingMore}
                 className="px-8 py-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-black rounded-[10px] text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isFetchingMore ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">refresh</span>
                      UČITAJ JOŠ
                    </>
                 )}
               </button>
             </div>
          )}
       </div>

       {/* Edit Modal */}
       {editingItem && (
         <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
           <div className="bg-[#0A0F14] border border-white/10 p-6 rounded-[10px] w-full max-w-2xl">
             <h3 className="text-xl font-black text-white mb-4">IZMENI OGLAS</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest pl-4 mb-2">NASLOV</label>
                 <input 
                   type="text" 
                   value={editTitle} 
                   onChange={(e) => setEditTitle(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-white font-bold"
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest pl-4 mb-2">OPIS</label>
                 <textarea 
                   rows={6}
                   value={editDesc} 
                   onChange={(e) => setEditDesc(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-white font-bold"
                 />
               </div>
             </div>
             <div className="flex justify-end gap-4 mt-6">
               <button 
                 onClick={() => setEditingItem(null)}
                 className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-white/50 hover:text-white"
               >
                 OTKAŽI
               </button>
               <button 
                 onClick={handleSaveEdit}
                 disabled={processingId === editingItem.id}
                 className="px-8 py-3 bg-secondary text-slate-950 font-black rounded-[10px] text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center disabled:opacity-50"
               >
                 {processingId === editingItem.id ? 'ČUVANJE...' : 'SAČUVAJ OGLAS'}
               </button>
             </div>
           </div>
         </div>
       )}
    </motion.div>
  );
}
