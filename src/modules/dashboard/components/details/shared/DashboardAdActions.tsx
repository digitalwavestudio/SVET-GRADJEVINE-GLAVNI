import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardAdActionsProps {
  ad: any;
  size?: 'sm' | 'md'; // sm for OtherAdsList, md for Plot/Machine
  collection: string;
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DashboardAdActions({ ad, size = 'md', collection, onPromote, onApprove, onDelete }: DashboardAdActionsProps) {
  const btnSize = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <>
      <button 
        onClick={() => onPromote(ad.id, collection, false)}
        className={`${btnSize} rounded-[10px] flex items-center justify-center transition-all ${ad.isPremium ? 'bg-secondary text-slate-950 font-bold' : 'bg-white/5 text-secondary border border-white/10 hover:bg-secondary hover:text-slate-950'}`}
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
        onClick={() => onDelete(ad.id)}
        className={`${btnSize} bg-red-500/10 border border-red-500/20 rounded-[10px] flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10`}
        title="Obriši"
      >
        <span className={`material-symbols-outlined ${iconSize}`}>delete_sweep</span>
      </button>
    </>
  );
}
