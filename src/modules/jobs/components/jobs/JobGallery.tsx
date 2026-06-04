import React from 'react';

interface JobGalleryProps {
  images: string[];
  showAllImages: boolean;
  setShowAllImages: (show: boolean) => void;
}

export function JobGallery({ images, showAllImages, setShowAllImages }: JobGalleryProps) {
  if (!images || images.length === 0) return null;

  const displayImages = showAllImages ? images : images.slice(0, 3);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-white font-headline flex items-center gap-3 px-2 uppercase">
        <span className="material-symbols-outlined text-secondary">image</span>
        Galerija slika ({images.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {displayImages.map((img, idx) => (
          <div key={idx} className="aspect-square rounded-[10px] overflow-hidden border border-white/5 group relative cursor-pointer shadow-lg">
            <img width="800" height="600" decoding="async" 
              src={img} 
              alt={`Gallery ${idx + 1}`} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              loading="lazy" 
            />
            {!showAllImages && idx === 2 && images.length > 3 && (
              <div 
                className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/40 transition-all"
                onClick={(e) => { e.stopPropagation(); setShowAllImages(true); }}
              >
                <span className="text-white font-black uppercase tracking-widest text-sm">+ Još {images.length - 3} slika</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {showAllImages && images.length > 3 && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => setShowAllImages(false)}
            className="text-secondary font-bold text-sm hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">expand_less</span>
            Prikaži manje
          </button>
        </div>
      )}
    </div>
  );
}
