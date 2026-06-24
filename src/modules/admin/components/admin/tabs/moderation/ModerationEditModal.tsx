import React from 'react';
import { ModerationItem } from '@/src/services/moderationService';

interface ModerationEditModalProps {
  editingItem: ModerationItem;
  editTitle: string;
  editDesc: string;
  processingId: string | null;
  setEditTitle: (val: string) => void;
  setEditDesc: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function ModerationEditModal({
  editingItem,
  editTitle,
  editDesc,
  processingId,
  setEditTitle,
  setEditDesc,
  onClose,
  onSave
}: ModerationEditModalProps) {
  return (
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
            onClick={onClose}
            className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-white/50 hover:text-white"
          >
            OTKAŽI
          </button>
          <button 
            onClick={onSave}
            disabled={processingId === editingItem.id}
            className="px-8 py-3 bg-secondary !text-black font-black rounded-[10px] text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center disabled:opacity-50"
          >
            {processingId === editingItem.id ? 'ČUVANJE...' : 'SAČUVAJ OGLAS'}
          </button>
        </div>
      </div>
    </div>
  );
}
