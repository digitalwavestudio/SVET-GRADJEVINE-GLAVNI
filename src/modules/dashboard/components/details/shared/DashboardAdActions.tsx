import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardAdActionsProps {
  ad: any;
  size?: 'sm' | 'md'; // sm for OtherAdsList, md for Plot/Machine
  collection: string;
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string, type?: string) => void;
}

export function DashboardAdActions({ ad, size = 'md', collection, onPromote, onApprove, onDelete }: DashboardAdActionsProps) {
  const iconSize = size === 'sm' ? 'text-[14px]' : 'text-xl';

  if (size === 'sm') {
    // Redizajnirani dugmići za listu ostalih oglasa (poslovi...)
    return (
      <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full">
        {ad.postType === 'job' && (
          <Link 
            to={`/moj-profil/prijave?jobId=${ad.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-[8px] text-[10px] font-black text-secondary tracking-widest uppercase transition-all shadow-sm shadow-secondary/5"
            title="Pogledaj prijave kandidata"
          >
            <span className="material-symbols-outlined text-[13px]">assignment</span>
            <span className="hidden sm:inline">Prijave</span>
            <span>({ad.applicantsCount || 0})</span>
          </Link>
        )}

        <Link 
          to={`/postavi-oglas?type=${ad.postType || 'job'}&edit=${ad.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-white hover:text-blue-400 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all"
          title="Izmeni oglas"
        >
          <span className="material-symbols-outlined text-[13px]">edit</span>
          <span className="hidden sm:inline">Izmeni</span>
        </Link>

        <button 
          onClick={() => onPromote(ad.id, collection, false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${
            ad.isPremium || ad.isUrgent 
              ? 'bg-secondary text-black border-secondary hover:bg-yellow-400' 
              : 'bg-white/5 text-secondary border-white/10 hover:bg-secondary hover:text-black'
          }`}
          title="Promoviši oglas (Premium / Hitno)"
        >
          <span className="material-symbols-outlined text-[13px]">campaign</span>
          <span className="hidden sm:inline">Promoviši</span>
        </button>

        {ad.status === 'pending' && (
          <button 
            onClick={() => onApprove(ad.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all"
            title="Aktiviraj oglas"
          >
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            <span className="hidden sm:inline">Aktiviraj</span>
          </button>
        )}

        <button 
          onClick={() => onDelete(ad.id, ad.postType)}
          className="flex items-center justify-center w-8 h-8 bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white rounded-[8px] transition-all"
          title="Obriši"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>
    );
  }

  // Podrazumevani stil za mašine i placeve (velike ikonice)
  const btnSize = 'w-12 h-12';
  return (
    <>
      <button 
        onClick={() => onPromote(ad.id, collection, false)}
        className={`${btnSize} rounded-[10px] flex items-center justify-center transition-all ${ad.isPremium ? 'bg-secondary !text-black font-bold' : 'bg-white/5 text-secondary border border-white/10 hover:bg-secondary hover:!text-black'}`}
        title={ad.isPremium ? 'Premium oglas' : 'Izdvoj kao Premium'}
      >
        <span className={`material-symbols-outlined ${iconSize}`} style={ad.isPremium ? { fontVariationSettings: "'FILL' 1" } : {}}>hotel_class</span>
      </button>
      
      <button 
        onClick={() => onPromote(ad.id, collection, true)}
        className={`${btnSize} rounded-[10px] flex items-center justify-center transition-all ${ad.isUrgent ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-white/5 border border-white/10 text-orange-500 hover:bg-orange-500 hover:text-white'}`}
        title={ad.isUrgent ? 'Hitno' : 'Označi kao Hitno'}
      >
        <span className={`material-symbols-outlined ${iconSize}`} style={ad.isUrgent ? { fontVariationSettings: "'FILL' 1" } : {}}>bolt</span>
      </button>

      <Link 
        to={`/postavi-oglas?type=${ad.postType || 'machine'}&edit=${ad.id}`}
        className={`${btnSize} rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all`}
        title="Izmeni oglas"
      >
        <span className={`material-symbols-outlined ${iconSize}`}>edit_note</span>
      </Link>

      {ad.status === 'pending' && (
        <button 
          onClick={() => onApprove(ad.id)}
          className={`${btnSize} bg-green-500/10 border border-green-500/20 rounded-[10px] flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm shadow-green-500/10`}
          title="Aktiviraj (Simulacija)"
        >
          <span className={`material-symbols-outlined ${iconSize}`}>check_circle</span>
        </button>
      )}

      <button 
        onClick={() => onDelete(ad.id, ad.postType)}
        className={`${btnSize} bg-red-500/10 border border-red-500/20 rounded-[10px] flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10`}
        title="Obriši"
      >
        <span className={`material-symbols-outlined ${iconSize}`}>delete_sweep</span>
      </button>
    </>
  );
}
