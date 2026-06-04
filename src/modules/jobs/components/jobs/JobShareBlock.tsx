import React from 'react';

export function JobShareBlock() {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="bg-surface-container-high rounded-[10px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
      <span className="text-white font-bold text-lg uppercase tracking-tight">Podelite ovaj oglas sa kolegama:</span>
      <div className="flex gap-4">
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-[10px] bg-[#3b5998] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
          aria-label="Podeli na Facebook-u"
        >
          <span className="material-symbols-outlined">share</span>
        </a>
        <a 
          href={`viber://forward?text=${encodeURIComponent(shareUrl)}`}
          className="w-12 h-12 rounded-[10px] bg-[#7360f2] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
          aria-label="Podeli na Viber-u"
        >
          <span className="material-symbols-outlined">chat</span>
        </a>
        <a 
          href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-[10px] bg-[#25d366] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
          aria-label="Podeli na WhatsApp-u"
        >
          <span className="material-symbols-outlined">forum</span>
        </a>
        <button 
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="w-12 h-12 rounded-[10px] bg-surface-container-highest flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
          aria-label="Kopiraj link"
        >
          <span className="material-symbols-outlined">link</span>
        </button>
      </div>
    </div>
  );
}
