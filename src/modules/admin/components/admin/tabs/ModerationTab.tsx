import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAdminModeration } from '@/src/modules/admin/hooks/useAdminModeration';
import { useDebounce } from '@/src/hooks/useDebounce';
import { moderationService } from '@/src/services/moderationService';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { apiClient } from '@/src/lib/apiClient';

import { ModerationItem, ModerationItemType } from '@/src/services/moderationService';
import { ModerationQueueItem } from './moderation/ModerationQueueItem';
import { ModerationEditModal } from './moderation/ModerationEditModal';
import { ModerationSkeleton } from './moderation/ModerationSkeleton';
import { ModerationFilters } from './moderation/ModerationFilters';

interface ModerationTabProps {
  getDetailLink: (item: ModerationItem) => string;
}

export function ModerationTab({ getDetailLink }: ModerationTabProps) {
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);

  const { pendingQueue, isQueueLoading, processingId, setProcessingId, removePendingItem, fetchMore, refetch, hasMore, isFetchingMore } = useAdminModeration(debouncedQuery);
  const [editState, setEditState] = React.useState<{ item: ModerationItem | null; title: string; desc: string }>({
    item: null,
    title: '',
    desc: ''
  });

  const handleGlobalApprove = async (collName: string, id: string, itemData?: ModerationItem) => {
    if (!navigator.onLine) {
      alert("Niste povezani na mrežu. Sve akcije odobravanja i odbijanja oglasa su privremeno onemogućene kada ste offline.");
      return;
    }
    setProcessingId(id);
    try {
      const { getAuth } = await import('firebase/auth');
      const adminId = getAuth().currentUser?.uid || 'system';

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
      const { getAuth } = await import('firebase/auth');
      const adminId = getAuth().currentUser?.uid || 'system';

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
    setEditState({
      item,
      title: (item.title as string) || (item.name as string) || '',
      desc: (item.description as string) || (item.desc as string) || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editState.item) return;
    if (!navigator.onLine) {
      alert("Niste povezani na mrežu. Izmena i čuvanje oglasa su onemogućeni dok ste van mreže.");
      return;
    }
    setProcessingId(editState.item.id);
    try {
      const updates = {
        ...(editState.item.title !== undefined ? { title: editState.title } : { name: editState.title }),
        ...(editState.item.description !== undefined ? { description: editState.desc } : { desc: editState.desc })
      };
      await apiClient.patch(`/admin/moderate/${editState.item._collection}/${editState.item.id}`, { updates });
      alert('Oglas sačuvan!');
      setEditState(prev => ({ ...prev, item: null }));
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
       <ModerationFilters 
          pendingCount={pendingQueue.length}
          localQuery={localQuery}
          setLocalQuery={setLocalQuery}
          onRefresh={refetch}
       />

       <div className="grid grid-cols-1 gap-4">
          {isQueueLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ModerationSkeleton key={i} />
              ))}
            </div>
          ) : pendingQueue.length > 0 ? pendingQueue.map((item: ModerationItem) => (
            <ModerationQueueItem 
              key={item.id}
              item={item}
              processingId={processingId}
              getDetailLink={getDetailLink}
              onOpenEdit={handleOpenEdit}
              onReject={handleGlobalReject}
              onApprove={handleGlobalApprove}
            />
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
       {editState.item && (
         <ModerationEditModal 
            editingItem={editState.item}
            editTitle={editState.title}
            editDesc={editState.desc}
            processingId={processingId}
            setEditTitle={(title) => setEditState(prev => ({ ...prev, title }))}
            setEditDesc={(desc) => setEditState(prev => ({ ...prev, desc }))}
            onClose={() => setEditState(prev => ({ ...prev, item: null }))}
            onSave={handleSaveEdit}
         />
       )}
    </motion.div>
  );
}
