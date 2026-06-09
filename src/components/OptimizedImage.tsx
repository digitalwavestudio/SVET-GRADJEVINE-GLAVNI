import React, { useState } from 'react';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { Building2, User, Image as ImageIcon, HardHat, Briefcase, Sofa, Utensils, Wrench } from 'lucide-react';

type FallbackType = 'default' | 'user' | 'company' | 'ad' | 'machine' | 'real_estate' | 'accommodation' | 'catering' | 'jobs';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  placeholder?: string;
  fallbackType?: FallbackType;
  fallbackText?: string;
  containerClassName?: string;
  isProcessing?: boolean;
}

const FallbackComponent = ({ type, text, className }: { type: FallbackType, text?: string, className?: string }) => {
  const getIcon = () => {
    switch (type) {
      case 'user': return <User className="w-1/3 h-1/3 text-white/20" />;
      case 'company': return <Building2 className="w-1/3 h-1/3 text-white/20" />;
      case 'machine': return <Wrench className="w-1/3 h-1/3 text-white/20" />;
      case 'real_estate': return <Building2 className="w-1/3 h-1/3 text-white/20" />;
      case 'accommodation': return <Sofa className="w-1/3 h-1/3 text-white/20" />;
      case 'catering': return <Utensils className="w-1/3 h-1/3 text-white/20" />;
      case 'jobs': return <Briefcase className="w-1/3 h-1/3 text-white/20" />;
      case 'ad': 
      case 'default':
      default: return <ImageIcon className="w-1/3 h-1/3 text-white/20" />;
    }
  };

  // Modern architectural/structural pattern based on Type
  const getPatternClass = () => {
    switch(type) {
      case 'jobs': return 'bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px]';
      case 'machine': return 'bg-[linear-gradient(45deg,#ffffff05_25%,transparent_25%,transparent_50%,#ffffff05_50%,#ffffff05_75%,transparent_75%,transparent)] [background-size:40px_40px]';
      case 'real_estate': return 'bg-[linear-gradient(#ffffff05_1px,transparent_1px),linear-gradient(90deg,#ffffff05_1px,transparent_1px)] [background-size:30px_30px]';
      default: return 'bg-white/[0.02]';
    }
  };

  return (
    <div className={`w-full h-full bg-[#0F172A] flex flex-col items-center justify-center border border-white/5 relative overflow-hidden ${getPatternClass()} ${className || ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40 pointer-events-none"></div>
      {text ? (
        <span className="font-black text-white/30 uppercase text-2xl tracking-widest select-none relative z-10">{text.charAt(0)}</span>
      ) : (
        <div className="relative z-10 opacity-40 group-hover:opacity-60 transition-opacity">
          {getIcon()}
        </div>
      )}
    </div>
  );
};

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  containerClassName = '',
  fallback,
  placeholder,
  fallbackType = 'default',
  fallbackText,
  isProcessing,
  ...props 
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const hasValidSrc = Boolean(src && src !== '' && !src.includes('picsum.photos') && !src.includes('images.unsplash.com'));

  if (isProcessing) {
    return (
      <div className={`relative overflow-hidden bg-surface-container-high animate-pulse flex flex-col items-center justify-center border border-white/5 ${containerClassName || className}`}>
        <span className="material-symbols-outlined text-4xl text-secondary mb-2 animate-spin">sync</span>
        <span className="text-white/40 font-bold tracking-widest text-[10px] uppercase">Obrada...</span>
      </div>
    );
  }

  if (!hasValidSrc || error) {
    return (
      <div className={`relative overflow-hidden ${containerClassName || className}`}>
        {fallback ? (
          <img src={fallback} alt="Fallback" className={`${className} object-cover`} />
        ) : (
          <FallbackComponent type={fallbackType} text={fallbackText} className={className} />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName || className}`}>
      {/* 
        High-Performance Blur-Up Layer
        Shows LQIP as a tiny blurred background until full image arrives
      */}
      {loading && placeholder && (
        <div 
          className={`absolute inset-0 z-[5] w-full h-full blur-xl scale-110 transition-opacity duration-700 ${className}`}
          style={{ 
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {loading && !placeholder && (
        <Skeleton className={`absolute inset-0 z-10 w-full h-full ${className}`} />
      )}
      
      <img
        src={src}
        alt={alt}
        srcSet={src}
        sizes="(max-width: 640px) 100vw, 50vw"
        className={`${className} ${loading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'} transition-all duration-700 ease-out z-[6] relative`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
}
