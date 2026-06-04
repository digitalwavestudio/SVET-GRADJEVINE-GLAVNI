import React from 'react';
import { Link } from 'react-router-dom';
import { Conversation } from '@/src/context/MessagesContext';

interface ContextSidebarProps {
  selectedConv: Conversation | undefined;
}

export function ContextSidebar({ selectedConv }: ContextSidebarProps) {
  const getAdLink = (conv: Conversation) => {
    if (!conv.adId) return null;
    switch (conv.adType) {
      case 'job': return `/posao/${conv.adId}`;
      case 'machine': return `/gradjevinske-masine/${conv.adId}`;
      case 'accommodation': return `/smestaj/${conv.adId}`;
      default: return null;
    }
  };

  return (
    <div className="hidden xl:flex w-80 border-l border-white/5 flex-col bg-[#070B0F]/50 p-8">
      <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-8 text-center">KONTEKST RAZGOVORA</h3>
      
      <div className="space-y-8">
        {selectedConv?.adId ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-[10px] p-6 text-center group hover:border-secondary/30 transition-all">
            <div className="w-16 h-16 bg-secondary/10 rounded-[10px] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl">
                {selectedConv.adType === 'job' ? 'work' : selectedConv.adType === 'machine' ? 'construction' : 'hotel'}
              </span>
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1 line-clamp-2">{selectedConv.adTitle}</h4>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-6">{selectedConv.adType?.toUpperCase()}</p>
            <Link 
              to={getAdLink(selectedConv) || '#'}
              className="w-full py-3 bg-white/5 rounded-[10px] text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all block"
            >
              POGLEDAJ OGLAS
            </Link>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 rounded-[10px] p-6 text-center text-white/10">
            <span className="material-symbols-outlined text-4xl mb-2">info</span>
            <p className="text-[10px] font-black uppercase">Direktna poruka</p>
          </div>
        )}

        {/* Quick Details */}
        {selectedConv?.adId && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">ID OGLASA</span>
              <span className="text-[10px] font-black text-white uppercase tracking-tight">#{selectedConv.adId.substring(0,6)}</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">TIP</span>
              <span className="text-[10px] font-black text-secondary uppercase tracking-tight">{selectedConv.adType?.toUpperCase()}</span>
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-white/5">
          <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">DOKUMENTACIJA</h4>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-[10px] hover:bg-white/5 transition-all group">
              <span className="material-symbols-outlined text-secondary text-lg">description</span>
              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">CV_MARKO_PERIC.PDF</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-[10px] hover:bg-white/5 transition-all group">
              <span className="material-symbols-outlined text-secondary text-lg">image</span>
              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">SERTIFIKAT_RAD.JPG</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button className="w-full bg-error/10 text-error border border-error/20 font-black py-4 rounded-[10px] hover:bg-error hover:text-white transition-all text-[10px] tracking-[0.2em] uppercase">
          BLOKIRAJ KORISNIKA
        </button>
      </div>
    </div>
  );
}
