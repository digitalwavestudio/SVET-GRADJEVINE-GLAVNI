import { useState } from 'react';
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
      <div className="relative aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] rounded-[10px] overflow-hidden bg-[#0a0a0a] group shadow-2xl flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Blurred Background to Fill Aspect Ratio gaps */}
          <motion.img
            key={`blur-${activeIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            src={images[activeIndex]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-[40px] scale-125 opacity-30 select-none pointer-events-none"
            aria-hidden="true"
          />
          {/* Sharp Subject Image */}
          <motion.img
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(event, info) => {
              const swipeThreshold = 50;
              if (info.offset.x < -swipeThreshold) {
                next();
              } else if (info.offset.x > swipeThreshold) {
                prev();
              }
            }}
            src={images[activeIndex]}
            alt={`${title || 'Media'} ${activeIndex + 1}`}
            className="relative z-10 w-full h-full object-contain cursor-grab active:cursor-grabbing drop-shadow-2xl"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            width={1200}
            height={800}
          />
        </AnimatePresence>

        {/* Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center z-10">
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
        <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest z-10">
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

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4"
          >
            {/* Close button */}
            <button 
              onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Main Image */}
            <div className="relative max-w-5xl w-full aspect-[16/9] overflow-hidden rounded-xl bg-black">
              <motion.img
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(event, info) => {
                  const swipeThreshold = 50;
                  if (info.offset.x < -swipeThreshold) {
                    next();
                  } else if (info.offset.x > swipeThreshold) {
                    prev();
                  }
                }}
                src={images[activeIndex]}
                className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
              />
              
              {/* Prev/Next Buttons */}
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Thumbnail Navigation */}
            <div className="mt-8 flex gap-3 overflow-x-auto max-w-full pb-2 no-scrollbar px-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`relative w-16 h-16 rounded-[8px] overflow-hidden border-2 shrink-0 transition-all ${
                    activeIndex === i ? 'border-secondary scale-95' : 'border-transparent'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
