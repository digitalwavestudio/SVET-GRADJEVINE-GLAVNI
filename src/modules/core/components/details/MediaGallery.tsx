import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface MediaGalleryProps {
  images: string[];
  title?: string;
  imageStatus?: string;
}

export default function MediaGallery({ images, title, imageStatus }: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (imageStatus === 'processing') {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[16/9] rounded-[10px] overflow-hidden bg-surface-container-low border border-white/5 animate-pulse flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 animate-spin">sync</span>
          <span className="text-white/40 font-bold tracking-widest text-xs uppercase">Slike se obrađuju...</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative aspect-square rounded-[10px] overflow-hidden border border-white/5 bg-surface-container-low animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) return null;

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative aspect-[16/9] rounded-[10px] overflow-hidden bg-surface-container-low group shadow-sm">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            src={images[activeIndex]}
            alt={`${title || 'Media'} ${activeIndex + 1}`}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            width={1200}
            height={800}
          />
        </AnimatePresence>

        {/* Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="p-3 rounded-[10px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="p-3 rounded-[10px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => setFullscreen(true)}
            className="p-3 rounded-[10px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Counter Badge */}
        <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails Bento */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`relative aspect-square rounded-[10px] overflow-hidden border-2 transition-all duration-300 ${
              activeIndex === i ? 'border-secondary scale-95' : 'border-transparent hover:border-white/20'
            }`}
          >
            <img loading="lazy" decoding="async" width={200} height={200} src={img} alt="thumbnail" className="w-full h-full object-cover" />
            {activeIndex !== i && <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />}
          </button>
        ))}
      </div>

      {/* Fullscreen Modal Logic Placeholder */}
      {/* Ovde bi išao Portal za fullscreen pregled */}
    </div>
  );
}
