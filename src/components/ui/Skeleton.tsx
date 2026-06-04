import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', variant = 'rect', style }: SkeletonProps) {
  const baseClass = "relative overflow-hidden bg-white/5 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";
  
  const variantClasses = {
    rect: "rounded-[10px]",
    circle: "rounded-full",
    text: "rounded-[10px] h-4"
  };

  return (
    <div className={`${baseClass} ${variantClasses[variant]} ${className}`} style={style} />
  );
}
